// What is wrong with a seeding, in the executive's words. Used by the board to
// show problems inline and by the host forms to block save. Pure.

import type { SeedGroup, SeedingSourceOption } from '$lib/models/Tournament';
import { compile, decompile, validateSeedGroups } from './adapters';
import { sourceKey, type SeedSlot } from './model';

function findSource(sources: SeedingSourceOption[], key: string): SeedingSourceOption | undefined {
	return sources.find((s) => sourceKey(s) === key);
}

/** Problems for a bracket board's slots. */
export function slotProblems(slots: SeedSlot[], sources: SeedingSourceOption[]): string[] {
	const problems: string[] = [];
	for (const slot of [...slots].sort((a, b) => a.seed - b.seed)) {
		if (!slot.assignment) {
			if (!slot.orphan) problems.push(`Seed ${slot.seed} has no team.`);
			continue;
		}
		const source = findSource(sources, slot.assignment.sourceKey);
		const capacity = source?.availableTeams ?? 0;
		if (slot.assignment.rank > capacity) {
			problems.push(
				`${source?.label ?? 'Unknown source'} can only supply ${capacity} team(s), ` +
					`so rank ${slot.assignment.rank} is not available yet.`
			);
		}
		if (slot.orphan) {
			problems.push(`Seed ${slot.seed} is filled but no matchup in this bracket uses it.`);
		}
	}
	problems.push(...validateSeedGroups(compile(slots)));
	return [...new Set(problems)];
}

/** Problems for a pool: membership, capacity and validator checks (no seed order). */
export function poolProblems(seeding: SeedGroup[], sources: SeedingSourceOption[]): string[] {
	const problems: string[] = [];
	// The backend refuses an empty rule list ("At least one seeding rule is required").
	if (seeding.length === 0) problems.push('Pick at least one team for the pool.');
	for (const rule of seeding) {
		const source = findSource(sources, sourceKey(rule));
		const capacity = source?.availableTeams ?? 0;
		if (rule.rankEnd > capacity) {
			problems.push(
				`${source?.label ?? 'Unknown source'} can only supply ${capacity} team(s), ` +
					`so rank ${rule.rankEnd} is not available yet.`
			);
		}
	}
	problems.push(...validateSeedGroups(seeding));
	return [...new Set(problems)];
}

/**
 * Problems for a rule set as the host form holds it. Brackets: decompiled onto
 * the bracket's seeds (or onto whatever the rules cover, for a new bracket).
 */
export function seedingProblems(
	seeding: SeedGroup[],
	sources: SeedingSourceOption[],
	subject: 'bracket' | 'pool',
	seeds: number[] = []
): string[] {
	if (subject === 'pool') return poolProblems(seeding, sources);
	// Rules the validator would reject cannot be decompiled meaningfully; report them first.
	const invalid = validateSeedGroups(seeding);
	if (invalid.length > 0) return invalid;
	return slotProblems(decompile(seeding, seeds), sources);
}
