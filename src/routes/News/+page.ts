export const load = async ({ fetch, parent }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login', createData: null };
	}

	try {
		const response = await fetch('/api/News/Create');
		if (response.status === 403 || response.status === 401) {
			return { redirect: '/User', createData: null };
		}
		if (!response.ok) {
			return { redirect: '/', createData: null };
		}

		const data = await response.json();
		return { redirect: null, createData: data };
	} catch {
		return { redirect: '/', createData: null };
	}
};
