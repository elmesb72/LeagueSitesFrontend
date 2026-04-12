import type { PlayoffsData } from '$lib/models/Playoffs';

export const load = async ({ fetch, url }) => {
	const year = url.searchParams.get('year');
	const query = year ? `?year=${year}` : '';

	try {
		const response = await fetch(`/api/Playoffs${query}`);
		if (!response.ok) {
			return { playoffs: null };
		}

		const data = (await response.json()) as PlayoffsData;
		return { playoffs: data };
	} catch {
		console.error('Failed to fetch playoffs. Is the backend available?');
		return { playoffs: null };
	}
};
