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
			props: {
				data: { year: 2026, games: mockScheduleGames, locations: [mockLocation1, mockLocation2] }
			}
		});
		expect(screen.getByText('2026 Schedule')).toBeInTheDocument();
	});

	test('renders location names as column headers', () => {
		render(SchedulePage, {
			props: {
				data: { year: 2026, games: mockScheduleGames, locations: [mockLocation1, mockLocation2] }
			}
		});
		expect(screen.getByText('Diamond Park')).toBeInTheDocument();
		expect(screen.getByText('Shark Stadium')).toBeInTheDocument();
	});

	test('renders Home and Away sub-headers for each location', () => {
		render(SchedulePage, {
			props: {
				data: { year: 2026, games: mockScheduleGames, locations: [mockLocation1, mockLocation2] }
			}
		});
		const homeHeaders = screen.getAllByText('Home');
		const awayHeaders = screen.getAllByText('Away');
		expect(homeHeaders.length).toBe(2);
		expect(awayHeaders.length).toBe(2);
	});

	test('renders date rows', () => {
		render(SchedulePage, {
			props: {
				data: { year: 2026, games: mockScheduleGames, locations: [mockLocation1, mockLocation2] }
			}
		});
		expect(screen.getByText('Fri, May 1')).toBeInTheDocument();
		expect(screen.getByText('Sat, May 2')).toBeInTheDocument();
	});

	test('renders team names in correct cells', () => {
		render(SchedulePage, {
			props: {
				data: { year: 2026, games: mockScheduleGames, locations: [mockLocation1, mockLocation2] }
			}
		});
		expect(screen.getAllByText('Isotopes').length).toBe(2);
		expect(screen.getAllByText('Sharks').length).toBe(2);
	});

	test('game cells link to game page', () => {
		render(SchedulePage, {
			props: {
				data: { year: 2026, games: mockScheduleGames, locations: [mockLocation1, mockLocation2] }
			}
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
			props: {
				data: { year: 2026, games: mockScheduleGames, locations: [mockLocation1, mockLocation2] }
			}
		});
		const weekendRows = container.querySelectorAll('tr.weekend');
		expect(weekendRows.length).toBeGreaterThan(0);
	});
});

describe('Schedule Page — tournament tags', () => {
	const cupGame: Game = {
		...mockScheduleGames[0],
		id: 3,
		date: '2026-07-01T19:00:00',
		season: { id: 9, year: 2026, subseason: 'Tournament' }
	};
	const tournaments = [
		{
			seasonId: 8,
			tournamentId: 30,
			name: '2026 Playoffs',
			shortName: 'Playoffs',
			kind: 'playoffs' as const
		},
		{
			seasonId: 9,
			tournamentId: 31,
			name: '2026 Canada Day Cup',
			shortName: 'Canada Day Cup',
			kind: 'tournament' as const
		}
	];

	test('tags a cup game with its tournament and links to its page; league games get no tag', () => {
		render(SchedulePage, {
			props: {
				data: {
					year: 2026,
					games: [mockScheduleGames[0], cupGame],
					locations: [mockLocation1, mockLocation2],
					tournaments
				}
			}
		});
		const tag = screen.getByRole('link', { name: 'Canada Day Cup' });
		expect(tag).toHaveAttribute('href', '/Tournaments/31');
		expect(tag).toHaveAttribute('title', '2026 Canada Day Cup');
		expect(document.querySelectorAll('.league-schedule-tag')).toHaveLength(1);
	});

	test('a playoffs game links to the playoffs page for that year', () => {
		const playoffGame: Game = {
			...cupGame,
			id: 4,
			season: { id: 8, year: 2026, subseason: 'Playoffs' }
		};
		render(SchedulePage, {
			props: {
				data: {
					year: 2026,
					games: [playoffGame],
					locations: [mockLocation1, mockLocation2],
					tournaments
				}
			}
		});
		expect(screen.getByRole('link', { name: 'Playoffs' })).toHaveAttribute(
			'href',
			'/Playoffs?year=2026'
		);
	});
});
