import type { TournamentDetail } from '$lib/models/Tournament';

export const load = async ({ fetch, params, parent }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login', tournament: null, pool: null };
	}

	try {
		const response = await fetch(`/api/Tournament/${params.id}`);
		if (response.status === 403 || response.status === 401) {
			return { redirect: '/User', tournament: null, pool: null };
		}
		if (!response.ok) {
			return { redirect: '/Executive', tournament: null, pool: null };
		}

		const tournament = (await response.json()) as TournamentDetail;
		const pool = tournament.roundRobins.find((r) => r.id === Number(params.poolId)) ?? null;

		if (!pool) {
			return { redirect: `/Executive/Edit/Tournament/${params.id}`, tournament, pool: null };
		}

		return { redirect: null, tournament, pool };
	} catch {
		return { redirect: '/User', tournament: null, pool: null };
	}
};
