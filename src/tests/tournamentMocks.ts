import type { Team } from '$lib/models/Team';
import type { Game } from '$lib/models/Game';
import type {
	BracketStructure,
	SeedingSourceOption,
	SeriesStructure,
	TournamentLocation,
	TournamentReferenceData
} from '$lib/models/Tournament';

export function makeTeam(id: number, name: string, abbreviation: string): Team {
	return {
		id,
		location: 'Springfield',
		name,
		fullName: `Springfield ${name}`,
		abbreviation,
		backgroundColor: 'FFFFFF',
		color: '000000'
	};
}

export const alphas = makeTeam(1, 'Alphas', 'ALP');
export const betas = makeTeam(2, 'Betas', 'BET');
export const gammas = makeTeam(3, 'Gammas', 'GAM');
export const deltas = makeTeam(4, 'Deltas', 'DEL');

export const mockLocations: TournamentLocation[] = [
	{
		id: 7,
		name: 'Diamond Park',
		formalName: null,
		city: 'Springfield',
		address: null,
		mapsPlaceId: null
	},
	{
		id: 8,
		name: 'Shark Field',
		formalName: null,
		city: 'Shelbyville',
		address: null,
		mapsPlaceId: null
	}
];

export function makeGame(id: number, host: Team, visitor: Team, status = 'Upcoming'): Game {
	return {
		id,
		date: '2026-08-20T20:30:00',
		scoreHost: null,
		scoreVisitor: null,
		hostTeam: host,
		visitingTeam: visitor,
		location: {
			id: 7,
			name: 'Diamond Park',
			formalName: null,
			city: 'Springfield',
			address: null,
			mapsPlaceId: null
		},
		season: {
			id: 16,
			year: 2026,
			subseason: 'Playoffs',
			name: '2026 Playoffs',
			startDate: '2026-08-13'
		},
		status: { id: 1, name: status }
	} as unknown as Game;
}

/** A resolved best-of-three with game 1 scheduled and games 2 and 3 open. */
export function makeResolvedSeries(overrides: Partial<SeriesStructure> = {}): SeriesStructure {
	return {
		id: 34,
		number: 1,
		format: 'Best of',
		length: 3,
		hostOrder: [1, 2, 1],
		matchup: {
			spot1: { type: 'Seed', number: 1 },
			spot2: { type: 'Seed', number: 4 }
		},
		spot1: { type: 'Seed', number: 1, label: '#1', team: alphas, initialSeed: 1 },
		spot2: { type: 'Seed', number: 4, label: '#4', team: deltas, initialSeed: 4 },
		winner: null,
		loser: null,
		resultText: 'Series tied 0-0',
		canSchedule: true,
		gameSlots: [
			{
				gameNumber: 1,
				hostSpot: 1,
				seriesGameID: 90,
				hostTeam: alphas,
				visitingTeam: deltas,
				game: makeGame(500, alphas, deltas)
			},
			{
				gameNumber: 2,
				hostSpot: 2,
				seriesGameID: null,
				hostTeam: deltas,
				visitingTeam: alphas,
				game: null
			},
			{
				gameNumber: 3,
				hostSpot: 1,
				seriesGameID: null,
				hostTeam: alphas,
				visitingTeam: deltas,
				game: null
			}
		],
		unexpectedLinks: [],
		...overrides
	};
}

/** A series whose teams are not known yet, so nothing can be scheduled. */
export function makeUnresolvedSeries(): SeriesStructure {
	return {
		id: 38,
		number: 5,
		format: 'Best of',
		length: 3,
		hostOrder: [1, 2, 1],
		matchup: {
			spot1: { type: 'Winner', number: 1 },
			spot2: { type: 'Winner', number: 2 }
		},
		spot1: {
			type: 'Winner',
			number: 1,
			label: 'Winner of series 1',
			team: null,
			initialSeed: null
		},
		spot2: {
			type: 'Winner',
			number: 2,
			label: 'Winner of series 2',
			team: null,
			initialSeed: null
		},
		winner: null,
		loser: null,
		resultText: null,
		canSchedule: false,
		gameSlots: [
			{
				gameNumber: 1,
				hostSpot: 1,
				seriesGameID: null,
				hostTeam: null,
				visitingTeam: null,
				game: null
			},
			{
				gameNumber: 2,
				hostSpot: 2,
				seriesGameID: null,
				hostTeam: null,
				visitingTeam: null,
				game: null
			},
			{
				gameNumber: 3,
				hostSpot: 1,
				seriesGameID: null,
				hostTeam: null,
				visitingTeam: null,
				game: null
			}
		],
		unexpectedLinks: []
	};
}

export function makeBracket(overrides: Partial<BracketStructure> = {}): BracketStructure {
	return {
		id: 12,
		name: 'Main',
		format: 'Re-seed',
		historical: true,
		seedsFromRegularSeason: true,
		seeding: [
			{
				outputStart: 1,
				outputEnd: 4,
				result: 'Standings',
				sourceType: 'Season',
				sourceID: 15,
				rankStart: 1,
				rankEnd: 4
			}
		],
		resolvedSeeds: [
			{ seed: 1, team: alphas },
			{ seed: 2, team: betas },
			{ seed: 3, team: gammas },
			{ seed: 4, team: deltas }
		],
		rounds: [
			{ id: 20, name: 'Semi-finals', series: [makeResolvedSeries()] },
			{ id: 21, name: 'Finals', series: [makeUnresolvedSeries()] }
		],
		winner: null,
		canDelete: false,
		...overrides
	};
}

export const mockSeedingSources: SeedingSourceOption[] = [
	{
		sourceType: 'Season',
		sourceID: 15,
		label: '2026 regular season standings',
		result: 'Standings',
		availableTeams: 10
	},
	{
		sourceType: 'BracketRound',
		sourceID: 20,
		label: 'Teams knocked out in the Semi-finals (Main bracket)',
		result: 'Losers',
		availableTeams: 2
	}
];

export const mockReferenceData: TournamentReferenceData = {
	teams: [alphas, betas, gammas, deltas],
	locations: mockLocations,
	seedingSources: mockSeedingSources,
	regularSeasonID: 15,
	regularSeasonTeamCount: 10
};
