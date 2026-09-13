// Pre-filling the Add-bracket and Add-pool pages from a link that already knows
// what the executive is about to build: "a B-side pool for the teams knocked out
// in the Quarter-finals", or "the final the top 2 of this pool go on to". The
// links carry query parameters; these helpers turn them into the seeding rule,
// name and note the forms start from. Pure.

import type { SeedGroup, TournamentDetail } from '$lib/models/Tournament';

export interface PoolPrefill {
	seeding: SeedGroup;
	note: string;
}

export interface BracketPrefill {
	seeding: SeedGroup;
	name: string;
	/** The page title: "Add the B Side final". */
	title: string;
	note: string;
}

function positiveInt(value: string | null): number | null {
	const n = Number(value);
	return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * `?losersOf={roundId}`: a pool for everyone knocked out in that round.
 * Null when the parameter is absent or names a round that is not in this tournament.
 */
export function poolPrefill(detail: TournamentDetail, params: URLSearchParams): PoolPrefill | null {
	const roundId = positiveInt(params.get('losersOf'));
	if (roundId === null) return null;
	for (const bracket of detail.brackets) {
		const round = bracket.rounds.find((r) => r.id === roundId);
		if (!round || round.series.length === 0) continue;
		const losers = round.series.length;
		return {
			seeding: {
				outputStart: 1,
				outputEnd: losers,
				result: 'Losers',
				sourceType: 'BracketRound',
				sourceID: round.id,
				rankStart: 1,
				rankEnd: losers
			},
			note:
				`Pre-filled with the ${losers} teams knocked out in the ${round.name} of the ` +
				`${bracket.name} bracket. Change them below if that is not right.`
		};
	}
	return null;
}

/**
 * `?afterPool={poolId}&top={n}`: the final the pool's top n teams go on to.
 * `top` defaults to 2 and is clamped to what a bracket can lay out (2 or 4).
 */
export function bracketPrefill(
	detail: TournamentDetail,
	params: URLSearchParams
): BracketPrefill | null {
	const poolId = positiveInt(params.get('afterPool'));
	if (poolId === null) return null;
	const pool = detail.roundRobins.find((p) => p.id === poolId);
	if (!pool) return null;
	const requested = positiveInt(params.get('top')) ?? 2;
	const top = requested >= 4 ? 4 : 2;
	return {
		seeding: {
			outputStart: 1,
			outputEnd: top,
			result: 'Standings',
			sourceType: 'TournamentRoundRobin',
			sourceID: pool.id,
			rankStart: 1,
			rankEnd: top
		},
		name: `${pool.name} Final`,
		title: `Add the ${pool.name} final`,
		note:
			`Seeded from the top ${top} of ${pool.name} by final standings, named, and marked as a ` +
			`champion. Build the rounds and save; nothing else to fill in.`
	};
}
