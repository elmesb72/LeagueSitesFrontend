import type { HistoryYear } from '$lib/models/HistoryYear';
import type { PlayoffsData } from '$lib/models/Playoffs';

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

export const load = async ({ fetch, url }) => {
	const requested = Number(url.searchParams.get('year'));
	const year = Number.isInteger(requested) && requested > 0 ? requested : null;
	const query = year ? `?year=${year}` : '';

	const [playoffs, years] = await Promise.all([
		(async (): Promise<PlayoffsData | null> => {
			try {
				const response = await fetch(`/api/Playoffs${query}`);
				if (!response.ok) return null;
				return (await response.json()) as PlayoffsData;
			} catch {
				console.error('Failed to fetch playoffs. Is the backend available?');
				return null;
			}
		})(),
		loadYears(fetch)
	]);

	return { playoffs, years, year };
};
