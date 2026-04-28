import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
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

const baseData = {
	redirect: null,
	dashboard: mockDashboard,
	siteConfig: { siteName: 'Test League', shortName: 'TL', home: { aboutBlurb: '', executives: {}, socials: {}, links: {}, information: {} }, apiKeys: { googleMaps: '' } },
	user: { isAuthenticated: true, name: 'Admin', claims: [] }
};

describe('Executive Page', () => {
	test('renders season heading', () => {
		render(ExecutivePage, { props: { data: baseData } });
		expect(screen.getByText(`${new Date().getFullYear()} Season`)).toBeInTheDocument();
	});

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

	test('renders tournament bracket links', () => {
		render(ExecutivePage, { props: { data: baseData } });
		expect(screen.getAllByText(/Update Bracket/).length).toBeGreaterThanOrEqual(1);
	});

	test('renders tournament round robin links', () => {
		render(ExecutivePage, { props: { data: baseData } });
		expect(screen.getAllByText(/Update Round Robin/).length).toBeGreaterThanOrEqual(1);
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

	test('renders teams table', () => {
		render(ExecutivePage, { props: { data: baseData } });
		expect(screen.getByText('Springfield Isotopes')).toBeInTheDocument();
		expect(screen.getByText('Shelbyville Sharks')).toBeInTheDocument();
	});

	test('shows active/inactive checkboxes for teams', () => {
		const { container } = render(ExecutivePage, { props: { data: baseData } });
		const checkboxes = container.querySelectorAll('.executive-toggle input[type="checkbox"]');
		expect(checkboxes.length).toBe(4); // 2 teams + 2 locations
	});

	test('active team has checked checkbox', () => {
		const { container } = render(ExecutivePage, { props: { data: baseData } });
		const checkboxes = container.querySelectorAll('.executive-toggle input[type="checkbox"]');
		// First checkbox is for the active team
		expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
	});

	test('inactive team has unchecked checkbox', () => {
		const { container } = render(ExecutivePage, { props: { data: baseData } });
		const checkboxes = container.querySelectorAll('.executive-toggle input[type="checkbox"]');
		// Second checkbox is for the inactive team
		expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);
	});

	test('renders locations table', () => {
		render(ExecutivePage, { props: { data: baseData } });
		expect(screen.getByText('Diamond Park')).toBeInTheDocument();
		expect(screen.getByText('Shark Field')).toBeInTheDocument();
	});

	test('renders deleted games recovery link', () => {
		render(ExecutivePage, { props: { data: baseData } });
		expect(screen.getByText('Recover deleted games')).toBeInTheDocument();
	});

	test('renders nothing when dashboard is null', () => {
		const noData = { ...baseData, dashboard: null };
		const { container } = render(ExecutivePage, { props: { data: noData } });
		expect(container.querySelector('.executive-section')).toBeNull();
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
});
