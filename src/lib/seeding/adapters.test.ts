import { describe, test, expect } from 'vitest';
import type { SeedGroup } from '$lib/models/Tournament';
import {
	classify,
	compile,
	compilePool,
	decompile,
	decompilePool,
	inferSittingOut,
	sameAssignments,
	sameMembers,
	validateSeedGroups
} from './adapters';
import { sourceKey, type BoardState, type SeedSlot } from './model';

const SEASON = sourceKey({ result: 'Standings', sourceType: 'Season', sourceID: 16 });
const LOSERS = sourceKey({ result: 'Losers', sourceType: 'BracketRound', sourceID: 41 });

function rule(
	outputStart: number,
	outputEnd: number,
	rankStart: number,
	rankEnd: number,
	source: 'season' | 'losers' = 'season'
): SeedGroup {
	return source === 'season'
		? {
				outputStart,
				outputEnd,
				result: 'Standings',
				sourceType: 'Season',
				sourceID: 16,
				rankStart,
				rankEnd
			}
		: {
				outputStart,
				outputEnd,
				result: 'Losers',
				sourceType: 'BracketRound',
				sourceID: 41,
				rankStart,
				rankEnd
			};
}

function slotsOf(...ranks: (number | null | [string, number])[]): SeedSlot[] {
	return ranks.map((r, i) => ({
		seed: i + 1,
		orphan: false,
		assignment:
			r === null
				? null
				: Array.isArray(r)
					? { sourceKey: r[0], rank: r[1] }
					: { sourceKey: SEASON, rank: r }
	}));
}

