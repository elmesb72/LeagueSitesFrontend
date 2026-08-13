import type {
	BracketFormat,
	Matchup,
	RoundUpsert,
	SeriesUpsert,
	SpotRef
} from '$lib/models/Tournament';

// Turns plain answers ("eight teams, re-seeded after each round, best of three")
// into the round and series structure the API expects. Executives never see seed
// references or host orders; this is where those are worked out.

/** Team counts the generator can lay out. Byes are not supported yet. */
export const SUPPORTED_TEAM_COUNTS = [2, 4, 8, 16] as const;

export const SERIES_LENGTHS = [1, 3, 5, 7] as const;

export function seriesLengthLabel(length: number): string {
	return length === 1 ? 'Single game' : `Best of ${length}`;
}

/**
 * Round names counting back from the final, which is how leagues actually name them.
 */
export function roundNameForSeriesCount(seriesCount: number): string {
	switch (seriesCount) {
		case 1:
			return 'Finals';
		case 2:
			return 'Semi-finals';
		case 4:
			return 'Quarter-finals';
		case 8:
			return 'Round of 16';
		default:
			return `Round of ${seriesCount * 2}`;
	}
}

/**
 * Alternating home field starting with the higher seed, which gives the higher seed
 * the extra home game in an odd-length series.
 */
export function defaultHostOrder(length: number): number[] {
	return Array.from({ length }, (_, index) => (index % 2 === 0 ? 1 : 2));
}

export function hostOrderSummary(hostOrder: number[]): string {
	const higherSeedGames = hostOrder
		.map((host, index) => (host === 1 ? index + 1 : null))
		.filter((gameNumber): gameNumber is number => gameNumber !== null);

	if (higherSeedGames.length === 0) return 'Lower seed hosts every game';
	if (higherSeedGames.length === hostOrder.length) return 'Higher seed hosts every game';

	const list =
		higherSeedGames.length === 1
			? `game ${higherSeedGames[0]}`
			: `games ${higherSeedGames.slice(0, -1).join(', ')} and ${higherSeedGames.at(-1)}`;

	return `Higher seed hosts ${list}`;
}

function seed(number: number): SpotRef {
	return { type: 'Seed', number };
}

function reseed(number: number): SpotRef {
	return { type: 'Reseed', number };
}

function winnerOf(seriesNumber: number): SpotRef {
	return { type: 'Winner', number: seriesNumber };
}

function matchup(spot1: SpotRef, spot2: SpotRef): Matchup {
	return { spot1, spot2 };
}

/**
 * Builds every round of a knockout bracket.
 *
 * The opening round pairs best against worst (1v8, 2v7, ...). After that a re-seeding
 * bracket re-pairs whoever is left by rank, while a fixed bracket sends the winners of
 * neighbouring series straight at each other.
 *
 * @param teamCount How many teams enter. Must be a power of two.
 * @param seriesLengths Series length per round, opening round first.
 */
export function generateRounds(
	teamCount: number,
	format: BracketFormat,
	seriesLengths: number[],
	seedOffset = 0
): RoundUpsert[] {
	if (!SUPPORTED_TEAM_COUNTS.includes(teamCount as (typeof SUPPORTED_TEAM_COUNTS)[number])) {
		throw new Error(`Cannot lay out a bracket for ${teamCount} teams.`);
	}

	const rounds: RoundUpsert[] = [];
	let nextSeriesNumber = 1;
	let remaining = teamCount;
	let previousRoundNumbers: number[] = [];
	let roundIndex = 0;

	while (remaining > 1) {
		const seriesCount = remaining / 2;
		const length = seriesLengths[roundIndex] ?? seriesLengths.at(-1) ?? 3;
		const hostOrder = defaultHostOrder(length);
		const series: SeriesUpsert[] = [];
		const numbersThisRound: number[] = [];

		for (let index = 0; index < seriesCount; index++) {
			const number = nextSeriesNumber++;
			numbersThisRound.push(number);

			let pairing: Matchup;
			if (roundIndex === 0) {
				// Best against worst, using absolute seed numbers so a bracket can start
				// part way down the standings (a second division bracket, for instance).
				pairing = matchup(seed(seedOffset + index + 1), seed(seedOffset + remaining - index));
			} else if (format === 'Re-seed') {
				pairing = matchup(reseed(index + 1), reseed(remaining - index));
			} else {
				pairing = matchup(
					winnerOf(previousRoundNumbers[index * 2]),
					winnerOf(previousRoundNumbers[index * 2 + 1])
				);
			}

			series.push({
				id: null,
				number,
				format: 'Best of',
				hostOrder: [...hostOrder],
				matchup: pairing
			});
		}

		rounds.push({ id: null, name: roundNameForSeriesCount(seriesCount), series });

		previousRoundNumbers = numbersThisRound;
		remaining = seriesCount;
		roundIndex++;
	}

	return rounds;
}

/** How many rounds a bracket of this size will have. */
export function roundCountFor(teamCount: number): number {
	return Math.log2(teamCount);
}

/**
 * Plain-language description of a matchup, for rounds whose teams are not known yet.
 */
export function describeSpot(spot: SpotRef): string {
	switch (spot.type) {
		case 'Seed':
			return `#${spot.number} seed`;
		case 'Winner':
			return `Winner of series ${spot.number}`;
		case 'Loser':
			return `Loser of series ${spot.number}`;
		case 'Reseed':
			return spot.number === 1
				? 'Best team still alive'
				: `${ordinal(spot.number)} best team still alive`;
	}
}

function ordinal(value: number): string {
	const suffixes = ['th', 'st', 'nd', 'rd'];
	const remainder = value % 100;
	return value + (suffixes[(remainder - 20) % 10] ?? suffixes[remainder] ?? suffixes[0]);
}
