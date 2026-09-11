// Board actions. Every action is a pure function: it takes the current state and
// returns a new one plus a plain-language message for the status line and the
// aria-live region. Purity is what makes undo a matter of keeping old states.
//
// Notation from design.md: slot k holds (src, rank); N = slot count; P = primary.

import { eligibleRanks } from './adapters';
import type { Assignment, BoardState, SeedSlot } from './model';

export interface ActionResult {
	state: BoardState;
	message: string;
}

/** Turns an assignment into what the executive calls it: a team name, or "QF losers rank 2". */
export type NameOf = (assignment: Assignment) => string;

function cloneSlots(slots: SeedSlot[]): SeedSlot[] {
	return slots.map((s) => ({ ...s, assignment: s.assignment ? { ...s.assignment } : null }));
}

function findSlot(slots: SeedSlot[], a: Assignment): number {
	return slots.findIndex(
		(s) => s.assignment && s.assignment.sourceKey === a.sourceKey && s.assignment.rank === a.rank
	);
}

function usedPrimaryRanks(slots: SeedSlot[], primaryKey: string): Set<number> {
	return new Set(
		slots
			.map((s) => s.assignment)
			.filter((a): a is Assignment => a !== null && a.sourceKey === primaryKey)
			.map((a) => a.rank)
	);
}

function nextEligible(state: BoardState, capacity: number, slots: SeedSlot[]): number | undefined {
	const used = usedPrimaryRanks(slots, state.primaryKey);
	return eligibleRanks(state, capacity).find((rank) => !used.has(rank));
}

/**
 * Put a rank into slot k. From another slot: swap. From the source list: the
 * displaced team (if any) becomes unassigned — this is a deliberate override,
 * so nothing shifts. A sitting-out team dropped on a seed is back in.
 */
export function assign(state: BoardState, a: Assignment, k: number, nameOf: NameOf): ActionResult {
	const slots = cloneSlots(state.slots);
	const sittingOut =
		a.sourceKey === state.primaryKey
			? state.sittingOut.filter((r) => r !== a.rank)
			: state.sittingOut;
	const from = findSlot(slots, a);
	if (from === k) return { state, message: '' };

	let message: string;
	if (from >= 0) {
		[slots[from].assignment, slots[k].assignment] = [slots[k].assignment, slots[from].assignment];
		message = `${nameOf(a)} moved to seed ${slots[k].seed}`;
		if (slots[from].assignment) {
			message += `; ${nameOf(slots[from].assignment)} moved to seed ${slots[from].seed}`;
		}
	} else {
		const displaced = slots[k].assignment;
		slots[k].assignment = { ...a };
		message = `${nameOf(a)} placed at seed ${slots[k].seed}`;
		if (displaced) message += `; ${nameOf(displaced)} is no longer seeded`;
	}
	return { state: { ...state, slots, sittingOut }, message: message + '.' };
}

/** Empty slot k. Leaves a hole on purpose; problems() reports it. */
export function clearSlot(state: BoardState, k: number, nameOf: NameOf): ActionResult {
	const slots = cloneSlots(state.slots);
	const was = slots[k].assignment;
	slots[k].assignment = null;
	return {
		state: { ...state, slots },
		message: was ? `Seed ${slots[k].seed} cleared; ${nameOf(was)} is no longer seeded.` : ''
	};
}

/**
 * Exclude primary rank r. If it held a seed, everything below moves up one and
 * the last seed takes the next team in line (or is left empty).
 */
export function sitOut(
	state: BoardState,
	rank: number,
	capacity: number,
	nameOf: NameOf
): ActionResult {
	if (state.sittingOut.includes(rank)) return { state, message: '' };
	const next: BoardState = {
		...state,
		slots: cloneSlots(state.slots),
		sittingOut: [...state.sittingOut, rank].sort((x, y) => x - y)
	};
	const who = nameOf({ sourceKey: state.primaryKey, rank });
	const k = findSlot(next.slots, { sourceKey: state.primaryKey, rank });
	if (k < 0) return { state: next, message: `${who} is sitting out.` };

	const N = next.slots.length;
	for (let i = k; i < N - 1; i++) next.slots[i].assignment = next.slots[i + 1].assignment;
	next.slots[N - 1].assignment = null;
	const fill = nextEligible(next, capacity, next.slots);
	if (fill !== undefined)
		next.slots[N - 1].assignment = { sourceKey: state.primaryKey, rank: fill };

	let message = `${who} is sitting out`;
	if (k < N - 1) message += `; seeds ${next.slots[k].seed} to ${next.slots[N - 1].seed} moved up`;
	message +=
		fill !== undefined
			? `, ${nameOf({ sourceKey: state.primaryKey, rank: fill })} enters at seed ${next.slots[N - 1].seed}.`
			: `, seed ${next.slots[N - 1].seed} is now empty.`;
	return { state: next, message };
}

