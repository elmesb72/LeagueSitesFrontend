import { describe, test, expect } from 'vitest';
import { comingUp, nextGameOf } from './nextGames';
import { makeFourTeamBracket, makePlayoffs } from '../../tests/playoffMocks';

const NOW = new Date('2026-09-05T12:00:00');

describe('nextGameOf', () => {
	test('the earliest upcoming game of a live series', () => {
		const final = makeFourTeamBracket({ played: 'semis' }).rounds[1].series[0];
		expect(nextGameOf(final, NOW)?.id).toBe(521);
	});

	test('nothing for a decided series, an unresolved one, or one with no scheduled games', () => {
		expect(
			nextGameOf(makeFourTeamBracket({ played: 'semis' }).rounds[0].series[0], NOW)
		).toBeNull();
		expect(nextGameOf(makeFourTeamBracket({ played: 'none' }).rounds[1].series[0], NOW)).toBeNull();
		const final = makeFourTeamBracket({ played: 'semis' }).rounds[1].series[0];
		expect(
			nextGameOf({ ...final, games: final.games.map((g) => ({ ...g, game: null })) }, NOW)
		).toBeNull();
	});

	test('a game dated today counts all day; a game before today does not', () => {
		const final = makeFourTeamBracket({ played: 'semis' }).rounds[1].series[0];
		expect(nextGameOf(final, new Date('2026-09-10T23:30:00'))?.id).toBe(521);
		expect(nextGameOf(final, new Date('2026-09-11T00:30:00'))?.id).toBe(522);
	});
});

describe('comingUp', () => {
	test('one entry per live series with a game, soonest first, across brackets', () => {
		const main = makeFourTeamBracket({ played: 'semis', thirdPlace: true });
		const b = makeFourTeamBracket({ played: 'none', name: 'B Side' });
		const entries = comingUp(makePlayoffs([main, b]), NOW);
		// Final (Sep 10), 3rd place (Sep 11) from Main; B Side semis (Sep 20 ×2)
		expect(entries.map((e) => `${e.bracket.name}:${e.series.number}:${e.game.id}`)).toEqual([
			'Main:3:521',
			'Main:4:531',
			'B Side:1:501',
			'B Side:2:511'
		]);
	});

	test('empty when every series is decided', () => {
		expect(comingUp(makePlayoffs([makeFourTeamBracket({ played: 'all' })]), NOW)).toEqual([]);
	});
});
