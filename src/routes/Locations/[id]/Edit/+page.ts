export interface LocationEditData {
	id: number;
	active: boolean;
	name: string;
	formalName: string | null;
	city: string;
	address: string | null;
	mapsPlaceID: string | null;
}

export const load = async ({ fetch, params, parent }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login', location: null };
	}

	try {
		const response = await fetch(`/api/Locations/${params.id}`);
		if (response.status === 401 || response.status === 403) {
			return { redirect: '/Locations', location: null };
		}
		if (!response.ok) {
			return { redirect: '/Locations', location: null };
		}

		const location = (await response.json()) as LocationEditData;
		return { redirect: null, location };
	} catch {
		return { redirect: '/Locations', location: null };
	}
};
