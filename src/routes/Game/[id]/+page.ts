import type { Game } from '$lib/models/Game';

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
			return { gameData: null };
		}

		const data = (await response.json()) as GamePageData;
		return { gameData: data };
	} catch {
		console.error('Failed to fetch game data. Is the backend available?');
		return { gameData: null };
	}
};
