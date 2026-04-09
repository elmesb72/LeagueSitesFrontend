import type { Team } from './Team';

export interface StandingsEntry {
	team: Team;
	gamesPlayed: number;
	wins: number;
	losses: number;
	ties: number;
	points: number;
	runsScored: number;
	runsAllowed: number;
	runDifferential: number;
	record: string;
	homeRecord: string;
	awayRecord: string;
	streak: string | null;
}
