import { describe, test, expect, vi } from 'vitest';
import { SEASON_LOADING, buildSourceGroups, fetchSeasonRanks } from './resolvers';
import {
	deltas,
	makeTournamentDetail,
	mockBoardSources,
	mockStandingsResponse,
	seasonOrder,
	thetas,
	zetas
} from '../../tests/tournamentMocks';

const okFetch = (body: unknown) =>
	vi.fn(async () => ({ ok: true, json: async () => body })) as unknown as typeof fetch;

function groupsWith(seasonRanks = SEASON_LOADING, feedsBracket = true) {
	return buildSourceGroups({
		sources: mockBoardSources,
		tournament: makeTournamentDetail(),
		regularSeasonID: 15,
		seasonRanks,
		feedsBracket
	});
}

describe('fetchSeasonRanks', () => {
	test('returns the ranked teams from the public standings endpoint for that year', async () => {
		const fetchFn = okFetch(mockStandingsResponse);
		const result = await fetchSeasonRanks(2026, fetchFn);
		expect(fetchFn).toHaveBeenCalledWith('/api/Standings?year=2026');
		expect(result.teams?.map((t) => t.name)).toEqual(seasonOrder.map((t) => t.name));
		expect(result.error).toBeNull();
	});

	test('an HTTP failure degrades to a notice, never throws', async () => {
		const fetchFn = vi.fn(async () => ({ ok: false })) as unknown as typeof fetch;
		const result = await fetchSeasonRanks(2026, fetchFn);
		expect(result.teams).toBeNull();
		expect(result.error).toMatch(/could not be loaded/);
	});

	test('a network failure degrades the same way', async () => {
		const fetchFn = vi.fn(async () => {
			throw new Error('offline');
		}) as unknown as typeof fetch;
		const result = await fetchSeasonRanks(2026, fetchFn);
		expect(result.error).toMatch(/could not be loaded/);
	});
});

describe('buildSourceGroups', () => {
	test('produces one group per source with capacity-length ranks', () => {
		const groups = groupsWith();
		expect(groups.map((g) => g.ranks.length)).toEqual([10, 8, 4, 2]);
	});

	test('season standings show as loading until fetched, then resolve to names', () => {
		const loading = groupsWith()[0];
		expect(loading.ranks[0].team).toBeNull();
		expect(loading.note).toMatch(/Loading/);

		const loaded = groupsWith({ teams: seasonOrder, error: null, pending: false })[0];
		expect(loaded.ranks.map((r) => r.team?.name)).toEqual(seasonOrder.map((t) => t.name));
		expect(loaded.note).toMatch(/as of today/);
		expect(loaded.shortLabel).toBe('regular season');
	});

	test('a season fetch failure becomes the group note and ranks stay numeric', () => {
		const failed = groupsWith({
			teams: null,
			error: 'Standings could not be loaded, so ranks are shown as numbers.',
			pending: false
		})[0];
		expect(failed.note).toMatch(/could not be loaded/);
		expect(failed.ranks.every((r) => r.team === null)).toBe(true);
	});

	test('a season that is not the regular season is not previewed', () => {
		const groups = buildSourceGroups({
			sources: [
				{
					sourceType: 'Season',
					sourceID: 99,
					label: 'Other',
					result: 'Standings',
					availableTeams: 3
				}
			],
			tournament: null,
			regularSeasonID: 15,
			seasonRanks: { teams: seasonOrder, error: null, pending: false },
			feedsBracket: true
		});
		expect(groups[0].ranks[0].team).toBeNull();
		expect(groups[0].ranks[0].resolvesWhen).toMatch(/another season/);
	});

	test('pool standings resolve from the loaded tournament, in standings order', () => {
		const pool = groupsWith()[3];
		expect(pool.shortLabel).toBe('Pool A');
		expect(pool.ranks.map((r) => r.team?.name)).toEqual(['Kappas', 'Iotas']);
		expect(pool.note).toMatch(/pool/);
	});

	test('knocked-out teams are ordered by original seed, undecided series contribute nothing', () => {
		const losers = groupsWith()[2];
		expect(losers.shortLabel).toBe('Quarter-finals losers');
		// Deltas (#4) lost as an upset; Zetas (#6) and Thetas (#8) lost as expected; series 2 undecided.
		expect(losers.ranks.map((r) => r.team?.name ?? null)).toEqual([
			deltas.name,
			zetas.name,
			thetas.name,
			null
		]);
		expect(losers.ranks[3].resolvesWhen).toBe('fills in as Quarter-finals series finish');
	});

	test('the reorder caveat is only added when the source feeds a bracket', () => {
		expect(groupsWith(SEASON_LOADING, true)[2].note).toMatch(/may reorder/);
		expect(groupsWith(SEASON_LOADING, false)[2].note).not.toMatch(/may reorder/);
	});

	test('round results are never previewed and say so', () => {
		const results = groupsWith()[1];
		expect(results.shortLabel).toBe('Quarter-finals results');
		expect(results.ranks.every((r) => r.team === null)).toBe(true);
		expect(results.note).toMatch(/not previewed/);
	});

	test('with no tournament loaded, bracket and pool sources fall back to rank numbers with copy', () => {
		const groups = buildSourceGroups({
			sources: mockBoardSources,
			tournament: null,
			regularSeasonID: 15,
			seasonRanks: SEASON_LOADING,
			feedsBracket: true
		});
		expect(groups[2].ranks[0].team).toBeNull();
		expect(groups[2].ranks[0].resolvesWhen).toBe('fills in as round series finish');
		expect(groups[3].ranks[0].resolvesWhen).toBe('fills in as pool games are played');
	});
});
