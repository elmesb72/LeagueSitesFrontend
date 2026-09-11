// Conversions between the API's SeedGroup rules and the board's per-seed slots,
// plus the classification that colours each connector.

import type { SeedGroup } from '$lib/models/Tournament';
import {
	parseSourceKey,
	sameAssignment,
	sourceKey,
	type Assignment,
	type BoardState,
	type LineState,
	type SeedSlot
} from './model';

/**
 * Rules → slots. `seeds` are the seed numbers the bracket actually uses (its `#n`
 * spots). Seeds a rule fills that the bracket does not use are kept as orphan
 * slots so nothing the executive wrote disappears. With no `seeds` (a new
 * bracket), the slots are whatever the rules cover.
 */
export function decompile(seeding: SeedGroup[], seeds: number[] = []): SeedSlot[] {
	const bySeed = new Map<number, Assignment>();
	for (const rule of seeding) {
		const key = sourceKey(rule);
		for (let seed = rule.outputStart; seed <= rule.outputEnd; seed++) {
			bySeed.set(seed, { sourceKey: key, rank: rule.rankStart + (seed - rule.outputStart) });
		}
	}

	const wanted = [...new Set(seeds)].sort((a, b) => a - b);
	const slots: SeedSlot[] = wanted.map((seed) => ({
		seed,
		assignment: bySeed.get(seed) ?? null,
		orphan: false
	}));

	const extra = [...bySeed.keys()].filter((seed) => !wanted.includes(seed)).sort((a, b) => a - b);
	for (const seed of extra) {
		slots.push({ seed, assignment: bySeed.get(seed)!, orphan: wanted.length > 0 });
	}
	return slots.sort((a, b) => a.seed - b.seed);
}

/**
 * Slots → rules, in minimal range form: consecutive seeds with consecutive ranks
 * from one source collapse into a single rule. Empty slots produce nothing.
 * By construction the output has no duplicate seeds and equal seed/rank counts.
 */
export function compile(slots: SeedSlot[]): SeedGroup[] {
	const ordered = [...slots].sort((a, b) => a.seed - b.seed);
	const groups: SeedGroup[] = [];
	let current: SeedGroup | null = null;
	let currentKey = '';

	for (const slot of ordered) {
		if (!slot.assignment) {
			current = null;
			continue;
		}
		const { sourceKey: key, rank } = slot.assignment;
		if (
			current &&
			currentKey === key &&
			rank === current.rankEnd + 1 &&
			slot.seed === current.outputEnd + 1
		) {
			current.rankEnd = rank;
			current.outputEnd = slot.seed;
			continue;
		}
		const source = parseSourceKey(key);
		current = {
			outputStart: slot.seed,
			outputEnd: slot.seed,
			result: source.result,
			sourceType: source.sourceType,
			sourceID: source.sourceID,
			rankStart: rank,
			rankEnd: rank
		};
		currentKey = key;
		groups.push(current);
	}
	return groups;
}

/** True when both slot lists assign the same thing to the same seeds. */
export function sameAssignments(a: SeedSlot[], b: SeedSlot[]): boolean {
	if (a.length !== b.length) return false;
	const bBySeed = new Map(b.map((s) => [s.seed, s.assignment]));
	return a.every((s) => bBySeed.has(s.seed) && sameAssignment(s.assignment, bBySeed.get(s.seed)!));
}

/**
 * Sitting-out is not stored anywhere, so on load it is read off the rules: any
 * primary-source rank below the highest one used that no seed takes. Ranks
 * beyond the highest used are simply below the cut, not sitting out.
 */
export function inferSittingOut(slots: SeedSlot[], primaryKey: string, capacity: number): number[] {
	const used = new Set(
		slots
			.map((s) => s.assignment)
			.filter((a): a is Assignment => a !== null && a.sourceKey === primaryKey)
			.map((a) => a.rank)
	);
	if (used.size === 0) return [];
	const highest = Math.min(Math.max(...used), capacity);
	const out: number[] = [];
	for (let rank = 1; rank < highest; rank++) if (!used.has(rank)) out.push(rank);
	return out;
}

/** Primary-source ranks still eligible for a seed, in order. */
export function eligibleRanks(state: BoardState, capacity: number): number[] {
	const out: number[] = [];
	const excluded = new Set(state.sittingOut);
	for (let rank = 1; rank <= capacity; rank++) if (!excluded.has(rank)) out.push(rank);
	return out;
}

