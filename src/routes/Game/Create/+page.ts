import type { Game } from '$lib/models/Game';

interface EditOption {
	id: number;
	name?: string;
	fullName?: string;
}

interface CreateReferenceData {
	seasons: EditOption[];
	teams: EditOption[];
	locations: EditOption[];
	statuses: EditOption[];
}

interface PrefillFromGame {
	seasonID: number;
	hostTeamID: number;
	visitingTeamID: number;
	locationID: number;
}

export const load = async ({ fetch, url, parent }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login', createData: null, prefillDate: '', prefillLocationId: 0, prefillFromGame: null, rescheduleFromId: null };
	}

	const date = url.searchParams.get('date') ?? '';
	const location = url.searchParams.get('location');
	const rescheduleFrom = url.searchParams.get('rescheduleFrom');

	try {
		const response = await fetch('/api/Game/Create');
		if (response.status === 403 || response.status === 401) {
			return { redirect: '/User', createData: null, prefillDate: date, prefillLocationId: 0, prefillFromGame: null, rescheduleFromId: null };
		}
		if (!response.ok) {
			return { redirect: '/Schedule', createData: null, prefillDate: date, prefillLocationId: 0, prefillFromGame: null, rescheduleFromId: null };
		}

		const data = (await response.json()) as CreateReferenceData;

		let prefillFromGame: PrefillFromGame | null = null;
		if (rescheduleFrom) {
			try {
				const gameResponse = await fetch(`/api/Game/${rescheduleFrom}`);
				if (gameResponse.ok) {
					const gameData = await gameResponse.json();
					const g = gameData.game as Game & {
						seasonId: number;
						hostTeamId: number;
						visitingTeamId: number;
						locationId: number;
					};
					prefillFromGame = {
						seasonID: g.seasonId ?? g.season.id,
						hostTeamID: g.hostTeamId ?? g.hostTeam.id,
						visitingTeamID: g.visitingTeamId ?? g.visitingTeam.id,
						locationID: g.locationId ?? g.location.id
					};
				}
			} catch {
				console.error('Failed to load game to reschedule from.');
			}
		}

		return {
			redirect: null,
			createData: data,
			prefillDate: date,
			prefillLocationId: location ? parseInt(location) : 0,
			prefillFromGame,
			rescheduleFromId: rescheduleFrom ? parseInt(rescheduleFrom) : null
		};
	} catch {
		return { redirect: '/Schedule', createData: null, prefillDate: '', prefillLocationId: 0, prefillFromGame: null, rescheduleFromId: null };
	}
};
