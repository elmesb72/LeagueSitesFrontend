import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import PlayoffSeriesDetail from './PlayoffSeriesDetail.svelte';
import { completedSeries, inProgressSeries, tbdSeries } from '../tests/playoffMocks';

describe('PlayoffSeriesDetail', () => {
	test('renders series matchup heading', () => {
		render(PlayoffSeriesDetail, { props: { series: completedSeries } });
		expect(screen.getByText('#1 Alphas vs #4 Betas')).toBeInTheDocument();
	});

	test('renders series status text', () => {
		render(PlayoffSeriesDetail, { props: { series: completedSeries } });
		expect(screen.getByText('Alpha City Alphas win 3-0')).toBeInTheDocument();
	});

	test('renders tied series status', () => {
		render(PlayoffSeriesDetail, { props: { series: inProgressSeries } });
		expect(screen.getByText('Series tied 1-1')).toBeInTheDocument();
	});

	test('renders game numbers', () => {
		render(PlayoffSeriesDetail, { props: { series: completedSeries } });
		expect(screen.getByText('Gm 1')).toBeInTheDocument();
		expect(screen.getByText('Gm 2')).toBeInTheDocument();
		expect(screen.getByText('Gm 3')).toBeInTheDocument();
	});

	test('played games link to game page', () => {
		render(PlayoffSeriesDetail, { props: { series: completedSeries } });
		const links = screen.getAllByRole('link');
		expect(links.some((l) => l.getAttribute('href') === '/Game/201')).toBe(true);
	});

	test('renders location for played games', () => {
		render(PlayoffSeriesDetail, { props: { series: completedSeries } });
		expect(screen.getAllByText('Playoff Park').length).toBeGreaterThanOrEqual(1);
	});

	test('renders TBD for games without dates', () => {
		render(PlayoffSeriesDetail, { props: { series: { ...inProgressSeries, games: [{ gameNumber: 1, game: null }] } } });
		expect(screen.getByText('(Date TBD)')).toBeInTheDocument();
		expect(screen.getByText('(Location TBD)')).toBeInTheDocument();
	});

	test('renders winner team name for played games', () => {
		render(PlayoffSeriesDetail, { props: { series: completedSeries } });
		// Game 1: Alphas 5, Betas 3 — Alphas win
		expect(screen.getAllByText(/Alpha City/).length).toBeGreaterThanOrEqual(1);
	});

	test('renders winning score for played games', () => {
		const { container } = render(PlayoffSeriesDetail, { props: { series: completedSeries } });
		// Game 1: host 5, visitor 3 — winner shows "Alpha City 5"
		const winnerLinks = container.querySelectorAll('.tournament-items-game-winner');
		expect(winnerLinks.length).toBe(3);
		expect(winnerLinks[0].textContent).toContain('5');
	});

	test('playoff games always have a winner (no ties)', () => {
		// All played games in a series must have different scores
		for (const sg of completedSeries.games) {
			if (sg.game && sg.game.status.name === 'Played') {
				expect(sg.game.scoreHost).not.toBe(sg.game.scoreVisitor);
			}
		}
	});

	test('upcoming game shows @ prefix for host team', () => {
		const upcomingSeries = {
			...completedSeries,
			winner: null,
			loser: null,
			results: { teamResults: [], statusText: 'Series tied 0-0' },
			games: [{ gameNumber: 1, game: { ...completedSeries.games[0].game!, status: { id: 1, name: 'Upcoming' } } }]
		};
		const { container } = render(PlayoffSeriesDetail, { props: { series: upcomingSeries } });
		const teamCells = container.querySelectorAll('.tournament-items-game-team');
		// Second team cell should have @ prefix for host
		const hostCell = teamCells[1];
		expect(hostCell?.textContent).toContain('@');
	});

	test('empty games array renders heading but no game items', () => {
		const emptySeries = { ...completedSeries, games: [] };
		const { container } = render(PlayoffSeriesDetail, { props: { series: emptySeries } });
		expect(container.querySelector('.tournament-items-series h2')).not.toBeNull();
		expect(container.querySelectorAll('.tournament-items-game').length).toBe(0);
	});
});
