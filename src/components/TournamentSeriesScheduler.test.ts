import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import TournamentSeriesScheduler from './TournamentSeriesScheduler.svelte';
import {
	makeBracket,
	makeGame,
	makeResolvedSeries,
	mockLocations,
	alphas,
	deltas
} from '../tests/tournamentMocks';

function renderScheduler(bracket = makeBracket()) {
	return render(TournamentSeriesScheduler, {
		props: { bracket, locations: mockLocations }
	});
}

describe('TournamentSeriesScheduler', () => {
	test('lists every round', () => {
		renderScheduler();
		expect(screen.getByText('Semi-finals')).toBeInTheDocument();
		expect(screen.getByText('Finals')).toBeInTheDocument();
	});

	test('names the matchup using real team names once they are known', () => {
		renderScheduler();
		expect(screen.getByText('Springfield Alphas vs Springfield Deltas')).toBeInTheDocument();
	});

	test('falls back to the rule when a matchup is still open', () => {
		renderScheduler();
		expect(screen.getByText('Winner of series 1 vs Winner of series 2')).toBeInTheDocument();
	});

	test('explains what an unresolved series is waiting on', () => {
		renderScheduler();
		expect(
			screen.getByText('Waiting on winner of series 1 and winner of series 2.')
		).toBeInTheDocument();
	});

	test('describes the series length and who has home field', () => {
		renderScheduler();
		expect(screen.getAllByText(/Best of 3/).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText(/Higher seed hosts games 1 and 3/).length).toBeGreaterThanOrEqual(1);
	});

	test('shows a row for every game in the series', () => {
		const { container } = renderScheduler();
		// Two series of three games each.
		expect(container.querySelectorAll('.scheduler-game-number').length).toBe(6);
	});

	test('shows the derived home team for each unscheduled game', () => {
		renderScheduler();
		// Game 2 of a "121" series swaps home field to the lower seed.
		expect(screen.getByText('ALP at DEL')).toBeInTheDocument();
	});

	test('links a scheduled game and offers to remove it', () => {
		renderScheduler();
		expect(screen.getByText(/Diamond Park/)).toHaveAttribute('href', '/Game/500');
		expect(screen.getByLabelText('Remove game 1 from series 1')).toBeInTheDocument();
	});

	test('offers to schedule open games in a resolved series', () => {
		renderScheduler();
		expect(screen.getAllByText('Schedule').length).toBe(2);
	});

	test('offers no scheduling for a series whose teams are unknown', () => {
		const bracket = makeBracket({
			rounds: [{ id: 21, name: 'Finals', series: [makeBracket().rounds[1].series[0]] }]
		});
		renderScheduler(bracket);
		expect(screen.queryByText('Schedule')).not.toBeInTheDocument();
		expect(screen.getAllByText('Not known yet').length).toBe(3);
	});

	test('surfaces links that do not fit the series so bad data stays visible', () => {
		const series = makeResolvedSeries({
			unexpectedLinks: [
				{
					seriesGameID: 99,
					gameNumber: 1,
					game: makeGame(501, alphas, deltas),
					reason: 'Game 1 of this series is linked more than once.'
				}
			]
		});
		renderScheduler(makeBracket({ rounds: [{ id: 20, name: 'Semi-finals', series: [series] }] }));

		expect(screen.getByText('These games do not fit this series:')).toBeInTheDocument();
		expect(screen.getByText(/Game 1 of this series is linked more than once./)).toBeInTheDocument();
		expect(screen.getByText('Remove')).toBeInTheDocument();
	});

	test('shows the series result when there is one', () => {
		renderScheduler();
		expect(screen.getByText('Series tied 0-0')).toBeInTheDocument();
	});
});
