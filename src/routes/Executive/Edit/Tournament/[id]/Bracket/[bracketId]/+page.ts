import type { TournamentDetail } from '$lib/models/Tournament';

export const load = async ({ fetch, params, parent }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login', tournament: null, bracket: null };
	}

	try {
		const response = await fetch(`/api/Tournament/${params.id}`);
		if (response.status === 403 || response.status === 401) {
			return { redirect: '/User', tournament: null, bracket: null };
		}
		if (!response.ok) {
			return { redirect: '/Executive', tournament: null, bracket: null };
		}

		const tournament = (await response.json()) as TournamentDetail;
		const bracket = tournament.brackets.find((b) => b.id === Number(params.bracketId)) ?? null;

		if (!bracket) {
			return { redirect: `/Executive/Edit/Tournament/${params.id}`, tournament, bracket: null };
		}

		return { redirect: null, tournament, bracket };
	} catch {
		return { redirect: '/User', tournament: null, bracket: null };
	}
};
