import type { TeamPageData } from '$lib/models/TeamPage';

export const load = async ({ fetch, params, url }) => {
	const year = url.searchParams.get('year');
	const query = year ? `?year=${year}` : '';

	try {
		const response = await fetch(`/api/Teams/${params.abbreviation}/Page${query}`);
		if (!response.ok) {
			return { teamPage: null };
		}

		const data = (await response.json()) as TeamPageData;
		return { teamPage: data };
	} catch {
		console.error('Failed to fetch team data. Is the backend available?');
		return { teamPage: null };
	}
};
