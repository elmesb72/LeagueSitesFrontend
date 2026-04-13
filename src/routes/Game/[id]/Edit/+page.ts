import type { Game } from '$lib/models/Game';

interface EditOption {
	id: number;
	name?: string;
	fullName?: string;
}

interface GameEditData {
	game: Game & {
		seasonId: number;
		hostTeamId: number;
		visitingTeamId: number;
		locationId: number;
		statusId: number;
	};
	canEdit: boolean;
	editData: {
		seasons: EditOption[];
		teams: EditOption[];
		locations: EditOption[];
		statuses: EditOption[];
	} | null;
}

export const load = async ({ fetch, params, parent }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login', gameEdit: null };
	}

	try {
		const response = await fetch(`/api/Game/${params.id}`);
		if (!response.ok) {
			return { redirect: null, gameEdit: null };
		}

		const data = (await response.json()) as GameEditData;
		if (!data.canEdit || !data.editData) {
			return { redirect: `/Game/${params.id}`, gameEdit: null };
		}

		return { redirect: null, gameEdit: data };
	} catch {
		return { redirect: `/Game/${params.id}`, gameEdit: null };
	}
};
