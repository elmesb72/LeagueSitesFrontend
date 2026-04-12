import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import PlayoffRoundRobin from './PlayoffRoundRobin.svelte';
import { mockRoundRobin, teamAlphas, teamBetas } from '../tests/playoffMocks';

describe('PlayoffRoundRobin', () => {
	test('renders round robin name in standings heading', () => {
		render(PlayoffRoundRobin, { props: { roundRobin: mockRoundRobin } });
		expect(screen.getByText('Pool A Round Robin Standings')).toBeInTheDocument();
	});

	test('renders standings table with team names', () => {
		render(PlayoffRoundRobin, { props: { roundRobin: mockRoundRobin } });
		expect(screen.getByText('Alpha City Alphas')).toBeInTheDocument();
		expect(screen.getByText('Beta Town Betas')).toBeInTheDocument();
	});

	test('renders standings column headers', () => {
		render(PlayoffRoundRobin, { props: { roundRobin: mockRoundRobin } });
		for (const header of ['Team', 'GP', 'W', 'L', 'T', 'Pts', 'RF', 'RA', 'Diff']) {
			expect(screen.getByText(header)).toBeInTheDocument();
		}
	});

	test('renders positive run differential with green class', () => {
		render(PlayoffRoundRobin, { props: { roundRobin: mockRoundRobin } });
		const cell = screen.getByText('+6');
		expect(cell.classList.contains('green')).toBe(true);
	});

	test('renders negative run differential with red class', () => {
		render(PlayoffRoundRobin, { props: { roundRobin: mockRoundRobin } });
		const cell = screen.getByText('-6');
		expect(cell.classList.contains('red')).toBe(true);
	});

	test('renders games section heading', () => {
		render(PlayoffRoundRobin, { props: { roundRobin: mockRoundRobin } });
		expect(screen.getByText('Pool A Games')).toBeInTheDocument();
	});

	test('does not render standings when null', () => {
		const noStandings = { ...mockRoundRobin, standings: null };
		const { container } = render(PlayoffRoundRobin, { props: { roundRobin: noStandings } });
		expect(container.querySelector('.round-robin')).toBeNull();
	});

	test('does not render games section when empty', () => {
		const noGames = { ...mockRoundRobin, games: [] };
		const { container } = render(PlayoffRoundRobin, { props: { roundRobin: noGames } });
		expect(container.querySelector('.round-robin-games')).toBeNull();
	});
});
