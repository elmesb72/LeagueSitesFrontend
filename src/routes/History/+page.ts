import type { HistoryYear } from '$lib/models/HistoryYear';

export const load = async ({ fetch }) => {
	try {
		const response = await fetch('/api/History');
		if (!response.ok) {
			return { years: [] as HistoryYear[] };
		}

		const data = (await response.json()) as HistoryYear[];
		return { years: data };
	} catch {
		console.error('Failed to fetch history. Is the backend available?');
		return { years: [] as HistoryYear[] };
	}
};
