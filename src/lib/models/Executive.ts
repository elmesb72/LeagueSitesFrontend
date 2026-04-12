import type { Team } from './Team';
import type { Season } from './Season';

export interface ExecutiveTeam extends Team {
	active: boolean;
	hidden: boolean;
}

export interface ExecutiveLocation {
	id: number;
	active: boolean;
	name: string;
	formalName: string | null;
	city: string;
	address: string | null;
	mapsPlaceId: string | null;
}

export interface TournamentSummary {
	id: number;
	brackets: { id: number; name: string }[];
	roundRobins: { id: number; name: string }[];
}

export interface ExecutiveSeasonData {
	season: Season;
	gamesScheduled: number;
	gamesPlayed: number;
	tournaments: TournamentSummary[];
}

export interface ExecutivePlayoffsData {
	season: Season;
	tournaments: TournamentSummary[];
}

export interface ExecutiveDashboard {
	teams: ExecutiveTeam[];
	locations: ExecutiveLocation[];
	currentSeason: ExecutiveSeasonData | null;
	currentPlayoffs: ExecutivePlayoffsData | null;
}
