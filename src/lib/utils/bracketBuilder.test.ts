import { describe, it, expect } from 'vitest';
import {
	generateRounds,
	defaultHostOrder,
	hostOrderSummary,
	roundNameForSeriesCount,
	describeSpot
} from './bracketBuilder';

/** Compact form matching the backend encoding, purely so tests read like the stored data. */
function encode(spot: { type: string; number: number }): string {
	const sources: Record<string, string> = {
		Seed: '#',
		Winner: 'w',
		Loser: 'l',
		Reseed: 'r'
	};
	return `${sources[spot.type]}${spot.number}`;
}

function encodeRounds(rounds: ReturnType<typeof generateRounds>) {
	return rounds.map((round) => ({
		name: round.name,
		series: round.series.map(
			(s) => `${s.number}:${encode(s.matchup.spot1)}-${encode(s.matchup.spot2)}`
		)
	}));
}

describe('generateRounds', () => {
	it('lays out an eight team re-seeding bracket the way the league already records them', () => {
		// Matches the real 2025 playoff structure.
		const rounds = generateRounds(8, 'Re-seed', [3, 3, 3]);

		expect(encodeRounds(rounds)).toEqual([
			{ name: 'Quarter-finals', series: ['1:#1-#8', '2:#2-#7', '3:#3-#6', '4:#4-#5'] },
			{ name: 'Semi-finals', series: ['5:r1-r4', '6:r2-r3'] },
			{ name: 'Finals', series: ['7:r1-r2'] }
		]);
	});

	it('lays out a four team fixed bracket using winner references', () => {
		const rounds = generateRounds(4, 'Fixed', [1, 1]);

		expect(encodeRounds(rounds)).toEqual([
			{ name: 'Semi-finals', series: ['1:#1-#4', '2:#2-#3'] },
			{ name: 'Finals', series: ['3:w1-w2'] }
		]);
	});

	it('lays out a two team bracket as a single final', () => {
		const rounds = generateRounds(2, 'Fixed', [3]);

		expect(encodeRounds(rounds)).toEqual([{ name: 'Finals', series: ['1:#1-#2'] }]);
	});

	it('can start part way down the standings', () => {
		// A second division bracket for the teams seeded 9th and 10th.
		const rounds = generateRounds(2, 'Fixed', [3], 8);

		expect(encodeRounds(rounds)).toEqual([{ name: 'Finals', series: ['1:#9-#10'] }]);
	});

	it('lays out sixteen teams across four rounds', () => {
		const rounds = generateRounds(16, 'Re-seed', [3, 3, 3, 3]);

		expect(rounds.map((r) => r.name)).toEqual([
			'Round of 16',
			'Quarter-finals',
			'Semi-finals',
			'Finals'
		]);
		expect(rounds.map((r) => r.series.length)).toEqual([8, 4, 2, 1]);
		expect(rounds[0].series[0].matchup).toEqual({
			spot1: { type: 'Seed', number: 1 },
			spot2: { type: 'Seed', number: 16 }
		});
	});

	it('produces series numbers that are unique and sequential', () => {
		const rounds = generateRounds(8, 'Re-seed', [3, 3, 3]);
		const numbers = rounds.flatMap((r) => r.series.map((s) => s.number));

		expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7]);
	});

	it('produces rounds that shrink, which the display engine requires', () => {
		const counts = generateRounds(8, 'Re-seed', [3, 3, 3]).map((r) => r.series.length);

		for (let i = 1; i < counts.length; i++) {
			expect(counts[i]).toBeLessThan(counts[i - 1]);
		}
	});

	it('applies a different series length per round', () => {
		const rounds = generateRounds(4, 'Re-seed', [1, 5]);

		expect(rounds[0].series[0].hostOrder).toEqual([1]);
		expect(rounds[1].series[0].hostOrder).toEqual([1, 2, 1, 2, 1]);
	});

	it('rejects team counts it cannot lay out', () => {
		expect(() => generateRounds(6, 'Re-seed', [3])).toThrow();
	});
});

describe('defaultHostOrder', () => {
	it('alternates starting with the higher seed', () => {
		expect(defaultHostOrder(1)).toEqual([1]);
		expect(defaultHostOrder(3)).toEqual([1, 2, 1]);
		expect(defaultHostOrder(5)).toEqual([1, 2, 1, 2, 1]);
		expect(defaultHostOrder(7)).toEqual([1, 2, 1, 2, 1, 2, 1]);
	});

	it('gives the higher seed the extra home game', () => {
		const hosts = defaultHostOrder(5);
		expect(hosts.filter((h) => h === 1)).toHaveLength(3);
		expect(hosts.filter((h) => h === 2)).toHaveLength(2);
	});
});

describe('hostOrderSummary', () => {
	it('describes which games the higher seed hosts', () => {
		expect(hostOrderSummary([1, 2, 1])).toBe('Higher seed hosts games 1 and 3');
		expect(hostOrderSummary([1])).toBe('Higher seed hosts every game');
		expect(hostOrderSummary([2])).toBe('Lower seed hosts every game');
		expect(hostOrderSummary([1, 2, 1, 2, 1])).toBe('Higher seed hosts games 1, 3 and 5');
	});
});

describe('roundNameForSeriesCount', () => {
	it('names rounds counting back from the final', () => {
		expect(roundNameForSeriesCount(1)).toBe('Finals');
		expect(roundNameForSeriesCount(2)).toBe('Semi-finals');
		expect(roundNameForSeriesCount(4)).toBe('Quarter-finals');
		expect(roundNameForSeriesCount(8)).toBe('Round of 16');
	});
});

describe('describeSpot', () => {
	it('describes each kind of spot in plain language', () => {
		expect(describeSpot({ type: 'Seed', number: 3 })).toBe('#3 seed');
		expect(describeSpot({ type: 'Winner', number: 5 })).toBe('Winner of series 5');
		expect(describeSpot({ type: 'Loser', number: 2 })).toBe('Loser of series 2');
		expect(describeSpot({ type: 'Reseed', number: 1 })).toBe('Best team still alive');
		expect(describeSpot({ type: 'Reseed', number: 3 })).toBe('3rd best team still alive');
	});
});
