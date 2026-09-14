import type { HistoryYear } from '$lib/models/HistoryYear';
import type { TournamentSummary } from '$lib/models/Playoffs';

/** Every year the league has a season for, newest first; an empty list hides the picker. */
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

export const load = async ({ fetch, url }) => {
	const requested = Number(url.searchParams.get('year'));
	const year = Number.isInteger(requested) && requested > 0 ? requested : null;
	const query = year ? `?year=${year}` : '';

	let tournaments: TournamentSummary[] = [];
	let available = true;
	try {
		const response = await fetch(`/api/Tournaments${query}`);
		if (response.ok) tournaments = (await response.json()) as TournamentSummary[];
		else available = false;
	} catch {
		console.error('Failed to fetch tournaments. Is the backend available?');
		available = false;
	}
	const years = await loadYears(fetch);

	return {
		tournaments,
		available,
		years,
		// The year shown: the one asked for, else the one the list came back with, else the newest.
		year: year ?? tournaments[0]?.season.year ?? years[0] ?? null
	};
};
