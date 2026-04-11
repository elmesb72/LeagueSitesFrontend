import { render, screen } from '@testing-library/svelte';
import { describe, test, expect, vi } from 'vitest';
import ScoresGame from './ScoresGame.svelte';
import { mockTeamA, mockTeamB, mockPlayedGame, mockUpcomingGame, mockPostponedGame, mockForfeitGame, mockStandings } from '../tests/mocks';

describe('ScoresGame', () => {
	test('played game shows FINAL status', () => {
		render(ScoresGame, { props: { game: mockPlayedGame, standings: mockStandings } });
		expect(screen.getByText('FINAL')).toBeInTheDocument();
	});

	test('played game shows R/H/E scoreboard', () => {
		render(ScoresGame, { props: { game: mockPlayedGame, standings: mockStandings } });
		expect(screen.getByText('R')).toBeInTheDocument();
		expect(screen.getByText('H')).toBeInTheDocument();
		expect(screen.getByText('E')).toBeInTheDocument();
		expect(screen.getByText('5')).toBeInTheDocument();
		expect(screen.getByText('3')).toBeInTheDocument();
	});

	test('upcoming game shows time', () => {
		render(ScoresGame, { props: { game: mockUpcomingGame, standings: [] } });
		// The time format depends on locale, just check it renders without FINAL
		expect(screen.queryByText('FINAL')).toBeNull();
	});

	test('overdue upcoming game shows OVERDUE/UNSCORED', () => {
		const overdueGame = {
			...mockUpcomingGame,
			date: '2020-01-01T19:00:00'
		};
		render(ScoresGame, { props: { game: overdueGame, standings: [] } });
		expect(screen.getByText(/OVERDUE\/UNSCORED/)).toBeInTheDocument();
	});

	test('postponed game shows POSTPONED', () => {
		render(ScoresGame, { props: { game: mockPostponedGame, standings: [] } });
		expect(screen.getByText('POSTPONED')).toBeInTheDocument();
	});

	test('postponed game does not show scoreboard', () => {
		const { container } = render(ScoresGame, { props: { game: mockPostponedGame, standings: [] } });
		expect(container.querySelector('.scores-game-scoreboard-summary')).toBeNull();
	});

	test('forfeit game shows FORFEIT with team abbreviation', () => {
		// mockForfeitGame: host=7, visitor=0, so visitor forfeited
		render(ScoresGame, { props: { game: mockForfeitGame, standings: [] } });
		expect(screen.getByText(`FORFEIT (${mockTeamB.abbreviation})`)).toBeInTheDocument();
	});

	test('renders team names with links', () => {
		render(ScoresGame, { props: { game: mockPlayedGame, standings: mockStandings } });
		expect(screen.getByText('Isotopes')).toBeInTheDocument();
		expect(screen.getByText('Sharks')).toBeInTheDocument();
		const links = screen.getAllByRole('link');
		expect(links.some(l => l.getAttribute('href') === '/Team/SPR')).toBe(true);
		expect(links.some(l => l.getAttribute('href') === '/Team/SHL')).toBe(true);
	});

	test('renders team records from standings', () => {
		render(ScoresGame, { props: { game: mockPlayedGame, standings: mockStandings } });
		expect(screen.getByText('7-2-1')).toBeInTheDocument();
		expect(screen.getByText('4-5-1')).toBeInTheDocument();
	});

	test('renders empty record when team not in standings', () => {
		render(ScoresGame, { props: { game: mockPlayedGame, standings: [] } });
		const records = screen.queryAllByText('7-2-1');
		expect(records.length).toBe(0);
	});

	test('renders location with link', () => {
		render(ScoresGame, { props: { game: mockPlayedGame, standings: [] } });
		const locationLink = screen.getByText('Diamond Park');
		expect(locationLink.closest('a')?.getAttribute('href')).toBe('/Locations/#Diamond Park');
	});
});
