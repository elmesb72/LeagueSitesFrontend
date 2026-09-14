import type { Game } from '$lib/models/Game';
import type { Location } from '$lib/models/Location';
import type { TournamentLink } from '$lib/models/Playoffs';

const empty = {
	year: new Date().getFullYear(),
	seasonStartDate: null as string | null,
	games: [] as Game[],
	locations: [] as Location[],
	tournaments: [] as TournamentLink[],
	canCreateGame: false
};

export const load = async ({ fetch, url }) => {
	const year = url.searchParams.get('year');
	const query = year ? `?year=${year}` : '';
	try {
		const response = await fetch(`/api/Schedule${query}`);
		if (!response.ok) {
			return { ...empty };
		}
		const data = await response.json();
		return {
			year: data.year as number,
			seasonStartDate: (data.seasonStartDate ?? null) as string | null,
			games: (data.games ?? []) as Game[],
			locations: (data.locations ?? []) as Location[],
			// Playoffs and mid-season tournament seasons, so their games can be tagged and linked.
			tournaments: (data.tournaments ?? []) as TournamentLink[],
			canCreateGame: data.canCreateGame as boolean
		};
	} catch {
		console.error('Failed to fetch schedule. Is the backend available?');
		return { ...empty };
	}
};
