import { describe, test, expect } from 'vitest';
import {
	championHeadingFor,
	dateRangeText,
	progressText,
	shortNameOf,
	toLinks,
	tournamentHref
} from './summaries';
import type { TournamentData, TournamentSummary } from '$lib/models/Playoffs';
import { makeFourTeamBracket, teamAlphas, teamBetas } from '../../tests/playoffMocks';

function summary(overrides: Partial<TournamentSummary> = {}): TournamentSummary {
	return {
		id: 31,
		name: '2027 Canada Day Cup',
		kind: 'tournament',
		season: {
			id: 302,
			year: 2027,
			subseason: 'Tournament',
			name: '2027 Canada Day Cup',
			startDate: '2027-07-01T00:00:00'
		},
		startDate: '2027-07-01T00:00:00',
		firstGame: null,
		lastGame: null,
		gamesScheduled: 0,
		gamesPlayed: 0,
		decided: false,
		titles: [],
		...overrides
	};
}

describe('tournament summaries', () => {
	test('the playoffs live at /Playoffs by year, a cup at /Tournaments by id', () => {
		expect(tournamentHref('playoffs', 30, 2027)).toBe('/Playoffs?year=2027');
		expect(tournamentHref('tournament', 31, 2027)).toBe('/Tournaments/31');
		expect(tournamentHref('playoffs', 30, null)).toBe('/Tournaments/30');
	});

	test('short names and links', () => {
		const playoffs = summary({
			id: 30,
			kind: 'playoffs',
			name: '2027 Playoffs',
			season: {
				...summary().season,
				id: 301,
				subseason: 'Playoffs',
				name: '2027 Playoffs'
			}
		});
		expect(shortNameOf(playoffs)).toBe('Playoffs');
		expect(shortNameOf(summary())).toBe('Canada Day Cup');
		expect(toLinks([playoffs, summary()])).toEqual([
			{
				seasonId: 301,
				tournamentId: 30,
				name: '2027 Playoffs',
				shortName: 'Playoffs',
				kind: 'playoffs'
			},
			{
				seasonId: 302,
				tournamentId: 31,
				name: '2027 Canada Day Cup',
				shortName: 'Canada Day Cup',
				kind: 'tournament'
			}
		]);
	});

	test('progress reads as a fan would say it', () => {
		expect(progressText(summary())).toBe('No games scheduled yet');
		expect(progressText(summary({ gamesScheduled: 1, gamesPlayed: 0 }))).toBe('0 of 1 game played');
		expect(progressText(summary({ gamesScheduled: 12, gamesPlayed: 4 }))).toBe(
			'4 of 12 games played'
		);
		expect(
			progressText(summary({ decided: true, titles: [{ label: 'Final', team: teamAlphas }] }))
		).toBe('Won by Alpha City Alphas');
		expect(
			progressText(
				summary({
					decided: true,
					titles: [
						{ label: 'Main', team: teamAlphas },
						{ label: 'B Final', team: teamBetas }
					]
				})
			)
		).toBe('Main: Alpha City Alphas, B Final: Beta Town Betas');
		expect(progressText(summary({ decided: true }))).toBe('Decided');
	});

	test('dates: the games when there are some, else the start date', () => {
		expect(dateRangeText(summary())).toMatch(/^From /);
		expect(
			dateRangeText(summary({ firstGame: '2027-07-01T19:00:00', lastGame: '2027-07-01T21:00:00' }))
		).not.toContain('\u2013');
		expect(
			dateRangeText(summary({ firstGame: '2027-07-01T19:00:00', lastGame: '2027-07-03T21:00:00' }))
		).toContain('\u2013');
	});

	test('a cup with one marked bracket says "{name} Champions"; several name the stage too', () => {
		const one: TournamentData = {
			...makePlayoffsLike(),
			brackets: [makeFourTeamBracket({ played: 'all' })]
		};
		expect(championHeadingFor(one)(one.brackets[0])).toBe('2027 Canada Day Cup Champions');

		const two: TournamentData = {
			...makePlayoffsLike(),
			brackets: [
				makeFourTeamBracket({ played: 'all', name: 'Main' }),
				makeFourTeamBracket({ played: 'all', name: 'B Final' })
			]
		};
		expect(championHeadingFor(two)(two.brackets[1])).toBe(
			'2027 Canada Day Cup \u00b7 B Final Champions'
		);
	});
});

function makePlayoffsLike(): TournamentData {
	return {
		id: 31,
		name: '2027 Canada Day Cup',
		kind: 'tournament',
		season: summary().season,
		brackets: [],
		roundRobins: []
	};
}
