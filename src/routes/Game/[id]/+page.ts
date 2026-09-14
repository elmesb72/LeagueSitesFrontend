import type { Game } from '$lib/models/Game';
import type { TournamentLink } from '$lib/models/Playoffs';
import { loadTournamentSummaries, toLinks } from '$lib/tournaments/summaries';

interface GamePageData {
	game: Game & {
		seasonId: number;
		hostTeamId: number;
		visitingTeamId: number;
		locationId: number;
		statusId: number;
	};
	canEdit: boolean;
	canDelete: boolean;
}

export const load = async ({ fetch, params }) => {
	try {
		const response = await fetch(`/api/Game/${params.id}`);
		if (!response.ok) {
			return { gameData: null, tournament: null as TournamentLink | null };
		}
		const data = (await response.json()) as GamePageData;

		// A playoffs or cup game says which tournament it belongs to. Regular-season
		// games skip the extra request.
		let tournament: TournamentLink | null = null;
		const season = data.game.season;
		if (season && season.subseason !== 'Regular Season') {
			const summaries = await loadTournamentSummaries(fetch, season.year);
			tournament = toLinks(summaries).find((t) => t.seasonId === season.id) ?? null;
		}
		return { gameData: data, tournament };
	} catch {
		console.error('Failed to fetch game data. Is the backend available?');
		return { gameData: null, tournament: null as TournamentLink | null };
	}
};
