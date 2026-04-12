import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import TeamSchedule from './TeamSchedule.svelte';
import { mockTeamA, mockTeamB, mockPlayedGame, mockUpcomingGame, mockPostponedGame, mockForfeitGame } from '../tests/mocks';

describe('TeamSchedule', () => {
	test('renders column headers', () => {
		render(TeamSchedule, { props: { games: [mockPlayedGame], focusTeam: mockTeamA } });
		for (const h of ['Date', 'Time', 'Location', 'Home', 'Visitor', 'Result']) {
			expect(screen.getByText(h)).toBeInTheDocument();
		}
	});

	test('renders game date and location', () => {
		render(TeamSchedule, { props: { games: [mockPlayedGame], focusTeam: mockTeamA } });
		expect(screen.getByText('Diamond Park')).toBeInTheDocument();
	});

	test('focus team name is not a link', () => {
		render(TeamSchedule, { props: { games: [mockPlayedGame], focusTeam: mockTeamA } });
		const homeCell = screen.getByText('Isotopes');
		expect(homeCell.tagName).toBe('SPAN');
	});

	test('opponent team name is a link', () => {
		render(TeamSchedule, { props: { games: [mockPlayedGame], focusTeam: mockTeamA } });
		const awayCell = screen.getByText('Sharks');
		expect(awayCell.closest('a')?.getAttribute('href')).toBe('/Team/SHL');
	});

	test('played game shows W result for winning focus team', () => {
		render(TeamSchedule, { props: { games: [mockPlayedGame], focusTeam: mockTeamA } });
		expect(screen.getByText('W, 5-3')).toBeInTheDocument();
	});

	test('played game shows L result for losing focus team', () => {
		render(TeamSchedule, { props: { games: [mockPlayedGame], focusTeam: mockTeamB } });
		expect(screen.getByText('L, 5-3')).toBeInTheDocument();
	});

	test('upcoming game shows no result', () => {
		render(TeamSchedule, { props: { games: [mockUpcomingGame], focusTeam: mockTeamA } });
		const resultCells = screen.getAllByRole('cell');
		const lastCell = resultCells[resultCells.length - 1];
		expect(lastCell.textContent?.trim()).toBe('');
	});

	test('forfeit win shows FW', () => {
		render(TeamSchedule, { props: { games: [mockForfeitGame], focusTeam: mockTeamA } });
		expect(screen.getByText('FW, 7-0')).toBeInTheDocument();
	});

	test('forfeit loss shows FL', () => {
		render(TeamSchedule, { props: { games: [mockForfeitGame], focusTeam: mockTeamB } });
		expect(screen.getByText('FL, 7-0')).toBeInTheDocument();
	});
});
