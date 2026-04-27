import type { UserProfileData } from '$lib/models/UserProfile';

export const load = async ({ fetch, parent }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login', authorized: false };
	}

	try {
		const response = await fetch('/api/User/Profile');
		if (!response.ok) {
			return { redirect: '/User', authorized: false };
		}

		const data = (await response.json()) as UserProfileData;
		const allowed = data.user.userRoles.some(
			(ur) => ur.role?.name === 'Executive' || ur.role?.name === 'Webmaster'
		);
		if (!allowed) {
			return { redirect: '/User', authorized: false };
		}

		return { redirect: null, authorized: true };
	} catch {
		return { redirect: '/User', authorized: false };
	}
};
