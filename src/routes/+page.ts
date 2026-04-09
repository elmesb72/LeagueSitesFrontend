import type { Game } from '$lib/models/Game';
import type { News } from '$lib/models/News';
import type { StandingsEntry } from '$lib/models/StandingsEntry';

export const load = async ({ fetch }) => {
	try {
		const response = await fetch('/api/Home');
		if (!response.ok) {
			throw new Error(`API responded with ${response.status}`);
		}

		const data = await response.json();

		return {
			games: data.games as Game[],
			news: data.news as News[],
			standings: (data.standings ?? []) as StandingsEntry[],
			isPlayoffs: data.isPlayoffs as boolean
		};
	} catch {
		console.error('Failed to fetch homepage data. Is the backend available?');
		return {
			games: [] as Game[],
			news: [] as News[],
			standings: [] as StandingsEntry[],
			isPlayoffs: false
		};
	}
};
