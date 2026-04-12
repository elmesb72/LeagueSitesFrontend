import type { Game } from '$lib/models/Game';

export const load = async ({ fetch, parent }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login', games: [] as Game[] };
	}

	try {
		const response = await fetch('/api/Executive/DeletedGames');
		if (response.status === 403 || response.status === 401) {
			return { redirect: '/User', games: [] as Game[] };
		}
		if (!response.ok) {
			return { redirect: null, games: [] as Game[] };
		}

		const data = (await response.json()) as Game[];
		return { redirect: null, games: data };
	} catch {
		return { redirect: '/User', games: [] as Game[] };
	}
};
