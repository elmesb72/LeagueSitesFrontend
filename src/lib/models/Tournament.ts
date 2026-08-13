import type { Team } from './Team';
import type { Game } from './Game';
import type { Season } from './Season';
import type { StandingsEntry } from './StandingsEntry';

// Structured view of a tournament for the Executive management pages.
//
// The backend stores brackets in a compact string encoding (matchups like "#1-#8",
// host orders like "121", seeding like "1-8,Standings,Season:13:1-8"). None of that
// reaches the browser: the API speaks in the shapes below instead.

export type SpotType = 'Seed' | 'Winner' | 'Loser' | 'Reseed';
export type SeedResult = 'Standings' | 'Losers';
export type SeedSourceType = 'Season' | 'BracketRound' | 'TournamentRoundRobin';
export type BracketFormat = 'Fixed' | 'Re-seed';

export interface SpotRef {
	type: SpotType;
	number: number;
}

export interface Matchup {
	spot1: SpotRef;
	spot2: SpotRef;
}

export interface SeedGroup {
	outputStart: number;
	outputEnd: number;
	result: SeedResult;
	sourceType: SeedSourceType;
	sourceID: number;
	rankStart: number;
	rankEnd: number;
}

export interface SeedingSourceOption {
	sourceType: SeedSourceType;
	sourceID: number;
	label: string;
	result: SeedResult;
	availableTeams: number;
}

export interface SeedAssignment {
	seed: number;
	team: Team;
}

/** A matchup spot, both as the rule that defines it and the team it resolves to today. */
export interface SeriesSpotState {
	type: SpotType;
	number: number;
	label: string;
	team: Team | null;
	initialSeed: number | null;
}

export interface SeriesGameSlot {
	gameNumber: number;
	hostSpot: number;
	seriesGameID: number | null;
	hostTeam: Team | null;
	visitingTeam: Team | null;
	game: Game | null;
}

/** A link the host order does not account for, surfaced so bad data stays visible. */
export interface SeriesGameLink {
	seriesGameID: number;
	gameNumber: number;
	game: Game | null;
	reason: string;
}

export interface SeriesStructure {
	id: number;
	number: number;
	format: string;
	length: number;
	hostOrder: number[];
	matchup: Matchup;
	spot1: SeriesSpotState;
	spot2: SeriesSpotState;
	winner: Team | null;
	loser: Team | null;
	resultText: string | null;
	canSchedule: boolean;
	gameSlots: SeriesGameSlot[];
	unexpectedLinks: SeriesGameLink[];
}

export interface RoundStructure {
	id: number;
	name: string;
	series: SeriesStructure[];
}

export interface BracketStructure {
	id: number;
	name: string;
	format: BracketFormat;
	historical: boolean;
	seedsFromRegularSeason: boolean;
	seeding: SeedGroup[];
	resolvedSeeds: SeedAssignment[];
	rounds: RoundStructure[];
	winner: Team | null;
	canDelete: boolean;
}

export interface RoundRobinGameSlot {
	roundRobinGameID: number;
	game: Game | null;
}

export interface RoundRobinStructure {
	id: number;
	name: string;
	historical: boolean;
	seedsFromRegularSeason: boolean;
	seeding: SeedGroup[];
	resolvedSeeds: SeedAssignment[];
	standings: StandingsEntry[] | null;
	games: RoundRobinGameSlot[];
	canDelete: boolean;
}

export interface TournamentLocation {
	id: number;
	name: string;
	formalName: string | null;
	city: string;
	address: string | null;
	mapsPlaceId: string | null;
}

export interface TournamentReferenceData {
	teams: Team[];
	locations: TournamentLocation[];
	seedingSources: SeedingSourceOption[];
	regularSeasonID: number | null;
	regularSeasonTeamCount: number;
}

export interface TournamentDetail {
	id: number;
	season: Season;
	brackets: BracketStructure[];
	roundRobins: RoundRobinStructure[];
	referenceData: TournamentReferenceData;
}

// ------------------------------------------------------------------- Upsert

export interface SeriesUpsert {
	id: number | null;
	number: number;
	format: string;
	hostOrder: number[];
	matchup: Matchup;
}

export interface RoundUpsert {
	id: number | null;
	name: string;
	series: SeriesUpsert[];
}

export interface BracketUpsert {
	name: string;
	format: BracketFormat;
	historical: boolean;
	seeding: SeedGroup[];
	rounds: RoundUpsert[];
}

export interface RoundRobinUpsert {
	name: string;
	historical: boolean;
	seeding: SeedGroup[];
}
