import type { TournamentDetail } from '$lib/models/Tournament';

export const load = async ({ fetch, params, parent }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login', tournament: null };
	}

	try {
		const response = await fetch(`/api/Tournament/${params.id}`);
		if (response.status === 403 || response.status === 401) {
			return { redirect: '/User', tournament: null };
		}
		if (!response.ok) {
			return { redirect: '/Executive', tournament: null };
		}

		const tournament = (await response.json()) as TournamentDetail;
		return { redirect: null, tournament };
	} catch {
		return { redirect: '/User', tournament: null };
	}
};
