import type { HistoryYear } from '$lib/models/HistoryYear';
import type { PlayoffsData } from '$lib/models/Playoffs';
import { loadTournamentSummaries } from '$lib/tournaments/summaries';

/**
 * What the page should say when there is nothing to draw:
 *  - ok:          brackets or pools to show
 *  - empty:       the season exists but has no brackets or pools yet
 *  - notFound:    no playoffs recorded for the requested year (404)
 *  - unavailable: the backend failed or could not be reached
 */
export type PlayoffsState = 'ok' | 'empty' | 'notFound' | 'unavailable';

/**
 * Every year the league has a season for, newest first. Drives the year picker;
 * an empty list simply hides it, so a History failure never breaks the page.
 */
async function loadYears(fetchFn: typeof fetch): Promise<number[]> {
	try {
		const response = await fetchFn('/api/History');
		if (!response.ok) return [];
		const history = (await response.json()) as HistoryYear[];
		return [...new Set(history.map((y) => y.calendarYear))].sort((a, b) => b - a);
	} catch {
		return [];
	}
}

async function loadPlayoffs(
	fetchFn: typeof fetch,
	query: string
): Promise<{ playoffs: PlayoffsData | null; state: PlayoffsState }> {
	try {
		const response = await fetchFn(`/api/Playoffs${query}`);
		if (response.status === 404) return { playoffs: null, state: 'notFound' };
		if (!response.ok) return { playoffs: null, state: 'unavailable' };
		const playoffs = (await response.json()) as PlayoffsData;
		const empty = playoffs.brackets.length === 0 && playoffs.roundRobins.length === 0;
		return { playoffs, state: empty ? 'empty' : 'ok' };
	} catch {
		console.error('Failed to fetch playoffs. Is the backend available?');
		return { playoffs: null, state: 'unavailable' };
	}
}

/**
 * Where an executive edits the playoffs being shown, or null for everyone else.
 * The lookup sits behind the Executive/Webmaster policy, so a 403 doubles as
 * "not allowed to edit"; only asked for signed-in users, and any failure just
 * means no link.
 */
async function loadEditUrl(
	fetchFn: typeof fetch,
	seasonId: number | undefined,
	signedIn: boolean
): Promise<string | null> {
	if (!signedIn || !seasonId) return null;
	try {
		const response = await fetchFn(`/api/Tournament/ForSeason/${seasonId}`);
		if (!response.ok) return null;
		const { id } = (await response.json()) as { id: number };
		return `/Executive/Edit/Tournament/${id}`;
	} catch {
		return null;
	}
}

export const load = async ({ fetch, url, parent }) => {
	const requested = Number(url.searchParams.get('year'));
	const year = Number.isInteger(requested) && requested > 0 ? requested : null;
	const query = year ? `?year=${year}` : '';

	const [{ playoffs, state }, years, { user }] = await Promise.all([
		loadPlayoffs(fetch, query),
		loadYears(fetch),
		parent()
	]);
	const shownYear = playoffs?.season?.year ?? year ?? null;
	const [editUrl, others] = await Promise.all([
		loadEditUrl(fetch, playoffs?.season?.id, user?.isAuthenticated ?? false),
		// The year's mid-season tournaments, for the "Also in {year}" strip.
		shownYear ? loadTournamentSummaries(fetch, shownYear) : Promise.resolve([])
	]);

	return { playoffs, state, years, year, editUrl, others };
};
