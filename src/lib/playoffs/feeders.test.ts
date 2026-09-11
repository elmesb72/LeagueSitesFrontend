import { describe, test, expect } from 'vitest';
import { bracketGapPx, connectorsOf, feederOf, gapOf } from './feeders';
import { makeFourTeamBracket, teamAlphas } from '../../tests/playoffMocks';

describe('feederOf', () => {
	test('opening-round seeds have no feeder', () => {
		const b = makeFourTeamBracket();
		expect(feederOf(b.rounds[0].series[0].spot1, 0, b)).toBeNull();
	});

	test('a fixed final references its semi-finals by number, before anything is played', () => {
		const b = makeFourTeamBracket({ format: 'Fixed', played: 'none' });
		const final = b.rounds[1].series[0];
		expect(final.spot1?.team).toBeNull();
		expect(feederOf(final.spot1, 1, b)?.series.number).toBe(1);
		expect(feederOf(final.spot2, 1, b)?.series.number).toBe(2);
		expect(feederOf(final.spot1, 1, b)?.style).toBe('advance');
	});

	test('a re-seeded final has no feeders until the semi-finals are decided', () => {
		const b = makeFourTeamBracket({ format: 'Re-seed', played: 'none' });
		const final = b.rounds[1].series[0];
		expect(final.spot1?.source).toBe('r');
		expect(feederOf(final.spot1, 1, b)).toBeNull();
		expect(feederOf(final.spot2, 1, b)).toBeNull();
	});

	test('once decided, a re-seeded spot feeds from whichever series its team actually won', () => {
		// Upset: Deltas (#4) beat Alphas (#1) in series 1; Betas (#2) win series 2.
		// Re-seed: r1 = Betas (from series 2), r2 = Deltas (from series 1).
		const b = makeFourTeamBracket({ format: 'Re-seed', played: 'semis' });
		const final = b.rounds[1].series[0];
		expect(final.spot1?.team?.name).toBe('Betas');
		expect(feederOf(final.spot1, 1, b)?.series.number).toBe(2);
		expect(final.spot2?.team?.name).toBe('Deltas');
		expect(feederOf(final.spot2, 1, b)?.series.number).toBe(1);
	});

	test('loser-of spots are consolation feeders', () => {
		const b = makeFourTeamBracket({ thirdPlace: true, played: 'semis' });
		const third = b.rounds[1].series[1];
		const feeders = [feederOf(third.spot1, 1, b), feederOf(third.spot2, 1, b)];
		expect(feeders.map((f) => f?.style)).toEqual(['consolation', 'consolation']);
		expect(feeders.map((f) => f?.series.number).sort()).toEqual([1, 2]);
	});

	test('a reference into another bracket finds nothing here', () => {
		const b = makeFourTeamBracket({ format: 'Fixed', played: 'none' });
		const consolationBracket = {
			...b,
			name: 'Consolation',
			rounds: [
				{
					name: 'Final',
					series: [
						{
							...b.rounds[1].series[0],
							spot1: { source: 'l', seed: 1, team: null, initialSeed: null },
							spot2: { source: 'l', seed: 2, team: null, initialSeed: null }
						}
					]
				}
			]
		};
		expect(
			feederOf(consolationBracket.rounds[0].series[0].spot1, 0, consolationBracket)
		).toBeNull();
	});

	test('a resolved spot whose team won nothing in the previous round has no feeder', () => {
		const b = makeFourTeamBracket({ played: 'semis' });
		const odd = { source: 'r', seed: 1, team: teamAlphas, initialSeed: 1 }; // Alphas lost series 1
		expect(feederOf(odd, 1, b)).toBeNull();
	});
});

describe('connectorsOf / gaps', () => {
	test('lists one connector per fed spot with its gap', () => {
		const b = makeFourTeamBracket({ thirdPlace: true, played: 'semis' });
		const cs = connectorsOf(b);
		expect(cs).toHaveLength(4);
		expect(cs.every((c) => gapOf(c, b) === 0)).toBe(true);
		expect(cs.filter((c) => c.feeder.style === 'consolation')).toHaveLength(2);
	});

	test('gap width is 56px for small brackets and grows with lanes', () => {
		expect(bracketGapPx(makeFourTeamBracket({ played: 'semis' }))).toBe(56);
		const wide = { ...makeFourTeamBracket({ played: 'none' }), rounds: [] };
		expect(bracketGapPx(wide)).toBe(56);
		// 9 lanes → 16 + 9*10 = 106
		const fake = makeFourTeamBracket({ format: 'Fixed', played: 'none' });
		const many = {
			...fake,
			rounds: [
				fake.rounds[0],
				{
					name: 'x',
					series: Array.from({ length: 5 }, (_, i) => ({
						...fake.rounds[1].series[0],
						number: 10 + i
					}))
				}
			]
		};
		expect(bracketGapPx(many)).toBe(16 + 9 * 11);
	});
});
