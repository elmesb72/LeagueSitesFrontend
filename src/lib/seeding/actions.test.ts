import { describe, test, expect } from 'vitest';
import {
	assign,
	changePrimary,
	clearSlot,
	resetDefault,
	restore,
	setSeedCount,
	sitOut
} from './actions';
import { classify, compile } from './adapters';
import { sourceKey, type Assignment, type BoardState, type SeedSlot } from './model';

const SEASON = sourceKey({ result: 'Standings', sourceType: 'Season', sourceID: 16 });
const LOSERS = sourceKey({ result: 'Losers', sourceType: 'BracketRound', sourceID: 41 });
const POOL = sourceKey({ result: 'Standings', sourceType: 'TournamentRoundRobin', sourceID: 7 });
const CAP = 10;

const TEAMS = [
	'Hawks',
	'Rockets',
	'Millers',
	'Sabres',
	'Owls',
	'Pilots',
	'Giants',
	'Wolves',
	'Knights',
	'Lynx'
];
const nameOf = (a: Assignment) =>
	a.sourceKey === SEASON ? TEAMS[a.rank - 1] : `other rank ${a.rank}`;

function board(ranks: (number | null | [string, number])[], sittingOut: number[] = []): BoardState {
	const slots: SeedSlot[] = ranks.map((r, i) => ({
		seed: i + 1,
		orphan: false,
		assignment:
			r === null
				? null
				: Array.isArray(r)
					? { sourceKey: r[0], rank: r[1] }
					: { sourceKey: SEASON, rank: r }
	}));
	return { primaryKey: SEASON, slots, sittingOut };
}
const ranks = (s: BoardState) => s.slots.map((x) => (x.assignment ? x.assignment.rank : null));
const season = (rank: number): Assignment => ({ sourceKey: SEASON, rank });

describe('assign', () => {
	test('from the source list onto an empty seed', () => {
		const { state, message } = assign(board([1, null]), season(2), 1, nameOf);
		expect(ranks(state)).toEqual([1, 2]);
		expect(message).toBe('Rockets placed at seed 2.');
	});

	test('from the source list onto an occupied seed displaces the occupant (an override, no shift)', () => {
		const { state, message } = assign(board([1, 2, 3]), season(7), 1, nameOf);
		expect(ranks(state)).toEqual([1, 7, 3]);
		expect(message).toBe('Giants placed at seed 2; Rockets is no longer seeded.');
	});

	test('from another seed swaps the two', () => {
		const { state, message } = assign(board([1, 2, 3]), season(3), 0, nameOf);
		expect(ranks(state)).toEqual([3, 2, 1]);
		expect(message).toBe('Millers moved to seed 1; Hawks moved to seed 3.');
	});

	test('a sitting-out team dropped on a seed is back in', () => {
		const { state } = assign(board([2, 3], [1]), season(1), 1, nameOf);
		expect(state.sittingOut).toEqual([]);
		expect(ranks(state)).toEqual([2, 1]);
	});

	test('dropping a team on its own seed is a no-op', () => {
		const start = board([1, 2]);
		const { state, message } = assign(start, season(2), 1, nameOf);
		expect(state).toBe(start);
		expect(message).toBe('');
	});

	test('does not mutate the input state', () => {
		const start = board([1, 2]);
		assign(start, season(5), 0, nameOf);
		expect(ranks(start)).toEqual([1, 2]);
	});
});

describe('clearSlot', () => {
	test('leaves a hole and says who left', () => {
		const { state, message } = clearSlot(board([1, 2, 3]), 1, nameOf);
		expect(ranks(state)).toEqual([1, null, 3]);
		expect(message).toBe('Seed 2 cleared; Rockets is no longer seeded.');
	});
});

describe('sitOut', () => {
	test('a seeded team sitting out shifts everyone below up and pulls in the next team in line', () => {
		const { state, message } = sitOut(board([1, 2, 3, 4]), 2, CAP, nameOf);
		expect(ranks(state)).toEqual([1, 3, 4, 5]);
		expect(state.sittingOut).toEqual([2]);
		expect(message).toBe('Rockets is sitting out; seeds 2 to 4 moved up, Owls enters at seed 4.');
		expect(classify(state, CAP)).toEqual(['default', 'shifted', 'shifted', 'shifted']);
	});

	test('the last seed sitting out just gets replaced', () => {
		const { state, message } = sitOut(board([1, 2, 3, 4]), 4, CAP, nameOf);
		expect(ranks(state)).toEqual([1, 2, 3, 5]);
		expect(message).toBe('Sabres is sitting out, Owls enters at seed 4.');
	});

	test('with nobody left in line the last seed is left empty', () => {
		const { state, message } = sitOut(board([1, 2], []), 1, 2, nameOf);
		expect(ranks(state)).toEqual([2, null]);
		expect(message).toMatch(/seed 2 is now empty/);
	});

	test('an unseeded team sitting out only marks it', () => {
		const { state, message } = sitOut(board([1, 2]), 7, CAP, nameOf);
		expect(ranks(state)).toEqual([1, 2]);
		expect(state.sittingOut).toEqual([7]);
		expect(message).toBe('Giants is sitting out.');
	});

	test('keeps sittingOut sorted', () => {
		const { state } = sitOut(board([1, 2], [9]), 1, CAP, nameOf);
		expect(state.sittingOut).toEqual([1, 9]);
	});
});

