import type { UserProfileData } from '$lib/models/UserProfile';

export interface SiteEvent {
	id: number;
	type: 'Information' | 'Update' | 'Error';
	date: string;
	userID: number;
	userName: string | null;
	resource: string;
	summary: string;
	description: string;
}

export interface SiteStatus {
	online: boolean;
	healthy: boolean;
	lastDeploy: string | null;
	failedEndpoints: string[];
}

export const load = async ({ fetch, parent }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login', authorized: false, events: [], eventsTotal: 0, eventsTruncated: false, status: null };
	}

	try {
		const profileResponse = await fetch('/api/User/Profile');
		if (!profileResponse.ok) {
			return { redirect: '/User', authorized: false, events: [], eventsTotal: 0, eventsTruncated: false, status: null };
		}

		const profile = (await profileResponse.json()) as UserProfileData;
		const isWebmaster = profile.user.userRoles.some((ur) => ur.role?.name === 'Webmaster');
		if (!isWebmaster) {
			return { redirect: '/User', authorized: false, events: [], eventsTotal: 0, eventsTruncated: false, status: null };
		}

		const [eventsResponse, statusResponse] = await Promise.all([
			fetch('/api/Events'),
			fetch('/api/SiteStatus')
		]);

		const eventsData = eventsResponse.ok
			? await eventsResponse.json()
			: { events: [], total: 0, truncated: false };

		const status: SiteStatus | null = statusResponse.ok || statusResponse.status === 503
			? await statusResponse.json()
			: null;

		return {
			redirect: null,
			authorized: true,
			events: eventsData.events as SiteEvent[],
			eventsTotal: eventsData.total as number,
			eventsTruncated: eventsData.truncated as boolean,
			status
		};
	} catch {
		return { redirect: '/User', authorized: false, events: [], eventsTotal: 0, eventsTruncated: false, status: null };
	}
};
