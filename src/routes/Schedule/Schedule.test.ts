import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import SchedulePage from './+page.svelte';
import { mockTeamA, mockTeamB } from '../../tests/mocks';
import type { Game } from '$lib/models/Game';
import type { Location } from '$lib/models/Location';

const mockLocation1: Location = {
	id: 1,
	name: 'Diamond Park',
	formalName: null,
	city: 'Springfield',
	address: null,
	mapsPlaceId: null
};

const mockLocation2: Location = {
	id: 2,
	name: 'Shark Stadium',
	formalName: null,
	city: 'Shelbyville',
	address: null,
	mapsPlaceId: null
};

const mockScheduleGames: Game[] = [
	{
		id: 1,
		date: '2026-05-01T19:00:00',
		hostTeam: mockTeamA,
		visitingTeam: mockTeamB,
		scoreHost: null,
		scoreVisitor: null,
		status: { id: 1, name: 'Upcoming' },
		location: { id: 1, name: 'Diamond Park' },
		season: { id: 1, year: 2026, subseason: 'Regular Season' }
	},
	{
		id: 2,
		date: '2026-05-02T19:00:00',
		hostTeam: mockTeamB,
		visitingTeam: mockTeamA,
		scoreHost: null,
		scoreVisitor: null,
		status: { id: 1, name: 'Upcoming' },
		location: { id: 2, name: 'Shark Stadium' },
		season: { id: 1, year: 2026, subseason: 'Regular Season' }
	}
];

describe('Schedule Page', () => {
	test('renders year in heading', () => {
		render(SchedulePage, {
			props: { data: { year: 2026, games: mockScheduleGames, locations: [mockLocation1, mockLocation2] } }
		});
		expect(screen.getByText('2026 Schedule')).toBeInTheDocument();
	});

	test('renders location names as column headers', () => {
		render(SchedulePage, {
			props: { data: { year: 2026, games: mockScheduleGames, locations: [mockLocation1, mockLocation2] } }
		});
		expect(screen.getByText('Diamond Park')).toBeInTheDocument();
		expect(screen.getByText('Shark Stadium')).toBeInTheDocument();
	});

	test('renders Home and Away sub-headers for each location', () => {
		render(SchedulePage, {
			props: { data: { year: 2026, games: mockScheduleGames, locations: [mockLocation1, mockLocation2] } }
		});
		const homeHeaders = screen.getAllByText('Home');
		const awayHeaders = screen.getAllByText('Away');
		expect(homeHeaders.length).toBe(2);
		expect(awayHeaders.length).toBe(2);
	});

	test('renders date rows', () => {
		render(SchedulePage, {
			props: { data: { year: 2026, games: mockScheduleGames, locations: [mockLocation1, mockLocation2] } }
		});
		expect(screen.getByText('Fri, May 1')).toBeInTheDocument();
		expect(screen.getByText('Sat, May 2')).toBeInTheDocument();
	});

	test('renders team names in correct cells', () => {
		render(SchedulePage, {
			props: { data: { year: 2026, games: mockScheduleGames, locations: [mockLocation1, mockLocation2] } }
		});
		expect(screen.getAllByText('Isotopes').length).toBe(2);
		expect(screen.getAllByText('Sharks').length).toBe(2);
	});

	test('game cells link to game page', () => {
		render(SchedulePage, {
			props: { data: { year: 2026, games: mockScheduleGames, locations: [mockLocation1, mockLocation2] } }
		});
		const links = screen.getAllByRole('link');
		expect(links.some((l) => l.getAttribute('href') === '/Game/1')).toBe(true);
		expect(links.some((l) => l.getAttribute('href') === '/Game/2')).toBe(true);
	});

	test('shows empty message when no games', () => {
		render(SchedulePage, {
			props: { data: { year: 2026, games: [], locations: [] } }
		});
		expect(screen.getByText(/No games have been added yet/)).toBeInTheDocument();
	});

	test('does not render table when no games', () => {
		const { container } = render(SchedulePage, {
			props: { data: { year: 2026, games: [], locations: [] } }
		});
		expect(container.querySelector('table')).toBeNull();
	});

	test('weekend rows get weekend class', () => {
		const { container } = render(SchedulePage, {
			props: { data: { year: 2026, games: mockScheduleGames, locations: [mockLocation1, mockLocation2] } }
		});
		const weekendRows = container.querySelectorAll('tr.weekend');
		expect(weekendRows.length).toBeGreaterThan(0);
	});
});
