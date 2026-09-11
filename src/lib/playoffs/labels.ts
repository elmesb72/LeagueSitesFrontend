// Text equivalents of what the bracket shows visually, for accessible names.

import type { Series, SeriesSpot } from '$lib/models/Playoffs';

/** "#1 Alpha City Alphas", "Winner of series 3", "Rank 2 of remaining teams", "To be decided". */
export function spotLabel(spot: SeriesSpot | null): string {
	if (!spot) return 'To be decided';
	if (spot.team) {
		return spot.initialSeed !== null
			? `#${spot.initialSeed} ${spot.team.fullName}`
			: spot.team.fullName;
	}
	switch (spot.source) {
		case 'w':
			return `Winner of series ${spot.seed}`;
		case 'l':
			return `Loser of series ${spot.seed}`;
		case 'r':
			return `Rank ${spot.seed} of remaining teams`;
		default:
			return 'To be decided';
	}
}

/** "Series 3: #1 Alpha City Alphas vs #4 Delta Bay Deltas, Delta Bay Deltas win 2-1". */
export function seriesLabel(series: Series): string {
	const status = series.results?.statusText;
	return `Series ${series.number}: ${spotLabel(series.spot1)} vs ${spotLabel(series.spot2)}${status ? `, ${status}` : ''}`;
}
