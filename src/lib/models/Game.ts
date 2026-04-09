import type { Team } from './Team';

export interface GameStatus {
	id: number;
	name: string;
}

export interface Game {
	id: number;
	date: string;
	hostTeam: Team;
	visitingTeam: Team;
	scoreHost: number | null;
	scoreVisitor: number | null;
	status: GameStatus;
	location: { id: number; name: string };
	season: { id: number; year: number; subseason: string };
}
