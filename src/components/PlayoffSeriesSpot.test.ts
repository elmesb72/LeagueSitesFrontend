import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import PlayoffSeriesSpot from './PlayoffSeriesSpot.svelte';
import { teamAlphas, spot1Alphas, spotWinner, spotLoser, spotRemaining } from '../tests/playoffMocks';

describe('PlayoffSeriesSpot', () => {
	test('renders team name when team is assigned', () => {
		render(PlayoffSeriesSpot, {
			props: { spot: spot1Alphas, winner: null, initialSeed: 1 }
		});
		expect(screen.getByText('Alphas')).toBeInTheDocument();
	});

	test('renders seed number as superscript', () => {
		const { container } = render(PlayoffSeriesSpot, {
			props: { spot: spot1Alphas, winner: null, initialSeed: 1 }
		});
		const sup = container.querySelector('sup');
		expect(sup?.textContent).toBe('1');
	});

	test('links to team page', () => {
		render(PlayoffSeriesSpot, {
			props: { spot: spot1Alphas, winner: null, initialSeed: 1 }
		});
		const link = screen.getByRole('link');
		expect(link.getAttribute('href')).toBe('/Team/ALP');
	});

	test('highlights winner with CSS class', () => {
		const { container } = render(PlayoffSeriesSpot, {
			props: { spot: spot1Alphas, winner: teamAlphas, initialSeed: 1 }
		});
		expect(container.querySelector('.tournament-series-winner')).not.toBeNull();
	});

	test('does not highlight non-winner', () => {
		const { container } = render(PlayoffSeriesSpot, {
			props: { spot: spot1Alphas, winner: { ...teamAlphas, id: 999 }, initialSeed: 1 }
		});
		expect(container.querySelector('.tournament-series-winner')).toBeNull();
	});

	test('renders TBD when spot is null', () => {
		render(PlayoffSeriesSpot, {
			props: { spot: null, winner: null, initialSeed: null }
		});
		expect(screen.getByText('TBD')).toBeInTheDocument();
	});

	test('renders "Winner of" for winner source', () => {
		render(PlayoffSeriesSpot, {
			props: { spot: spotWinner, winner: null, initialSeed: null }
		});
		expect(screen.getByText('Winner of 1')).toBeInTheDocument();
	});

	test('renders "Loser of" for loser source', () => {
		render(PlayoffSeriesSpot, {
			props: { spot: spotLoser, winner: null, initialSeed: null }
		});
		expect(screen.getByText('Loser of 1')).toBeInTheDocument();
	});

	test('renders remaining seed for remaining source', () => {
		render(PlayoffSeriesSpot, {
			props: { spot: spotRemaining, winner: null, initialSeed: null }
		});
		expect(screen.getByText('#3 remaining')).toBeInTheDocument();
	});

	test('unresolved spots use the placeholder class, not the mobile-hidden name class', () => {
		// The name class is display:none under 768px; placeholders must not use it
		for (const spot of [null, spotWinner, spotLoser, spotRemaining]) {
			const { container, unmount } = render(PlayoffSeriesSpot, {
				props: { spot, winner: null, initialSeed: null }
			});
			expect(container.querySelector('.tournament-series-team-placeholder')).not.toBeNull();
			expect(container.querySelector('.tournament-series-team-name')).toBeNull();
			unmount();
		}
	});

	test('sourced spots provide short mobile labels', () => {
		render(PlayoffSeriesSpot, {
			props: { spot: spotWinner, winner: null, initialSeed: null }
		});
		expect(screen.getByText('W1')).toBeInTheDocument();
	});
});
