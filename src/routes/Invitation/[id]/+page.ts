export const load = async ({ fetch, params, parent }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login', invitation: null, refData: null };
	}

	try {
		const [invResponse, refResponse] = await Promise.all([
			fetch(`/api/Invitation/${params.id}`),
			fetch('/api/Invitation/Create')
		]);

		if (invResponse.status === 403 || invResponse.status === 401) {
			return { redirect: '/User', invitation: null, refData: null };
		}
		if (!invResponse.ok || !refResponse.ok) {
			return { redirect: '/', invitation: null, refData: null };
		}

		const invitation = await invResponse.json();
		const refData = await refResponse.json();
		return { redirect: null, invitation, refData };
	} catch {
		return { redirect: '/', invitation: null, refData: null };
	}
};
