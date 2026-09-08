import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import ExecutivePage from './+page.svelte';
import type { ExecutiveDashboard } from '$lib/models/Executive';

const mockDashboard: ExecutiveDashboard = {
	teams: [
		{ id: 1, location: 'Springfield', name: 'Isotopes', fullName: 'Springfield Isotopes', abbreviation: 'SPR', backgroundColor: '003366', color: 'FFFFFF', active: true, hidden: false, canDelete: false },
		{ id: 2, location: 'Shelbyville', name: 'Sharks', fullName: 'Shelbyville Sharks', abbreviation: 'SHL', backgroundColor: 'CC0000', color: 'FFFFFF', active: false, hidden: false, canDelete: true }
	],
	locations: [
		{ id: 1, active: true, name: 'Diamond Park', formalName: 'Central Park', city: 'Springfield', address: null, mapsPlaceId: null, canDelete: false },
		{ id: 2, active: false, name: 'Shark Field', formalName: null, city: 'Shelbyville', address: null, mapsPlaceId: null, canDelete: true }
	],
	currentSeason: {
		season: { id: 1, year: 2026, subseason: 'Regular Season', name: '2026 Regular Season', startDate: '2026-05-01' },
		gamesScheduled: 20,
		gamesPlayed: 12,
		tournaments: [
			{ id: 1, brackets: [{ id: 10, name: 'Championship' }], roundRobins: [{ id: 20, name: 'Pool A' }] }
		]
	},
	currentPlayoffs: {
		season: { id: 2, year: 2026, subseason: 'Playoffs', name: '2026 Playoffs', startDate: '2026-09-01' },
		tournaments: [
			{ id: 2, brackets: [{ id: 11, name: 'Finals' }], roundRobins: [] }
		]
	}
};

const mockStandingsRules = {
	years: [2026, 2025],
	year: 2026,
	standings: {
		winsValue: 2,
		tiesValue: 1,
		lossesValue: 0,
		forfeitWinnerScore: 7,
		forfeitLoserScore: 0,
		tiebreakers: ['Points', 'Wins', 'RunDifferential']
	},
	comparators: [
		{ name: 'Points', description: 'Points, using the configured win/tie/loss values', groupRestricted: false },
		{ name: 'Wins', description: 'Most wins', groupRestricted: false },
		{ name: 'RunDifferential', description: 'Run differential: runs scored minus runs allowed', groupRestricted: false },
		{ name: 'HeadToHeadPoints', description: 'Points in games between the tied teams, using the configured values', groupRestricted: true }
	]
};
const baseData = {
	redirect: null,
	dashboard: mockDashboard,
	standingsRules: mockStandingsRules,
	teams: [],
	siteConfig: { siteName: 'Test League', shortName: 'TL', home: { aboutBlurb: '', executives: {}, socials: {}, links: {}, information: {} }, apiKeys: { googleMaps: '' } },
	user: { isAuthenticated: true, name: 'Admin', claims: [] }
};

async function openTab(name: string): Promise<void> {
	await fireEvent.click(screen.getByRole('button', { name }));
}

