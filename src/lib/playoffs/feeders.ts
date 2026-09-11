// Which earlier series produced the team in a bracket spot. Drives the
// connector lines, which therefore follow the data rather than fixed elbows.
//
// Spot sources (RoundSeries.Matchup on the server): '#' initial seed, 'w'/'l'
// winner/loser of series N, 'r' rank N among the teams still alive. Re-seeded
// brackets use 'r' for every round after the first, and the server leaves
// those spots unresolved until the feeding round is complete, so their
// feeders are only knowable once the teams are.

import type { Bracket, Series, SeriesSpot } from '$lib/models/Playoffs';

export type ConnectorStyle = 'advance' | 'consolation';

export interface Feeder {
	series: Series;
	style: ConnectorStyle;
}

export function feederOf(
	spot: SeriesSpot | null,
	roundIndex: number,
	bracket: Bracket
): Feeder | null {
	if (!spot) return null;

	if (spot.source === 'w' || spot.source === 'l') {
		// Series numbers are unique within a bracket. A reference into another
		// bracket (a consolation bracket fed by the main bracket's losers) finds
		// nothing here and draws no line; the spot's text still says "Loser of series N".
		const referenced = bracket.rounds
			.slice(0, roundIndex)
			.flatMap((r) => r.series)
			.find((s) => s.number === spot.seed);
		return referenced
			? { series: referenced, style: spot.source === 'w' ? 'advance' : 'consolation' }
			: null;
	}

	// 'r' (or any other resolved spot beyond the opening round): the series in
	// the previous round this team won.
	if (spot.team && roundIndex > 0) {
		const team = spot.team;
		const previous = bracket.rounds[roundIndex - 1];
		const won = previous?.series.find((s) => s.winner?.id === team.id);
		return won ? { series: won, style: 'advance' } : null;
	}

	return null;
}

/** Every connector in a bracket: (round index of the fed series, spot index, feeder). */
export interface BracketConnector {
	series: Series;
	roundIndex: number;
	spotIndex: 0 | 1;
	feeder: Feeder;
}

export function connectorsOf(bracket: Bracket): BracketConnector[] {
	const out: BracketConnector[] = [];
	bracket.rounds.forEach((round, roundIndex) => {
		for (const series of round.series) {
			([series.spot1, series.spot2] as const).forEach((spot, i) => {
				const feeder = feederOf(spot, roundIndex, bracket);
				if (feeder) out.push({ series, roundIndex, spotIndex: i as 0 | 1, feeder });
			});
		}
	});
	return out;
}

/** Round index of the gap a connector crosses: the round its feeder is in. */
export function gapOf(connector: BracketConnector, bracket: Bracket): number {
	return bracket.rounds.findIndex((r) => r.series.includes(connector.feeder.series));
}

/**
 * Width of the space between rounds, wide enough for one lane per connector in
 * the busiest gap: 56px minimum, 9px per lane plus margins (97px for a 16-team
 * opening round).
 */
export function bracketGapPx(bracket: Bracket): number {
	const perGap = new Map<number, number>();
	for (const c of connectorsOf(bracket)) {
		const gap = gapOf(c, bracket);
		perGap.set(gap, (perGap.get(gap) ?? 0) + 1);
	}
	const lanes = Math.max(0, ...perGap.values());
	return Math.max(56, 16 + 9 * (lanes + 1));
}