describe('decompile', () => {
	test('identity rule over eight seeds', () => {
		const slots = decompile([rule(1, 8, 1, 8)], [1, 2, 3, 4, 5, 6, 7, 8]);
		expect(slots.map((s) => s.assignment?.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
		expect(slots.every((s) => !s.orphan)).toBe(true);
	});

	test('the real-world skip-a-rank shape: seeds 1-7 from ranks 2-8, seed 8 from rank 10', () => {
		const slots = decompile([rule(1, 7, 2, 8), rule(8, 8, 10, 10)], [1, 2, 3, 4, 5, 6, 7, 8]);
		expect(slots.map((s) => s.assignment?.rank)).toEqual([2, 3, 4, 5, 6, 7, 8, 10]);
	});

	test('seeds the bracket uses but no rule fills are empty', () => {
		const slots = decompile([rule(1, 2, 1, 2)], [1, 2, 3, 4]);
		expect(slots.map((s) => s.assignment)).toEqual([
			{ sourceKey: SEASON, rank: 1 },
			{ sourceKey: SEASON, rank: 2 },
			null,
			null
		]);
	});

	test('a rule that outruns the bracket is kept as an orphan slot, not dropped', () => {
		const slots = decompile([rule(1, 5, 1, 5)], [1, 2, 3, 4]);
		expect(slots).toHaveLength(5);
		expect(slots[4]).toEqual({ seed: 5, assignment: { sourceKey: SEASON, rank: 5 }, orphan: true });
	});

	test('without a seed list (new bracket) the slots are whatever the rules cover', () => {
		const slots = decompile([rule(1, 4, 1, 4)]);
		expect(slots.map((s) => s.seed)).toEqual([1, 2, 3, 4]);
		expect(slots.every((s) => !s.orphan)).toBe(true);
	});

	test('multi-source rules keep each seed pointed at its own source', () => {
		const slots = decompile([rule(1, 4, 1, 4), rule(5, 6, 1, 2, 'losers')], [1, 2, 3, 4, 5, 6]);
		expect(slots[4].assignment).toEqual({ sourceKey: LOSERS, rank: 1 });
		expect(slots[5].assignment).toEqual({ sourceKey: LOSERS, rank: 2 });
	});
});

describe('compile', () => {
	test('merges consecutive seeds with consecutive ranks into one rule', () => {
		expect(compile(slotsOf(1, 2, 3, 4))).toEqual([rule(1, 4, 1, 4)]);
	});

	test('round-trips the skip-a-rank shape exactly', () => {
		const input = [rule(1, 7, 2, 8), rule(8, 8, 10, 10)];
		expect(compile(decompile(input, [1, 2, 3, 4, 5, 6, 7, 8]))).toEqual(input);
	});

	test('a hand-swap in the middle splits the run into single-seed rules', () => {
		expect(compile(slotsOf(1, 2, 4, 3))).toEqual([
			rule(1, 2, 1, 2),
			rule(3, 3, 4, 4),
			rule(4, 4, 3, 3)
		]);
	});

	test('an empty seed breaks the run and emits nothing for itself', () => {
		expect(compile(slotsOf(1, 2, null, 4))).toEqual([rule(1, 2, 1, 2), rule(4, 4, 4, 4)]);
	});

	test('a source change breaks the run', () => {
		expect(compile(slotsOf(1, 2, [LOSERS, 1], [LOSERS, 2]))).toEqual([
			rule(1, 2, 1, 2),
			rule(3, 4, 1, 2, 'losers')
		]);
	});

	test('output always passes the validator', () => {
		const messy = slotsOf(3, null, 1, [LOSERS, 2], 2, 9, 10);
		expect(validateSeedGroups(compile(messy))).toEqual([]);
	});

	test('round-trips the fixtures used elsewhere in the test suite', () => {
		const fixture: SeedGroup[] = [
			{
				outputStart: 1,
				outputEnd: 4,
				result: 'Standings',
				sourceType: 'Season',
				sourceID: 15,
				rankStart: 1,
				rankEnd: 4
			}
		];
		expect(compile(decompile(fixture, [1, 2, 3, 4]))).toEqual(fixture);
	});
});

describe('sameAssignments', () => {
	test('is order-insensitive by seed and strict on content', () => {
		const a = slotsOf(1, 2);
		const b = [a[1], a[0]];
		expect(sameAssignments(a, b)).toBe(true);
		expect(sameAssignments(a, slotsOf(1, 3))).toBe(false);
		expect(sameAssignments(a, slotsOf(1))).toBe(false);
	});
});

describe('inferSittingOut', () => {
	test('reads the skipped ranks off a skip-a-rank configuration', () => {
		const slots = decompile([rule(1, 7, 2, 8), rule(8, 8, 10, 10)], [1, 2, 3, 4, 5, 6, 7, 8]);
		expect(inferSittingOut(slots, SEASON, 10)).toEqual([1, 9]);
	});

	test('ranks below the cut are not sitting out', () => {
		expect(inferSittingOut(slotsOf(1, 2, 3, 4), SEASON, 10)).toEqual([]);
	});

	test('nothing from the primary source means nothing sits out', () => {
		expect(inferSittingOut(slotsOf([LOSERS, 1], [LOSERS, 2]), SEASON, 10)).toEqual([]);
	});
});

describe('classify', () => {
	const state = (slots: SeedSlot[], sittingOut: number[] = []): BoardState => ({
		primaryKey: SEASON,
		slots,
		sittingOut
	});

	test('identity is default everywhere', () => {
		expect(classify(state(slotsOf(1, 2, 3, 4)), 10)).toEqual([
			'default',
			'default',
			'default',
			'default'
		]);
	});

	test('one team sitting out shifts everything below it, and only that', () => {
		expect(classify(state(slotsOf(1, 3, 4, 5), [2]), 10)).toEqual([
			'default',
			'shifted',
			'shifted',
			'shifted'
		]);
	});

	test('a hand swap is an override on both seeds involved', () => {
		expect(classify(state(slotsOf(1, 3, 2, 4)), 10)).toEqual([
			'default',
			'override',
			'override',
			'default'
		]);
	});

	test('another source is "other" regardless of rank', () => {
		expect(classify(state(slotsOf(1, [LOSERS, 1])), 10)).toEqual(['default', 'other']);
	});

	test('an unmarked gap reads as overrides below it (nudging toward the explicit gesture)', () => {
		expect(classify(state(slotsOf(1, 3, 4)), 10)).toEqual(['default', 'override', 'override']);
	});

	test('empty slots are empty', () => {
		expect(classify(state(slotsOf(1, null)), 10)).toEqual(['default', 'empty']);
	});

	test('the real-world shape: two out, everything else moved up', () => {
		const slots = decompile([rule(1, 7, 2, 8), rule(8, 8, 10, 10)], [1, 2, 3, 4, 5, 6, 7, 8]);
		const s = state(slots, inferSittingOut(slots, SEASON, 10));
		expect(classify(s, 10)).toEqual(Array(8).fill('shifted'));
	});
});

describe('pools', () => {
	test('decompilePool returns membership without seed numbers', () => {
		expect(decompilePool([rule(1, 2, 1, 2, 'losers'), rule(3, 3, 9, 9)])).toEqual([
			{ sourceKey: LOSERS, rank: 1 },
			{ sourceKey: LOSERS, rank: 2 },
			{ sourceKey: SEASON, rank: 9 }
		]);
	});

	test('compilePool orders by source order then rank and yields minimal rules', () => {
		const members = [
			{ sourceKey: SEASON, rank: 10 },
			{ sourceKey: LOSERS, rank: 3 },
			{ sourceKey: SEASON, rank: 9 },
			{ sourceKey: LOSERS, rank: 1 },
			{ sourceKey: LOSERS, rank: 2 },
			{ sourceKey: LOSERS, rank: 4 }
		];
		expect(compilePool(members, [LOSERS, SEASON])).toEqual([
			rule(1, 4, 1, 4, 'losers'),
			rule(5, 6, 9, 10)
		]);
	});

	test('sameMembers is a set comparison', () => {
		const a = [
			{ sourceKey: SEASON, rank: 1 },
			{ sourceKey: SEASON, rank: 2 }
		];
		expect(sameMembers(a, [a[1], a[0]])).toBe(true);
		expect(sameMembers(a, [a[0]])).toBe(false);
	});
});

describe('validateSeedGroups (port of the backend validator)', () => {
	test('accepts a good configuration', () => {
		expect(validateSeedGroups([rule(1, 4, 1, 4), rule(5, 6, 1, 2, 'losers')])).toEqual([]);
	});

	test('rejects Losers from a non-BracketRound source', () => {
		const bad: SeedGroup = { ...rule(1, 2, 1, 2), result: 'Losers' };
		expect(validateSeedGroups([bad])[0]).toMatch(/cannot be used with Losers/);
	});

	test('rejects mismatched seed and rank counts', () => {
		expect(validateSeedGroups([rule(1, 4, 1, 3)])[0]).toMatch(
			/takes 3 team\(s\) from its source but needs 4/
		);
	});

	test('rejects a seed claimed twice', () => {
		expect(validateSeedGroups([rule(1, 4, 1, 4), rule(4, 5, 7, 8)])).toContain(
			'Seed 4 is assigned by more than one seeding rule.'
		);
	});

	test('rejects inverted and zero-based ranges, which the backend only catches on read', () => {
		expect(validateSeedGroups([rule(3, 1, 3, 1)])[0]).toMatch(/not a valid range/);
		expect(validateSeedGroups([rule(0, 3, 0, 3)])[0]).toMatch(/not a valid range/);
	});

	test('rejects an unknown result', () => {
		const bad = { ...rule(1, 1, 1, 1), result: 'Winners' } as unknown as SeedGroup;
		expect(validateSeedGroups([bad])[0]).toMatch(/Unknown seeding result/);
	});
});
