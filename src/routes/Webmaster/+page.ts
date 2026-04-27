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

export interface TrafficDay {
	date: string;
	totalRequests: number;
	uniqueIPs: number;
	statusCounts: Record<string, number>;
	topPaths: Record<string, number>;
	topReferrers: Record<string, number>;
	updatedAt: string;
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
		return { redirect: '/Login', authorized: false, events: [], eventsTotal: 0, eventsTruncated: false, status: null, traffic: [] };
	}

	try {
		const profileResponse = await fetch('/api/User/Profile');
		if (!profileResponse.ok) {
			return { redirect: '/User', authorized: false, events: [], eventsTotal: 0, eventsTruncated: false, status: null, traffic: [] };
		}

		const profile = (await profileResponse.json()) as UserProfileData;
		const isWebmaster = profile.user.userRoles.some((ur) => ur.role?.name === 'Webmaster');
		if (!isWebmaster) {
			return { redirect: '/User', authorized: false, events: [], eventsTotal: 0, eventsTruncated: false, status: null, traffic: [] };
		}

		const [eventsResponse, statusResponse, trafficResponse] = await Promise.all([
			fetch('/api/Events'),
			fetch('/api/SiteStatus'),
			fetch('/api/Traffic')
		]);

		const eventsData = eventsResponse.ok
			? await eventsResponse.json()
			: { events: [], total: 0, truncated: false };

		const status: SiteStatus | null = statusResponse.ok || statusResponse.status === 503
			? await statusResponse.json()
			: null;

		const traffic: TrafficDay[] = trafficResponse.ok ? await trafficResponse.json() : [];

		return {
			redirect: null,
			authorized: true,
			events: eventsData.events as SiteEvent[],
			eventsTotal: eventsData.total as number,
			eventsTruncated: eventsData.truncated as boolean,
			status,
			traffic
		};
	} catch {
		return { redirect: '/User', authorized: false, events: [], eventsTotal: 0, eventsTruncated: false, status: null, traffic: [] };
	}
};
