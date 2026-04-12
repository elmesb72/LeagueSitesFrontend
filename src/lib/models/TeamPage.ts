import type { Team } from './Team';
import type { Season } from './Season';
import type { Game } from './Game';

export interface RosterEntry {
	id: number;
	player: {
		id: number;
		firstName: string;
		lastName: string;
		name: string;
		number: string | null;
		shortCode: string;
	} | null;
	roles: string[];
	userRoles: string[];
}

export interface TeamPageData {
	team: Team & { active: boolean; hidden: boolean };
	season: Season | null;
	record: string;
	managers: string[];
	games: Game[];
	roster: RosterEntry[];
}
