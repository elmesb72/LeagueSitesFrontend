import type { Season } from '$lib/models/Season';
import type { StandingsEntry } from '$lib/models/StandingsEntry';
import type { TournamentLink } from '$lib/models/Playoffs';

export const load = async ({ fetch, url }) => {
	const year = url.searchParams.get('year');
	const query = year ? `?year=${year}` : '';
	try {
		const response = await fetch(`/api/Standings${query}`);
		if (!response.ok) {
			return {
				season: null,
				standings: [] as StandingsEntry[],
				tournaments: [] as TournamentLink[]
			};
		}
		const data = await response.json();
		return {
			season: data.season as Season,
			standings: data.standings as StandingsEntry[],
			// The year's playoffs and mid-season tournaments, for the line under the heading.
			tournaments: (data.tournaments ?? []) as TournamentLink[]
		};
	} catch {
		console.error('Failed to fetch standings. Is the backend available?');
		return { season: null, standings: [] as StandingsEntry[], tournaments: [] as TournamentLink[] };
	}
};