/**
 * Bring primary rank r back. If any seed holds a lower-ranked primary team, r
 * goes in ahead of the first such seed and those below move down one; the team
 * in the last seed drops out. Otherwise r is simply eligible again.
 */
export function restore(state: BoardState, rank: number, nameOf: NameOf): ActionResult {
	if (!state.sittingOut.includes(rank)) return { state, message: '' };
	const next: BoardState = {
		...state,
		slots: cloneSlots(state.slots),
		sittingOut: state.sittingOut.filter((r) => r !== rank)
	};
	const who = nameOf({ sourceKey: state.primaryKey, rank });
	const k = next.slots.findIndex(
		(s) => s.assignment && s.assignment.sourceKey === state.primaryKey && s.assignment.rank > rank
	);
	if (k < 0) return { state: next, message: `${who} is back in and not yet seeded.` };

	const N = next.slots.length;
	const released = next.slots[N - 1].assignment;
	for (let i = N - 1; i > k; i--) next.slots[i].assignment = next.slots[i - 1].assignment;
	next.slots[k].assignment = { sourceKey: state.primaryKey, rank };

	let message = `${who} is back in at seed ${next.slots[k].seed}`;
	if (k < N - 1) message += `; lower seeds moved down`;
	if (released) message += `, ${nameOf(released)} drops out`;
	return { state: next, message: message + '.' };
}

/** Every seed ← the default mapping. Sitting-out marks are kept. */
export function resetDefault(state: BoardState, capacity: number): ActionResult {
	const defaults = eligibleRanks(state, capacity);
	const slots = cloneSlots(state.slots).map((slot, k) => ({
		...slot,
		assignment:
			defaults[k] !== undefined ? { sourceKey: state.primaryKey, rank: defaults[k] } : null
	}));
	return { state: { ...state, slots }, message: 'Seeding reset to the default order.' };
}

/**
 * New brackets only: seeds are 1..n. Growing fills new seeds with the next
 * eligible teams; shrinking releases the trailing ones.
 */
export function setSeedCount(state: BoardState, n: number, capacity: number): ActionResult {
	const slots = cloneSlots(state.slots).filter((s) => s.seed <= n);
	for (let seed = slots.length + 1; seed <= n; seed++)
		slots.push({ seed, assignment: null, orphan: false });
	const next: BoardState = { ...state, slots };
	for (const slot of next.slots) {
		if (slot.assignment) continue;
		const fill = nextEligible(next, capacity, next.slots);
		if (fill === undefined) break;
		slot.assignment = { sourceKey: state.primaryKey, rank: fill };
	}
	return { state: next, message: `Bracket set to ${n} seeds.` };
}

/**
 * Switch the default source. Seeds drawn from other sources are kept as they
 * are; every seed drawn from the old default is re-filled from the new one in
 * seed order. No confirmation: this is undoable.
 */
export function changePrimary(
	state: BoardState,
	newKey: string,
	newCapacity: number,
	newLabel: string
): ActionResult {
	if (newKey === state.primaryKey) return { state, message: '' };
	const next: BoardState = { primaryKey: newKey, slots: cloneSlots(state.slots), sittingOut: [] };
	let refilled = 0;
	let kept = 0;
	for (const slot of next.slots) {
		const a = slot.assignment;
		if (!a) continue;
		if (a.sourceKey !== state.primaryKey) {
			kept++;
			continue;
		}
		// The slot still holds its old-primary assignment here, which nextEligible
		// does not count as a used rank of the new primary, so no exclusion needed.
		const fill = nextEligible(next, newCapacity, next.slots);
		slot.assignment = fill !== undefined ? { sourceKey: newKey, rank: fill } : null;
		if (fill !== undefined) refilled++;
	}
	const keptText = kept > 0 ? `, ${kept} kept` : '';
	return {
		state: next,
		message: `Default source changed; ${refilled} seed${refilled === 1 ? '' : 's'} re-filled from ${newLabel}${keptText}.`
	};
}
