import { describe, test, expect } from 'vitest';
import { leadAfterEachGame, sortGames } from './seriesLead';
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

	test('duplicate game numbers (two "game 1"s) are ordered by date and each row keeps its own entry', () => {
		// The 2025 CLFB final was entered as game 1 twice: Sep 15 and Sep 17.
		const s1 = makeFourTeamBracket({ played: 'semis', upset: false }).rounds[0].series[0];
		const twice = {
			...s1,
			games: [
				{
					gameNumber: 1,
					game: makePlayedGame(490, teamAlphas, teamDeltas, 5, 3, '2025-09-15T20:30:00')
				},
				{
					gameNumber: 1,
					game: makePlayedGame(491, teamDeltas, teamAlphas, 2, 6, '2025-09-17T20:30:00')
				}
			]
		};
		expect(leadAfterEachGame(twice)).toEqual(['Alphas lead 1-0', 'Alphas win 2-0']);
		// Array order does not matter; the dates decide.
		expect(leadAfterEachGame({ ...twice, games: [twice.games[1], twice.games[0]] })).toEqual([
			'Alphas win 2-0',
			'Alphas lead 1-0'
		]);
	});

	test('aggregate series show the running run differential', () => {
		const s1 = makeFourTeamBracket({ played: 'semis', upset: false }).rounds[0].series[0];
		const agg = { ...s1, format: 'Aggregate', hostOrder: '12' };
		// 5-3 Alphas then Alphas 4-2 as visitors → Alphas +2, then +4
		expect(leadAfterEachGame(agg)).toEqual(['Alphas +2', 'Alphas +4', null]);
	});
});

describe('sortGames', () => {
	test('puts games in playing order: number, then date, then position', () => {
		const s1 = makeFourTeamBracket({ played: 'semis' }).rounds[0].series[0];
		// The API lists by database id, so a late-added game 3 can come first.
		const api = [s1.games[2], s1.games[0], s1.games[1]];
		expect(sortGames(api).map((g) => g.gameNumber)).toEqual([1, 2, 3]);

		const twice = [
			{
				gameNumber: 1,
				game: makePlayedGame(491, teamDeltas, teamAlphas, 2, 6, '2025-09-17T20:30:00')
			},
			{ gameNumber: 2, game: null },
			{
				gameNumber: 1,
				game: makePlayedGame(490, teamAlphas, teamDeltas, 5, 3, '2025-09-15T20:30:00')
			}
		];
		expect(sortGames(twice).map((g) => g.game?.id ?? null)).toEqual([490, 491, null]);
	});

	test('does not mutate the input', () => {
		const s1 = makeFourTeamBracket({ played: 'semis' }).rounds[0].series[0];
		const api = [s1.games[2], s1.games[0], s1.games[1]];
		sortGames(api);
		expect(api.map((g) => g.gameNumber)).toEqual([3, 1, 2]);
	});
});
