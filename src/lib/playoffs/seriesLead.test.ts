import { describe, test, expect } from 'vitest';
import { leadAfterEachGame } from './seriesLead';
import {
	makeFourTeamBracket,
	makePlayedGame,
	makeTiedGame,
	teamAlphas,
	teamDeltas
} from '../../tests/playoffMocks';

describe('leadAfterEachGame', () => {
	test('lead, tied, win at the clinch — with a forfeit counted', () => {
		const s1 = makeFourTeamBracket({ played: 'semis' }).rounds[0].series[0];
		expect(leadAfterEachGame(s1)).toEqual(['Deltas lead 1-0', 'Tied 1-1', 'Deltas win 2-1']);
	});

	test('a 2-0 series with an unscheduled third game', () => {
		const s2 = makeFourTeamBracket({ played: 'semis' }).rounds[0].series[1];
		expect(leadAfterEachGame(s2)).toEqual(['Betas lead 1-0', 'Betas win 2-0', null]);
	});

	test('unplayed games and unresolved series produce nulls', () => {
		const b = makeFourTeamBracket({ played: 'none' });
		expect(leadAfterEachGame(b.rounds[0].series[0])).toEqual([null, null, null]);
		expect(leadAfterEachGame(b.rounds[1].series[0])).toEqual([null, null, null]);
	});

	test('a tied game does not move the score', () => {
		const s1 = makeFourTeamBracket({ played: 'semis' }).rounds[0].series[0];
		const withTie = {
			...s1,
			games: [
				{ gameNumber: 1, game: makePlayedGame(1, teamAlphas, teamDeltas, 5, 3) },
				{ gameNumber: 2, game: makeTiedGame(2, teamDeltas, teamAlphas, 4) },
				{ gameNumber: 3, game: makePlayedGame(3, teamAlphas, teamDeltas, 6, 1) }
			]
		};
		expect(leadAfterEachGame(withTie)).toEqual(['Alphas lead 1-0', null, 'Alphas win 2-0']);
	});

	test('tallies in gameNumber order even when the array is not', () => {
		const s1 = makeFourTeamBracket({ played: 'semis' }).rounds[0].series[0];
		const shuffled = { ...s1, games: [s1.games[2], s1.games[0], s1.games[1]] };
		expect(leadAfterEachGame(shuffled)).toEqual(['Deltas win 2-1', 'Deltas lead 1-0', 'Tied 1-1']);
	});

	test('aggregate series show the running run differential', () => {
		const s1 = makeFourTeamBracket({ played: 'semis', upset: false }).rounds[0].series[0];
		const agg = { ...s1, format: 'Aggregate', hostOrder: '12' };
		// 5-3 Alphas then Alphas 4-2 as visitors → Alphas +2, then +4
		expect(leadAfterEachGame(agg)).toEqual(['Alphas +2', 'Alphas +4', null]);
	});
});
