import type { Team } from './Team';
import type { Game } from './Game';
import type { Season } from './Season';
import type { StandingsEntry } from './StandingsEntry';

export interface PlayoffsData {
	season: Season;
	brackets: Bracket[];
	roundRobins: RoundRobin[];
}

export type TournamentKind = 'playoffs' | 'tournament';

/**
 * What /api/Tournaments/{id} and /api/Playoffs return: the playoffs and a
 * mid-season cup share one shape. `PlayoffsData` is the same thing without the
 * identifying fields, kept for the fixtures and tests that predate cups.
 */
export interface TournamentData extends PlayoffsData {
	id: number;
	/** The season's name: "2026 Playoffs", "2027 Canada Day Cup". */
	name: string;
	kind: TournamentKind;
}

/** One line of the year's tournament list (/api/Tournaments?year=). */
export interface TournamentSummary {
	id: number;
	name: string;
	kind: TournamentKind;
	season: Season;
	startDate: string;
	firstGame: string | null;
	lastGame: string | null;
	gamesScheduled: number;
	gamesPlayed: number;
	decided: boolean;
	titles: TournamentTitle[];
}

export interface TournamentTitle {
	label: string;
	team: Team;
}

/** Where a season's games can be followed: carried by the schedule, standings and homepage payloads. */
export interface TournamentLink {
	seasonId: number;
	tournamentId: number;
	name: string;
	shortName: string;
	kind: TournamentKind;
}

export interface Bracket {
	name: string;
	format: string;
	/** The league shows this bracket's winner as a champion on the History page. */
	historical: boolean;
	/** Set once every series in the bracket has a winner. */
	winner: Team | null;
	rounds: BracketRound[];
}

export interface BracketRound {
	name: string;
	series: Series[];
}

export interface Series {
	number: number;
	format: string;
	hostOrder: string;
	spot1: SeriesSpot | null;
	spot2: SeriesSpot | null;
	winner: Team | null;
	loser: Team | null;
	results: SeriesResults | null;
	games: SeriesGame[];
}

export interface SeriesSpot {
	source: string;
	seed: number;
	team: Team | null;
	initialSeed: number | null;
}

export interface SeriesResults {
	teamResults: SeriesTeamResult[];
	statusText: string;
}

export interface SeriesTeamResult {
	team: Team;
	wins: number;
	losses: number;
}

export interface SeriesGame {
	gameNumber: number;
	game: Game | null;
}

export interface RoundRobin {
	name: string;
	standings: StandingsEntry[] | null;
	games: RoundRobinGame[];
}

export interface RoundRobinGame {
	game: Game;
}
