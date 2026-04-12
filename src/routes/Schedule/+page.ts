import type { Game } from '$lib/models/Game';
import type { Location } from '$lib/models/Location';

export const load = async ({ fetch, url }) => {
	const year = url.searchParams.get('year');
	const query = year ? `?year=${year}` : '';

	try {
		const response = await fetch(`/api/Schedule${query}`);
		if (!response.ok) {
			return { year: new Date().getFullYear(), seasonStartDate: null, games: [] as Game[], locations: [] as Location[], canCreateGame: false };
		}

		const data = await response.json();
		return {
			year: data.year as number,
			seasonStartDate: (data.seasonStartDate ?? null) as string | null,
			games: (data.games ?? []) as Game[],
			locations: (data.locations ?? []) as Location[],
			canCreateGame: data.canCreateGame as boolean
		};
	} catch {
		console.error('Failed to fetch schedule. Is the backend available?');
		return { year: new Date().getFullYear(), seasonStartDate: null, games: [] as Game[], locations: [] as Location[], canCreateGame: false };
	}
};
