import type { Season } from '$lib/models/Season';
import type { StandingsEntry } from '$lib/models/StandingsEntry';

export const load = async ({ fetch, url }) => {
	const year = url.searchParams.get('year');
	const query = year ? `?year=${year}` : '';

	try {
		const response = await fetch(`/api/Standings${query}`);
		if (!response.ok) {
			return { season: null, standings: [] as StandingsEntry[] };
		}

		const data = await response.json();
		return {
			season: data.season as Season,
			standings: data.standings as StandingsEntry[]
		};
	} catch {
		console.error('Failed to fetch standings. Is the backend available?');
		return { season: null, standings: [] as StandingsEntry[] };
	}
};
