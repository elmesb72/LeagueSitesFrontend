import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import PlayoffSeriesDetail from './PlayoffSeriesDetail.svelte';
import {
	completedSeries,
	inProgressSeries,
	teamAlphas,
	teamBetas,
	makeForfeitGame,
	makeFourTeamBracket,
	makeTiedGame
} from '../tests/playoffMocks';

describe('PlayoffSeriesDetail', () => {
	test('renders series matchup heading', () => {
		render(PlayoffSeriesDetail, { props: { series: completedSeries } });
		expect(screen.getByText('#1 Alphas vs #4 Betas')).toBeInTheDocument();
	});

	test('omits seed prefix for a team outside this bracket seed list', () => {
		// initialSeed is null for a crossover team (e.g. from another bracket);
		// heading must not render '#null'
		const crossoverSeries = {
			...completedSeries,
			spot1: { ...completedSeries.spot1!, initialSeed: null }
		};
		render(PlayoffSeriesDetail, { props: { series: crossoverSeries } });
		expect(screen.getByText('Alphas vs #4 Betas')).toBeInTheDocument();
		expect(screen.queryByText(/#null/)).toBeNull();
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

	test('tied game lists both teams once, with scores and no winner', () => {
		// Alphas host, Betas visit, 4-4 tie
		const tiedSeries = {
			...inProgressSeries,
			games: [{ gameNumber: 1, game: makeTiedGame(310, teamAlphas, teamBetas, 4) }]
		};
		const { container } = render(PlayoffSeriesDetail, { props: { series: tiedSeries } });
		const teamCells = container.querySelectorAll('.tournament-items-game-team');
		// Visitor listed first, host second with @ prefix — no duplicated team
		expect(teamCells[0]?.textContent).toContain('Beta Town');
		expect(teamCells[0]?.textContent).toContain('4');
		expect(teamCells[1]?.textContent).toContain('@Alpha City');
		expect(teamCells[1]?.textContent).toContain('4');
		expect(container.querySelector('.tournament-items-game-winner')).toBeNull();
	});

	test('visitor forfeit renders host as winner with FW/FL markers', () => {
		// 'Forfeit (Away)' = visitor (Betas) forfeited, host (Alphas) wins
		const forfeitSeries = {
			...inProgressSeries,
			games: [{ gameNumber: 1, game: makeForfeitGame(311, teamAlphas, teamBetas, 'Away') }]
		};
		const { container } = render(PlayoffSeriesDetail, { props: { series: forfeitSeries } });
		const winner = container.querySelector('.tournament-items-game-winner');
		const loser = container.querySelector('.tournament-items-game-loser');
		expect(winner?.textContent).toContain('@Alpha City');
		expect(winner?.textContent).toContain('FW');
		expect(loser?.textContent).toContain('Beta Town');
		expect(loser?.textContent).toContain('FL');
	});

	test('home forfeit renders visitor as winner', () => {
		// 'Forfeit (Home)' = host (Alphas) forfeited, visitor (Betas) wins
		const forfeitSeries = {
			...inProgressSeries,
			games: [{ gameNumber: 1, game: makeForfeitGame(312, teamAlphas, teamBetas, 'Home') }]
		};
		const { container } = render(PlayoffSeriesDetail, { props: { series: forfeitSeries } });
		const winner = container.querySelector('.tournament-items-game-winner');
		const loser = container.querySelector('.tournament-items-game-loser');
		expect(winner?.textContent).toContain('Beta Town');
		expect(winner?.textContent).toContain('FW');
		expect(loser?.textContent).toContain('@Alpha City');
		expect(loser?.textContent).toContain('FL');
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
		expect(container.querySelector('.tournament-items-series h3')).not.toBeNull();
		expect(container.querySelectorAll('.tournament-items-game').length).toBe(0);
	});
});

describe('PlayoffSeriesDetail (series format)', () => {
	test('leads the status line with the series length, so "tied 1-1" is unambiguous', () => {
		const { container } = render(PlayoffSeriesDetail, { props: { series: inProgressSeries } });
		const status = container.querySelector('.tournament-items-series-status-line')!;
		expect(status).toHaveTextContent('Best of 5');
		expect(status).toHaveTextContent('Series tied 1-1');
		expect(status.textContent!.indexOf('Best of 5')).toBeLessThan(status.textContent!.indexOf('Series tied'));
	});

	test('names the aggregate format with its game count', () => {
		render(PlayoffSeriesDetail, { props: { series: { ...completedSeries, format: 'Aggregate', hostOrder: '12' } } });
		expect(screen.getByText('Aggregate over 2 games')).toBeInTheDocument();
	});

	test('a one-game series is a "Single game"', () => {
		render(PlayoffSeriesDetail, { props: { series: { ...completedSeries, hostOrder: '1' } } });
		expect(screen.getByText('Single game')).toBeInTheDocument();
	});
});

describe('PlayoffSeriesDetail (anchors and series lead)', () => {
	test('gets a stable id and a link back to the bracket when told which bracket it belongs to', () => {
		const bracket = makeFourTeamBracket({ played: 'semis' });
		const { container } = render(PlayoffSeriesDetail, { props: { series: bracket.rounds[0].series[0], bracket } });
		expect(container.querySelector('article.tournament-items-series')!.id).toBe('main-series-1');
		expect(screen.getByRole('link', { name: /bracket/ })).toHaveAttribute('href', '#main-bracket');
	});

	test('has no id or back link without a bracket', () => {
		const { container } = render(PlayoffSeriesDetail, { props: { series: completedSeries } });
		expect(container.querySelector('article')!.hasAttribute('id')).toBe(false);
		expect(screen.queryByRole('link', { name: /bracket/ })).toBeNull();
	});

	test('shows the series score after each decided game, emphasising the clinch', () => {
		const bracket = makeFourTeamBracket({ played: 'semis' });
		const { container } = render(PlayoffSeriesDetail, { props: { series: bracket.rounds[0].series[0], bracket } });
		const leads = [...container.querySelectorAll('.tournament-items-game-lead')];
		expect(leads.map((l) => l.textContent!.trim())).toEqual(['Deltas lead 1-0', 'Tied 1-1', 'Deltas win 2-1']);
		expect(leads[2].classList.contains('tournament-items-game-lead-final')).toBe(true);
		expect(leads[0].classList.contains('tournament-items-game-lead-final')).toBe(false);
	});

	test('leaves the lead cell empty for unplayed games', () => {
		const bracket = makeFourTeamBracket({ played: 'semis' });
		const { container } = render(PlayoffSeriesDetail, { props: { series: bracket.rounds[1].series[0], bracket } });
		expect([...container.querySelectorAll('.tournament-items-game-lead')].map((l) => l.textContent!.trim())).toEqual(['', '', '']);
	});
});
