interface EditOption {
	id: number;
	name?: string;
	fullName?: string;
}

interface CreateReferenceData {
	seasons: EditOption[];
	teams: EditOption[];
	locations: EditOption[];
	statuses: EditOption[];
}

export const load = async ({ fetch, url, parent }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login', createData: null, prefillDate: '', prefillLocationId: 0 };
	}

	const date = url.searchParams.get('date') ?? '';
	const location = url.searchParams.get('location');

	try {
		const response = await fetch('/api/Game/Create');
		if (response.status === 403 || response.status === 401) {
			return { redirect: '/User', createData: null, prefillDate: date, prefillLocationId: 0 };
		}
		if (!response.ok) {
			return { redirect: '/Schedule', createData: null, prefillDate: date, prefillLocationId: 0 };
		}

		const data = (await response.json()) as CreateReferenceData;
		return {
			redirect: null,
			createData: data,
			prefillDate: date,
			prefillLocationId: location ? parseInt(location) : 0
		};
	} catch {
		return { redirect: '/Schedule', createData: null, prefillDate: '', prefillLocationId: 0 };
	}
};
