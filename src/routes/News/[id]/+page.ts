export const load = async ({ fetch, params, parent }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login', newsData: null };
	}

	try {
		const response = await fetch(`/api/News/${params.id}`);
		if (response.status === 403 || response.status === 401) {
			return { redirect: '/User', newsData: null };
		}
		if (!response.ok) {
			return { redirect: '/', newsData: null };
		}

		const data = await response.json();
		if (!data.canEdit) {
			return { redirect: '/', newsData: null };
		}

		return { redirect: null, newsData: data };
	} catch {
		return { redirect: '/', newsData: null };
	}
};
