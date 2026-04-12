import type { UserProfileData } from '$lib/models/UserProfile';

export const load = async ({ fetch, url, parent }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login', profile: null, providers: [], error: '' };
	}

	const error = url.searchParams.get('error') ?? '';

	try {
		const [profileResponse, loginResponse] = await Promise.all([
			fetch('/api/User/Profile'),
			fetch('/api/Login')
		]);

		if (!profileResponse.ok) {
			return { redirect: null, profile: null, providers: [], error };
		}

		const data = (await profileResponse.json()) as UserProfileData;
		const loginData = loginResponse.ok ? await loginResponse.json() : { providers: [] };

		return { redirect: null, profile: data, providers: loginData.providers as { name: string; url: string }[], error };
	} catch {
		console.error('Failed to fetch user profile. Is the backend available?');
		return { redirect: null, profile: null, providers: [], error };
	}
};
