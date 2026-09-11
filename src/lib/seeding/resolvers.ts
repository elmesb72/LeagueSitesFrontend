// Turns the API's seeding sources into displayable groups with team names,
// using only data the frontend can already get. No new endpoints.
//
//   Season standings        → GET /api/Standings?year=  (fetched once, see fetchSeasonRanks)
//   Pool standings          → tournament.roundRobins[].standings (already loaded)
//   Round knocked-out teams → that round's series losers, ordered by original seed
//   Round results           → not previewed (ranked by record on the server)
//
// buildSourceGroups is synchronous so the board renders immediately with rank
// numbers; the season fetch fills names in when it lands. Nothing here throws.

import type { SeedingSourceOption, TournamentDetail } from '$lib/models/Tournament';
import type { Team } from '$lib/models/Team';
import { sourceKey, type RankEntry, type SourceGroup } from './model';

export interface SeasonRanks {
	teams: Team[] | null;
	/** Set when the fetch failed; shown as the group's note. */
	error: string | null;
	pending: boolean;
}

export interface ResolverInput {
	sources: SeedingSourceOption[];
	tournament: TournamentDetail | null;
	regularSeasonID: number | null;
	seasonRanks: SeasonRanks;
	/** Brackets care about rank order; pools do not. Adds the reorder caveat to Losers sources. */
	feedsBracket: boolean;
}

export const SEASON_LOADING: SeasonRanks = { teams: null, error: null, pending: true };

/** One fetch of the regular season's ranked teams for a year. */
export async function fetchSeasonRanks(
	year: number,
	fetchFn: typeof fetch = fetch
): Promise<SeasonRanks> {
	try {
		const response = await fetchFn(`/api/Standings?year=${year}`);
		if (!response.ok) {
			return {
				teams: null,
				error: 'Standings could not be loaded, so ranks are shown as numbers.',
				pending: false
			};
		}
		const data = (await response.json()) as { standings: { team: Team }[] };
		return { teams: data.standings.map((entry) => entry.team), error: null, pending: false };
	} catch {
		return {
			teams: null,
			error: 'Standings could not be loaded, so ranks are shown as numbers.',
			pending: false
		};
	}
}

function fill(capacity: number, teams: (Team | null)[], resolvesWhen: string | null): RankEntry[] {
	const ranks: RankEntry[] = [];
	for (let rank = 1; rank <= capacity; rank++) {
		const team = teams[rank - 1] ?? null;
		ranks.push({ rank, team, resolvesWhen: team ? null : resolvesWhen });
	}
	return ranks;
}

function findRound(tournament: TournamentDetail | null, roundID: number) {
	for (const bracket of tournament?.brackets ?? []) {
		const round = bracket.rounds.find((r) => r.id === roundID);
		if (round) return { bracket, round };
	}
	return null;
}

/**
 * Knocked-out teams in the order the server uses: by their original seed in the
 * source bracket, best first. Teams that entered from another bracket have no
 * seed there and sort last. Undecided series contribute nothing yet.
 */
function losersInOrder(round: {
	series: TournamentDetail['brackets'][number]['rounds'][number]['series'];
}): Team[] {
	const decided = round.series
		.filter((s) => s.loser !== null)
		.map((s) => {
			const loser = s.loser!;
			const spot = [s.spot1, s.spot2].find((sp) => sp.team?.id === loser.id);
			return { loser, seed: spot?.initialSeed ?? Number.MAX_SAFE_INTEGER, number: s.number };
		});
	decided.sort((a, b) => a.seed - b.seed || a.number - b.number);
	return decided.map((d) => d.loser);
}

export function buildSourceGroups(input: ResolverInput): SourceGroup[] {
	const { sources, tournament, regularSeasonID, seasonRanks, feedsBracket } = input;

	return sources.map((option): SourceGroup => {
		const key = sourceKey(option);
		const capacity = option.availableTeams;

		if (option.sourceType === 'Season') {
			if (option.sourceID !== regularSeasonID) {
				return {
					key,
					option,
					shortLabel: 'season standings',
					ranks: fill(capacity, [], 'names for another season are not shown here'),
					note: null
				};
			}
			if (seasonRanks.teams) {
				return {
					key,
					option,
					shortLabel: 'regular season',
					ranks: fill(capacity, seasonRanks.teams, 'not in the standings yet'),
					note: 'Ranks as of today\u2019s standings. They re-resolve as games are played.'
				};
			}
			return {
				key,
				option,
				shortLabel: 'regular season',
				ranks: fill(capacity, [], seasonRanks.pending ? 'loading\u2026' : null),
				note: seasonRanks.error ?? (seasonRanks.pending ? 'Loading standings\u2026' : null)
			};
		}

		if (option.sourceType === 'TournamentRoundRobin') {
			const pool = tournament?.roundRobins.find((rr) => rr.id === option.sourceID);
			const teams = pool?.standings?.map((entry) => entry.team) ?? [];
			return {
				key,
				option,
				shortLabel: pool?.name ?? 'pool',
				ranks: fill(capacity, teams, 'fills in as pool games are played'),
				note: pool
					? 'Ranks as of the pool\u2019s current standings. They re-resolve as pool games are played.'
					: null
			};
		}

		// BracketRound
		const found = findRound(tournament, option.sourceID);
		const roundName = found?.round.name ?? 'round';
		const resolvesWhen = `fills in as ${roundName} series finish`;

		if (option.result === 'Losers') {
			const teams = found ? losersInOrder(found.round) : [];
			let note = 'Knocked-out teams are ordered by their original seed.';
			if (feedsBracket) note += ' Ranks may reorder until every series in the round has finished.';
			return {
				key,
				option,
				shortLabel: `${roundName} losers`,
				ranks: fill(capacity, teams, resolvesWhen),
				note
			};
		}

		return {
			key,
			option,
			shortLabel: `${roundName} results`,
			ranks: fill(capacity, [], resolvesWhen),
			note: 'Ranked by record on the server once the games are played. Names are not previewed here.'
		};
	});
}
