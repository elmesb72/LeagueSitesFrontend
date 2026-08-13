import type { SeedGroup, TournamentDetail } from '$lib/models/Tournament';

export const load = async ({ fetch, params, parent }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login', tournament: null, defaultSeeding: null };
	}

	try {
		const [detailResponse, seedingResponse] = await Promise.all([
			fetch(`/api/Tournament/${params.id}`),
			fetch(`/api/Tournament/${params.id}/DefaultSeeding`)
		]);

		if (detailResponse.status === 403 || detailResponse.status === 401) {
			return { redirect: '/User', tournament: null, defaultSeeding: null };
		}
		if (!detailResponse.ok) {
			return { redirect: '/Executive', tournament: null, defaultSeeding: null };
		}

		const tournament = (await detailResponse.json()) as TournamentDetail;
		const defaultSeeding = seedingResponse.ok
			? ((await seedingResponse.json()) as SeedGroup | null)
			: null;

		return { redirect: null, tournament, defaultSeeding };
	} catch {
		return { redirect: '/User', tournament: null, defaultSeeding: null };
	}
};
