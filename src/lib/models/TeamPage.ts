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
	userName?: string;
	email?: string;
	roles: string[];
	userRoles: string[];
	hasUser?: boolean;
	hasInvitationEmails?: boolean;
}

export interface InactiveRoster {
	substitutes: RosterEntry[];
	formerPlayers: RosterEntry[];
	nonPlayerUsers: RosterEntry[];
}

export interface TeamPageData {
	team: Team & { active: boolean; hidden: boolean };
	season: Season | null;
	record: string;
	managers: string[];
	games: Game[];
	roster: RosterEntry[];
	canAddPlayer: boolean;
	canEditTeam: boolean;
	isTeamMember: boolean;
	canViewAdminIcons: boolean;
	inactiveRoster: InactiveRoster | null;
}
