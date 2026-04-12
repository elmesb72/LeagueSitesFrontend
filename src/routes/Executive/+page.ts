import type { ExecutiveDashboard } from '$lib/models/Executive';
import type { UserProfileData } from '$lib/models/UserProfile';

export const load = async ({ fetch, parent }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login', dashboard: null };
	}

	try {
		const response = await fetch('/api/Executive/Dashboard');
		if (response.status === 403 || response.status === 401) {
			return { redirect: '/User', dashboard: null };
		}
		if (!response.ok) {
			return { redirect: null, dashboard: null };
		}

		const data = (await response.json()) as ExecutiveDashboard;
		return { redirect: null, dashboard: data };
	} catch {
		return { redirect: '/User', dashboard: null };
	}
};
