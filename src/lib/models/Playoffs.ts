import type { Team } from './Team';
import type { Game } from './Game';
import type { Season } from './Season';
import type { StandingsEntry } from './StandingsEntry';

export interface PlayoffsData {
	season: Season;
	brackets: Bracket[];
	roundRobins: RoundRobin[];
}

export interface Bracket {
	name: string;
	format: string;
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
