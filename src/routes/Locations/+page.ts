import type { LocationWithGames } from '$lib/models/LocationWithGames';

export const load = async ({ fetch, parent }) => {
	try {
		const response = await fetch('/api/Locations');
		if (!response.ok) {
			return { locations: [] as LocationWithGames[], googleMapsKey: '' };
		}

		const locations = (await response.json()) as LocationWithGames[];
		const { siteConfig } = await parent();
		return { locations, googleMapsKey: siteConfig.apiKeys?.googleMaps ?? '' };
	} catch {
		console.error('Failed to fetch locations. Is the backend available?');
		return { locations: [] as LocationWithGames[], googleMapsKey: '' };
	}
};