describe('Executive Page', () => {
	beforeEach(() => {
		// Tab state initializes from ?tab=; keep tests independent.
		window.history.replaceState({}, '', '/Executive');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	// --- Tab bar ---

	test('defaults to the Season tab with league settings hidden', () => {
		render(ExecutivePage, { props: { data: baseData } });
		expect(screen.getByText(`${new Date().getFullYear()} Season`)).toBeInTheDocument();
		expect(screen.queryByText('Springfield Isotopes')).toBeNull();
		expect(screen.queryByText('Diamond Park')).toBeNull();
		expect(screen.queryByText('Recover deleted games')).toBeNull();
	});

	test('renders all five tabs', () => {
		render(ExecutivePage, { props: { data: baseData } });
		for (const label of ['Season', 'Teams', 'Parks', 'Standings', 'Miscellaneous']) {
			expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
		}
	});

	test('opens the tab named in the URL', () => {
		window.history.replaceState({}, '', '/Executive?tab=parks');
		render(ExecutivePage, { props: { data: baseData } });
		expect(screen.getByText('Diamond Park')).toBeInTheDocument();
		expect(screen.queryByText(`${new Date().getFullYear()} Season`)).toBeNull();
	});

	test('falls back to Season for an unknown tab parameter', () => {
		window.history.replaceState({}, '', '/Executive?tab=bogus');
		render(ExecutivePage, { props: { data: baseData } });
		expect(screen.getByText(`${new Date().getFullYear()} Season`)).toBeInTheDocument();
	});

	test('switching tabs updates the URL', async () => {
		render(ExecutivePage, { props: { data: baseData } });
		await openTab('Standings');
		expect(window.location.search).toBe('?tab=standings');
		await openTab('Season');
		expect(window.location.search).toBe('');
	});

	// --- Season tab ---

	test('renders regular season section', () => {
		render(ExecutivePage, { props: { data: baseData } });
		expect(screen.getByText('Regular Season')).toBeInTheDocument();
	});

	test('renders season progress bar', () => {
		render(ExecutivePage, { props: { data: baseData } });
		expect(screen.getByText('12 GP')).toBeInTheDocument();
		expect(screen.getByText('8 GR')).toBeInTheDocument();
	});

	test('renders progress label with game count', () => {
		render(ExecutivePage, { props: { data: baseData } });
		expect(screen.getByText(/Progress \(20 games\)/)).toBeInTheDocument();
	});

	test('renders edit schedule link', () => {
		render(ExecutivePage, { props: { data: baseData } });
		expect(screen.getByText('Edit schedule')).toBeInTheDocument();
	});

	test('links each mid-season tournament to its management page', () => {
		render(ExecutivePage, { props: { data: baseData } });
		expect(screen.getByText('Manage mid-season tournament')).toHaveAttribute('href', '/Executive/Edit/Tournament/1');
	});

	test('lists what a tournament already contains', () => {
		render(ExecutivePage, { props: { data: baseData } });
		expect(screen.getByText('(Championship, Pool A)')).toBeInTheDocument();
	});

	test('links the playoffs to its management page', () => {
		render(ExecutivePage, { props: { data: baseData } });
		expect(screen.getByText(/Manage 2026 playoffs/)).toHaveAttribute('href', '/Executive/Edit/Tournament/2');
	});

	test('renders playoffs section', () => {
		render(ExecutivePage, { props: { data: baseData } });
		expect(screen.getByText('Playoffs')).toBeInTheDocument();
	});

	test('shows create season button when no season', () => {
		const noSeason = { ...baseData, dashboard: { ...mockDashboard, currentSeason: null } };
		render(ExecutivePage, { props: { data: noSeason } });
		expect(screen.getByText(/Create.*Regular Season/)).toBeInTheDocument();
	});

	test('shows set up playoffs link when no playoffs', () => {
		const noPlayoffs = { ...baseData, dashboard: { ...mockDashboard, currentPlayoffs: null } };
		render(ExecutivePage, { props: { data: noPlayoffs } });
		expect(screen.getByText(/Set up year-end playoffs/)).toBeInTheDocument();
	});

	test('completed season shows full progress bar', () => {
		const completed = {
			...baseData,
			dashboard: {
				...mockDashboard,
				currentSeason: { ...mockDashboard.currentSeason!, gamesPlayed: 20 }
			}
		};
		render(ExecutivePage, { props: { data: completed } });
		expect(screen.getByText('20/20 GP')).toBeInTheDocument();
	});

	// --- Teams tab ---

	test('teams tab shows active teams with inactive collapsed', async () => {
		render(ExecutivePage, { props: { data: baseData } });
		await openTab('Teams');
		expect(screen.getByText('Teams (1 active)')).toBeInTheDocument();
		expect(screen.getByText('Springfield Isotopes')).toBeInTheDocument();
		expect(screen.queryByText('Shelbyville Sharks')).toBeNull();
	});

	test('expander reveals and re-hides inactive teams', async () => {
		render(ExecutivePage, { props: { data: baseData } });
		await openTab('Teams');
		await fireEvent.click(screen.getByText('Show 1 inactive team'));
		expect(screen.getByText('Shelbyville Sharks')).toBeInTheDocument();
		await fireEvent.click(screen.getByText('Hide 1 inactive team'));
		expect(screen.queryByText('Shelbyville Sharks')).toBeNull();
	});

	test('no expander when every team is active', async () => {
		const allActive = {
			...baseData,
			dashboard: {
				...mockDashboard,
				teams: [mockDashboard.teams[0]]
			}
		};
		render(ExecutivePage, { props: { data: allActive } });
		await openTab('Teams');
		expect(screen.queryByText(/inactive team/)).toBeNull();
	});

	test('active team has checked checkbox; revealed inactive team is unchecked', async () => {
		const { container } = render(ExecutivePage, { props: { data: baseData } });
		await openTab('Teams');
		let checkboxes = container.querySelectorAll('.executive-toggle input[type="checkbox"]');
		expect(checkboxes.length).toBe(1);
		expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);

		await fireEvent.click(screen.getByText('Show 1 inactive team'));
		checkboxes = container.querySelectorAll('.executive-toggle input[type="checkbox"]');
		expect(checkboxes.length).toBe(2);
		expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);
	});

	// --- Parks tab ---

	test('parks tab shows active parks with inactive collapsed', async () => {
		render(ExecutivePage, { props: { data: baseData } });
		await openTab('Parks');
		expect(screen.getByText('Parks (1 active)')).toBeInTheDocument();
		expect(screen.getByText('Diamond Park')).toBeInTheDocument();
		expect(screen.queryByText('Shark Field')).toBeNull();
	});

	test('expander reveals inactive parks', async () => {
		render(ExecutivePage, { props: { data: baseData } });
		await openTab('Parks');
		await fireEvent.click(screen.getByText('Show 1 inactive park'));
		expect(screen.getByText('Shark Field')).toBeInTheDocument();
	});

	// --- Standings tab ---

	test('standings tab renders the rules editor', async () => {
		render(ExecutivePage, { props: { data: baseData } });
		await openTab('Standings');
		expect(screen.getByText('Standings Rules')).toBeInTheDocument();
		expect(screen.getByLabelText('Win points')).toHaveValue(2);
		expect(screen.getByLabelText('Tiebreaker to add')).toBeInTheDocument();
		expect(screen.getByText('Save 2026 standings rules')).toBeInTheDocument();
	});

	test('standings tab offers every season year, current selected', async () => {
		render(ExecutivePage, { props: { data: baseData } });
		await openTab('Standings');
		const select = screen.getByLabelText('Season year') as HTMLSelectElement;
		expect([...select.options].map((o) => o.value)).toEqual(['2026', '2025']);
		expect(select.value).toBe('2026');
		expect(screen.getByText('Save 2026 standings rules')).toBeInTheDocument();
	});

	test('choosing another year fetches and shows that year\'s rules', async () => {
		const rules2025 = {
			...mockStandingsRules,
			year: 2025,
			standings: { ...mockStandingsRules.standings, winsValue: 3 }
		};
		const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(JSON.stringify(rules2025), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})
		);

		render(ExecutivePage, { props: { data: baseData } });
		await openTab('Standings');
		await fireEvent.change(screen.getByLabelText('Season year'), { target: { value: '2025' } });

		expect(fetchSpy).toHaveBeenCalledWith('/api/Executive/StandingsRules?year=2025');
		await waitFor(() => expect(screen.getByLabelText('Win points')).toHaveValue(3));
		expect(screen.getByText('Save 2025 standings rules')).toBeInTheDocument();
	});

	test('standings tab explains when no seasons exist yet', async () => {
		const noSeasons = {
			...baseData,
			standingsRules: { ...mockStandingsRules, years: [] }
		};
		render(ExecutivePage, { props: { data: noSeasons } });
		await openTab('Standings');
		expect(screen.getByText(/standings rules live on seasons/)).toBeInTheDocument();
		expect(screen.queryByLabelText('Win points')).toBeNull();
	});

	test('standings tab explains when the rules fetch failed', async () => {
		const noRules = { ...baseData, standingsRules: null };
		render(ExecutivePage, { props: { data: noRules } });
		await openTab('Standings');
		expect(screen.getByText(/Could not load the standings rules/)).toBeInTheDocument();
		expect(screen.queryByLabelText('Win points')).toBeNull();
	});

	// --- Miscellaneous tab ---

	test('miscellaneous tab holds the deleted games recovery link', async () => {
		render(ExecutivePage, { props: { data: baseData } });
		await openTab('Miscellaneous');
		expect(screen.getByText('Recover deleted games')).toBeInTheDocument();
	});

	// --- Degenerate states ---

	test('renders nothing when dashboard is null', () => {
		const noData = { ...baseData, dashboard: null, standingsRules: null };
		const { container } = render(ExecutivePage, { props: { data: noData } });
		expect(container.querySelector('.executive-section')).toBeNull();
	});
});
