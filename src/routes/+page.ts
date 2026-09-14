import type { Game } from '$lib/models/Game';
import type { News } from '$lib/models/News';
import type { StandingsEntry } from '$lib/models/StandingsEntry';
import type { TournamentLink } from '$lib/models/Playoffs';

const empty = {
	games: [] as Game[],
	news: [] as { news: News; canEdit: boolean; renderedContents: string }[],
	standings: [] as StandingsEntry[],
	isPlayoffs: false,
	tournaments: [] as TournamentLink[],
	canPost: false
};

export const load = async ({ fetch }) => {
	try {
		const response = await fetch('/api/Home');
		if (!response.ok) {
			throw new Error(`API responded with ${response.status}`);
		}
		const data = await response.json();
		return {
			games: data.games as Game[],
			news: data.news as { news: News; canEdit: boolean; renderedContents: string }[],
			standings: (data.standings ?? []) as StandingsEntry[],
			isPlayoffs: data.isPlayoffs as boolean,
			// This year's mid-season tournaments: a callout each, beside the playoffs one.
			tournaments: (data.tournaments ?? []) as TournamentLink[],
			canPost: data.canPost as boolean
		};
	} catch {
		console.error('Failed to fetch homepage data. Is the backend available?');
		return { ...empty };
	}
};
