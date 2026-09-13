import type { TournamentDetail } from '$lib/models/Tournament';
import { poolPrefill, type PoolPrefill } from '$lib/tournament/prefill';

export const load = async ({ fetch, params, parent, url }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login', tournament: null, prefill: null as PoolPrefill | null };
	}

	try {
		const detailResponse = await fetch(`/api/Tournament/${params.id}`);
		if (detailResponse.status === 403 || detailResponse.status === 401) {
			return { redirect: '/User', tournament: null, prefill: null as PoolPrefill | null };
		}
		if (!detailResponse.ok) {
			return { redirect: '/Executive', tournament: null, prefill: null as PoolPrefill | null };
		}
		const tournament = (await detailResponse.json()) as TournamentDetail;
		// "Add a B-side pool for them" arrives as ?losersOf={roundId}; a plain visit starts empty.
		const prefill = poolPrefill(tournament, url.searchParams);
		return { redirect: null, tournament, prefill };
	} catch {
		return { redirect: '/User', tournament: null, prefill: null as PoolPrefill | null };
	}
};
