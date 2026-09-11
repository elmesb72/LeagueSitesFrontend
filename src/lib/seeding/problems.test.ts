import { describe, test, expect } from 'vitest';
import type { SeedGroup, SeedingSourceOption } from '$lib/models/Tournament';
import { decompile } from './adapters';
import { poolProblems, seedingProblems, slotProblems } from './problems';

const sources: SeedingSourceOption[] = [
	{
		sourceType: 'Season',
		sourceID: 16,
		label: '2026 regular season standings',
		result: 'Standings',
		availableTeams: 10
	},
	{
		sourceType: 'BracketRound',
		sourceID: 41,
		label: 'Teams knocked out in the Quarter-finals (Main bracket)',
		result: 'Losers',
		availableTeams: 4
	}
];

function season(
	outputStart: number,
	outputEnd: number,
	rankStart: number,
	rankEnd: number
): SeedGroup {
	return {
		outputStart,
		outputEnd,
		result: 'Standings',
		sourceType: 'Season',
		sourceID: 16,
		rankStart,
		rankEnd
	};
}
function losers(
	outputStart: number,
	outputEnd: number,
	rankStart: number,
	rankEnd: number
): SeedGroup {
	return {
		outputStart,
		outputEnd,
		result: 'Losers',
		sourceType: 'BracketRound',
		sourceID: 41,
		rankStart,
		rankEnd
	};
}

describe('slotProblems', () => {
	test('a clean board has none', () => {
		expect(
			slotProblems(decompile([season(1, 8, 1, 8)], [1, 2, 3, 4, 5, 6, 7, 8]), sources)
		).toEqual([]);
	});

	test('reports empty seeds by number', () => {
		expect(slotProblems(decompile([season(1, 2, 1, 2)], [1, 2, 3, 4]), sources)).toEqual([
			'Seed 3 has no team.',
			'Seed 4 has no team.'
		]);
	});

	test('reports a rank beyond what the source can supply, naming the source', () => {
		expect(slotProblems(decompile([losers(1, 5, 1, 5)], [1, 2, 3, 4, 5]), sources)).toEqual([
			'Teams knocked out in the Quarter-finals (Main bracket) can only supply 4 team(s), so rank 5 is not available yet.'
		]);
	});

	test('reports an orphan seed that no matchup uses', () => {
		expect(slotProblems(decompile([season(1, 5, 1, 5)], [1, 2, 3, 4]), sources)).toEqual([
			'Seed 5 is filled but no matchup in this bracket uses it.'
		]);
	});

	test('an unknown source is named as such', () => {
		const odd: SeedGroup = { ...season(1, 1, 1, 1), sourceID: 999 };
		expect(slotProblems(decompile([odd], [1]), sources)[0]).toMatch(
			/^Unknown source can only supply 0 team/
		);
	});
});

describe('poolProblems', () => {
	test('only membership, capacity and validator checks apply to pools', () => {
		expect(poolProblems([losers(1, 4, 1, 4)], sources)).toEqual([]);
		expect(poolProblems([losers(1, 5, 1, 5)], sources)[0]).toMatch(/can only supply 4 team/);
	});

	test('an empty pool is a problem, since the backend refuses an empty rule list', () => {
		expect(poolProblems([], sources)).toEqual(['Pick at least one team for the pool.']);
	});
});

describe('seedingProblems (as the host forms call it)', () => {
	test('validator failures come first and alone, since they cannot be laid out', () => {
		expect(seedingProblems([season(3, 1, 3, 1)], sources, 'bracket', [1, 2, 3])).toEqual([
			'Range "3-1" in seeding rule for seeds 3-1 is not a valid range.'
		]);
	});

	test('a new bracket with no seed list is judged on what the rules cover', () => {
		expect(seedingProblems([season(1, 8, 1, 8)], sources, 'bracket')).toEqual([]);
	});

	test('pools route to poolProblems', () => {
		expect(seedingProblems([losers(1, 5, 1, 5)], sources, 'pool')).toHaveLength(1);
	});
});
