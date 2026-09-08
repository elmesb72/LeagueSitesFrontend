import type { ExecutiveDashboard } from '$lib/models/Executive';
import type { UserProfileData } from '$lib/models/UserProfile';
import type { StandingsConfigEdit, StandingsComparatorOption } from '$lib/models/StandingsConfig';

export interface StandingsRulesData {
	/** Years that have seasons, newest first. */
	years: number[];
	/** The year whose rules are in `standings`. */
	year: number;
	standings: StandingsConfigEdit;
	comparators: StandingsComparatorOption[];
}

export const load = async ({ fetch, parent }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login', dashboard: null, standingsRules: null };
	}

	try {
		const [response, rulesResponse] = await Promise.all([
			fetch('/api/Executive/Dashboard'),
			fetch('/api/Executive/StandingsRules')
		]);
		if (response.status === 403 || response.status === 401) {
			return { redirect: '/User', dashboard: null, standingsRules: null };
		}
		if (!response.ok) {
			return { redirect: null, dashboard: null, standingsRules: null };
		}

		const data = (await response.json()) as ExecutiveDashboard;
		const standingsRules: StandingsRulesData | null = rulesResponse.ok
			? await rulesResponse.json()
			: null;
		return { redirect: null, dashboard: data, standingsRules };
	} catch {
		return { redirect: '/User', dashboard: null, standingsRules: null };
	}
};
