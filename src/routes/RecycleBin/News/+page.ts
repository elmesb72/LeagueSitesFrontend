import type { News } from '$lib/models/News';

export const load = async ({ fetch, parent }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login', deletedNews: [] };
	}

	try {
		const response = await fetch('/api/News/RecycleBin');
		if (!response.ok) {
			return { redirect: '/User', deletedNews: [] };
		}

		const data = (await response.json()) as News[];
		if (data.length === 0) {
			return { redirect: '/User', deletedNews: [] };
		}

		return { redirect: null, deletedNews: data };
	} catch {
		return { redirect: '/User', deletedNews: [] };
	}
};
