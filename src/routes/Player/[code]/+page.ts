import type { PlayerPageData } from '$lib/models/PlayerPage';

export const load = async ({ fetch, params }) => {
	try {
		const response = await fetch(`/api/Player/${params.code}`);
		if (!response.ok) {
			return { playerData: null };
		}

		const data = (await response.json()) as PlayerPageData;
		return { playerData: data };
	} catch {
		console.error('Failed to fetch player data. Is the backend available?');
		return { playerData: null };
	}
};