describe('restore', () => {
	test('is the mirror of sitOut: re-inserts ahead of lower ranks and drops the last seed', () => {
		const out = sitOut(board([1, 2, 3, 4]), 2, CAP, nameOf).state;
		const { state, message } = restore(out, 2, nameOf);
		expect(ranks(state)).toEqual([1, 2, 3, 4]);
		expect(state.sittingOut).toEqual([]);
		expect(message).toBe('Rockets is back in at seed 2; lower seeds moved down, Owls drops out.');
	});

	test('with no lower-ranked team seeded, the team is simply eligible again', () => {
		const { state, message } = restore(board([1, 2], [7]), 7, nameOf);
		expect(ranks(state)).toEqual([1, 2]);
		expect(message).toBe('Giants is back in and not yet seeded.');
	});

	test('restoring into a bracket with an empty last seed drops nobody', () => {
		const { state, message } = restore(board([2, 3, null], [1]), 1, nameOf);
		expect(ranks(state)).toEqual([1, 2, 3]);
		expect(message).not.toMatch(/drops out/);
	});
});

describe('resetDefault', () => {
	test('re-derives the default mapping and keeps sitting-out marks', () => {
		const { state } = resetDefault(board([4, 3, 2, 1], [5]), CAP);
		expect(ranks(state)).toEqual([1, 2, 3, 4]);
		expect(state.sittingOut).toEqual([5]);
	});

	test('the real-world shape: with ranks 1 and 9 out, eight seeds are 2-8 and 10', () => {
		const { state } = resetDefault(board(Array(8).fill(null), [1, 9]), CAP);
		expect(ranks(state)).toEqual([2, 3, 4, 5, 6, 7, 8, 10]);
		expect(compile(state.slots)).toEqual([
			{
				outputStart: 1,
				outputEnd: 7,
				result: 'Standings',
				sourceType: 'Season',
				sourceID: 16,
				rankStart: 2,
				rankEnd: 8
			},
			{
				outputStart: 8,
				outputEnd: 8,
				result: 'Standings',
				sourceType: 'Season',
				sourceID: 16,
				rankStart: 10,
				rankEnd: 10
			}
		]);
	});
});

describe('setSeedCount', () => {
	test('growing fills the new seeds with the next teams in line', () => {
		const { state } = setSeedCount(board([1, 3], [2]), 4, CAP);
		expect(ranks(state)).toEqual([1, 3, 4, 5]);
	});

	test('shrinking releases trailing seeds', () => {
		const { state } = setSeedCount(board([1, 2, 3, 4, 5, 6, 7, 8]), 4, CAP);
		expect(ranks(state)).toEqual([1, 2, 3, 4]);
	});

	test('stops filling when the source runs out', () => {
		const { state } = setSeedCount(board([1, 2]), 4, 3);
		expect(ranks(state)).toEqual([1, 2, 3, null]);
	});
});

describe('changePrimary', () => {
	test('keeps other-source seeds and re-fills the rest from the new source in seed order', () => {
		const start = board([1, 2, [LOSERS, 1], 4], [3]);
		const { state, message } = changePrimary(start, POOL, 6, 'Pool A final standings');
		expect(state.primaryKey).toBe(POOL);
		expect(state.sittingOut).toEqual([]);
		expect(state.slots.map((s) => s.assignment)).toEqual([
			{ sourceKey: POOL, rank: 1 },
			{ sourceKey: POOL, rank: 2 },
			{ sourceKey: LOSERS, rank: 1 },
			{ sourceKey: POOL, rank: 3 }
		]);
		expect(message).toBe(
			'Default source changed; 3 seeds re-filled from Pool A final standings, 1 kept.'
		);
	});

	test('a seed already drawn from the new source is kept and its rank is not reused', () => {
		const start = board([1, [POOL, 1], 3]);
		const { state } = changePrimary(start, POOL, 6, 'Pool A');
		expect(state.slots.map((s) => s.assignment?.rank)).toEqual([2, 1, 3]);
	});

	test('leaves seeds empty when the new source is too small', () => {
		const { state } = changePrimary(board([1, 2, 3]), POOL, 2, 'Pool A');
		expect(state.slots.map((s) => s.assignment?.rank ?? null)).toEqual([1, 2, null]);
	});

	test('same source is a no-op', () => {
		const start = board([1, 2]);
		expect(changePrimary(start, SEASON, CAP, 'x').state).toBe(start);
	});
});