/**
 * Default: slot k ← the k-th eligible primary rank. Then, per slot:
 *   another source            → 'other'
 *   matches the default and the identity (rank == seed) → 'default'
 *   matches the default only because a rank above sits out → 'shifted'
 *   anything else             → 'override'
 * Deliberately not clever about partial reorders: an unassigned rank that is
 * not marked sitting out makes everything below it an override, which is the
 * honest reading and nudges toward the explicit gesture.
 */
export function classify(state: BoardState, capacity: number): LineState[] {
	const defaults = eligibleRanks(state, capacity);
	return state.slots.map((slot, k) => {
		const a = slot.assignment;
		if (!a) return 'empty';
		if (a.sourceKey !== state.primaryKey) return 'other';
		if (a.rank === defaults[k]) return a.rank === slot.seed ? 'default' : 'shifted';
		return 'override';
	});
}

// ----------------------------------------------------------------- pools

/** Rules → the set of members. Seed numbers are irrelevant for a pool. */
export function decompilePool(seeding: SeedGroup[]): Assignment[] {
	return decompile(seeding)
		.map((s) => s.assignment)
		.filter((a): a is Assignment => a !== null);
}

/**
 * Members → rules. Pool seed numbers do nothing server-side (they only pre-seat
 * the standings table), so they are assigned in a canonical order — sources in
 * the order the API lists them, ranks ascending — which yields the fewest rules.
 */
export function compilePool(members: Assignment[], sourceOrder: string[]): SeedGroup[] {
	const position = (key: string) => {
		const i = sourceOrder.indexOf(key);
		return i === -1 ? sourceOrder.length : i;
	};
	const ordered = [...members].sort(
		(a, b) => position(a.sourceKey) - position(b.sourceKey) || a.rank - b.rank
	);
	return compile(ordered.map((assignment, i) => ({ seed: i + 1, assignment, orphan: false })));
}

export function sameMembers(a: Assignment[], b: Assignment[]): boolean {
	if (a.length !== b.length) return false;
	const keys = new Set(a.map((m) => `${m.sourceKey}#${m.rank}`));
	return b.every((m) => keys.has(`${m.sourceKey}#${m.rank}`));
}

// ------------------------------------------------------------- validator

/**
 * Port of the backend's TournamentFormats.ValidateSeedGroups, plus the
 * start >= 1 / end >= start checks the backend only applies when *reading*
 * (an inverted range saved today 500s on the next load). Messages mirror the
 * server's wording so executives see the same text either way.
 */
export function validateSeedGroups(groups: SeedGroup[]): string[] {
	const problems: string[] = [];
	const claimed = new Set<number>();

	for (const group of groups) {
		const seeds = `${group.outputStart}-${group.outputEnd}`;

		if (group.result !== 'Standings' && group.result !== 'Losers') {
			problems.push(`Unknown seeding result "${group.result}". Expected Standings or Losers.`);
			continue;
		}
		const validSources: string[] =
			group.result === 'Losers'
				? ['BracketRound']
				: ['Season', 'BracketRound', 'TournamentRoundRobin'];
		if (!validSources.includes(group.sourceType)) {
			problems.push(
				`Seeding source "${group.sourceType}" cannot be used with ${group.result}. ` +
					`Expected one of: ${validSources.join(', ')}.`
			);
		}

		const ranges: [string, number, number][] = [
			[seeds, group.outputStart, group.outputEnd],
			[`${group.rankStart}-${group.rankEnd}`, group.rankStart, group.rankEnd]
		];
		let rangeOk = true;
		for (const [text, start, end] of ranges) {
			if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) {
				problems.push(`Range "${text}" in seeding rule for seeds ${seeds} is not a valid range.`);
				rangeOk = false;
			}
		}
		if (!rangeOk) continue;

		const outputCount = group.outputEnd - group.outputStart + 1;
		const rankCount = group.rankEnd - group.rankStart + 1;
		if (outputCount !== rankCount) {
			problems.push(
				`Seeding rule for seeds ${seeds} takes ${rankCount} team(s) from its source but needs ${outputCount}.`
			);
		}

		for (let seed = group.outputStart; seed <= group.outputEnd; seed++) {
			if (claimed.has(seed))
				problems.push(`Seed ${seed} is assigned by more than one seeding rule.`);
			claimed.add(seed);
		}
	}
	return [...new Set(problems)];
}
