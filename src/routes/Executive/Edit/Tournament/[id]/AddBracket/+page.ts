import type { SeedGroup, TournamentDetail } from '$lib/models/Tournament';
import { bracketPrefill, type BracketPrefill } from '$lib/tournament/prefill';

const nothing = { tournament: null, defaultSeeding: null, prefill: null as BracketPrefill | null };

export const load = async ({ fetch, params, parent, url }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login', ...nothing };
	}

	try {
		const [detailResponse, seedingResponse] = await Promise.all([
			fetch(`/api/Tournament/${params.id}`),
			fetch(`/api/Tournament/${params.id}/DefaultSeeding`)
		]);
		if (detailResponse.status === 403 || detailResponse.status === 401) {
			return { redirect: '/User', ...nothing };
		}
		if (!detailResponse.ok) {
			return { redirect: '/Executive', ...nothing };
		}
		const tournament = (await detailResponse.json()) as TournamentDetail;
		// "Set up the final" arrives as ?afterPool={poolId}&top={n} and wins over the
		// regular-season default the API suggests for a first bracket.
		const prefill = bracketPrefill(tournament, url.searchParams);
		const defaultSeeding =
			prefill?.seeding ??
			(seedingResponse.ok ? ((await seedingResponse.json()) as SeedGroup | null) : null);
		return { redirect: null, tournament, defaultSeeding, prefill };
	} catch {
		return { redirect: '/User', ...nothing };
	}
};
