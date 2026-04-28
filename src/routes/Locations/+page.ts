import type { LocationWithGames } from '$lib/models/LocationWithGames';

interface LocationsResponse {
	canEdit: boolean;
	locations: LocationWithGames[];
}

export const load = async ({ fetch, parent }) => {
	try {
		const response = await fetch('/api/Locations');
		if (!response.ok) {
			return { locations: [] as LocationWithGames[], canEdit: false, googleMapsKey: '' };
		}

		const payload = (await response.json()) as LocationsResponse;
		const { siteConfig } = await parent();
		return {
			locations: payload.locations,
			canEdit: payload.canEdit,
			googleMapsKey: siteConfig.apiKeys?.googleMaps ?? ''
		};
	} catch {
		console.error('Failed to fetch locations. Is the backend available?');
		return { locations: [] as LocationWithGames[], canEdit: false, googleMapsKey: '' };
	}
};
