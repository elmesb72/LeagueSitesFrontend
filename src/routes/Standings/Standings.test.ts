import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import StandingsPage from './+page.svelte';
import { mockStandings, mockTeamA, mockTeamB } from '../../tests/mocks';
import type { Season } from '$lib/models/Season';

const mockSeason: Season = {
	id: 1,
	year: 2026,
	subseason: 'Regular Season',
	name: '2026 Regular Season',
	startDate: '2026-05-01T00:00:00'
};

describe('Standings Page', () => {
	test('renders season name as heading', () => {
		render(StandingsPage, { props: { data: { season: mockSeason, standings: mockStandings } } });
		expect(screen.getByText('2026 Regular Season')).toBeInTheDocument();
	});

	test('renders fallback heading when season is null', () => {
		render(StandingsPage, { props: { data: { season: null, standings: [] } } });
		expect(screen.getByText('Standings')).toBeInTheDocument();
	});

	test('shows empty message when no standings', () => {
		render(StandingsPage, { props: { data: { season: mockSeason, standings: [] } } });
		expect(screen.getByText('No standings data available.')).toBeInTheDocument();
	});

	test('renders all column headers', () => {
		render(StandingsPage, { props: { data: { season: mockSeason, standings: mockStandings } } });
		for (const header of ['Team', 'GP', 'W', 'L', 'T', 'Pts', 'RF', 'RA', 'Diff', 'Home', 'Away']) {
			expect(screen.getByText(header)).toBeInTheDocument();
		}
		expect(screen.getByText('Streak')).toBeInTheDocument();
	});

	test('renders team full names with links', () => {
		render(StandingsPage, { props: { data: { season: mockSeason, standings: mockStandings } } });
		expect(screen.getByText('Springfield Isotopes')).toBeInTheDocument();
		expect(screen.getByText('Shelbyville Sharks')).toBeInTheDocument();

		const links = screen.getAllByRole('link');
		expect(links.some(l => l.getAttribute('href') === '/Team/SPR')).toBe(true);
		expect(links.some(l => l.getAttribute('href') === '/Team/SHL')).toBe(true);
	});

	test('renders stats for each team', () => {
		render(StandingsPage, { props: { data: { season: mockSeason, standings: mockStandings } } });
		// Team A: GP=10, W=7, L=2, T=1, Pts=15
		expect(screen.getByText('15')).toBeInTheDocument();
		expect(screen.getByText('45')).toBeInTheDocument();
	});

	test('renders home and away records', () => {
		render(StandingsPage, { props: { data: { season: mockSeason, standings: mockStandings } } });
		expect(screen.getByText('4-1-0')).toBeInTheDocument();
		expect(screen.getByText('3-1-1')).toBeInTheDocument();
		expect(screen.getByText('2-3-0')).toBeInTheDocument();
		expect(screen.getByText('2-2-1')).toBeInTheDocument();
	});

	test('renders streak values', () => {
		render(StandingsPage, { props: { data: { season: mockSeason, standings: mockStandings } } });
		expect(screen.getByText('W3')).toBeInTheDocument();
		expect(screen.getByText('L2')).toBeInTheDocument();
	});

	test('shows dash for null streak', () => {
		const standingsWithNullStreak = [
			{ ...mockStandings[0], streak: null }
		];
		render(StandingsPage, { props: { data: { season: mockSeason, standings: standingsWithNullStreak } } });
		expect(screen.getByText('-')).toBeInTheDocument();
	});

	test('positive run differential has green class and plus sign', () => {
		render(StandingsPage, { props: { data: { season: mockSeason, standings: mockStandings } } });
		const cell = screen.getByText('+15');
		expect(cell).toBeInTheDocument();
		expect(cell.classList.contains('green')).toBe(true);
	});

	test('negative run differential has red class', () => {
		render(StandingsPage, { props: { data: { season: mockSeason, standings: mockStandings } } });
		const cell = screen.getByText('-5');
		expect(cell).toBeInTheDocument();
		expect(cell.classList.contains('red')).toBe(true);
	});

	test('zero run differential has no color class', () => {
		const standingsWithZeroDiff = [
			{ ...mockStandings[0], runDifferential: 0, runsScored: 30, runsAllowed: 30 }
		];
		render(StandingsPage, { props: { data: { season: mockSeason, standings: standingsWithZeroDiff } } });
		const zeroCells = screen.getAllByText('0');
		const diffCell = zeroCells.find(el => el.tagName === 'TD' && !el.classList.contains('green') && !el.classList.contains('red'));
		expect(diffCell).toBeDefined();
	});

	test('does not render table when standings are empty', () => {
		const { container } = render(StandingsPage, { props: { data: { season: mockSeason, standings: [] } } });
		expect(container.querySelector('table')).toBeNull();
	});
});
