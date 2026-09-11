import type { Team } from '$lib/models/Team';
import type { Game } from '$lib/models/Game';
import type {
	BracketStructure,
	RoundRobinStructure,
	SeedingSourceOption,
	SeriesStructure,
	TournamentDetail,
	TournamentLocation,
	TournamentReferenceData
} from '$lib/models/Tournament';
import type { StandingsEntry } from '$lib/models/StandingsEntry';

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

// ------------------------------------------------------- seeding board fixtures

export const epsilons = makeTeam(5, 'Epsilons', 'EPS');
export const zetas = makeTeam(6, 'Zetas', 'ZET');
export const etas = makeTeam(7, 'Etas', 'ETA');
export const thetas = makeTeam(8, 'Thetas', 'THE');

/** The ten regular-season teams in standings order (ranks 1..10). */
export const seasonOrder: Team[] = [
	alphas,
	betas,
	gammas,
	deltas,
	epsilons,
	zetas,
	etas,
	thetas,
	makeTeam(9, 'Iotas', 'IOT'),
	makeTeam(10, 'Kappas', 'KAP')
];

export function makeStandingsEntry(team: Team, wins: number): StandingsEntry {
	return {
		team,
		gamesPlayed: wins + 1,
		wins,
		losses: 1,
		ties: 0,
		points: wins * 2,
		runsScored: wins * 5,
		runsAllowed: 5,
		runDifferential: wins * 5 - 5,
		record: `${wins}-1-0`,
		homeRecord: '',
		awayRecord: '',
		streak: null
	};
}

/** Public /api/Standings response shape for the fixtures' season. */
export const mockStandingsResponse = {
	season: {
		id: 15,
		year: 2026,
		subseason: 'Regular Season',
		name: '2026 Regular Season',
		startDate: '2026-05-01'
	},
	standings: seasonOrder.map((team, i) => makeStandingsEntry(team, 10 - i))
};

/** A quarter-final round where three of four series are decided. Losers by original seed: Thetas(8), Zetas(6), Deltas(4). */
export function makeDecidedQuarterFinals() {
	const series = (
		number: number,
		hi: Team,
		hiSeed: number,
		lo: Team,
		loSeed: number,
		loser: Team | null
	): SeriesStructure =>
		makeResolvedSeries({
			id: 40 + number,
			number,
			matchup: { spot1: { type: 'Seed', number: hiSeed }, spot2: { type: 'Seed', number: loSeed } },
			spot1: { type: 'Seed', number: hiSeed, label: `#${hiSeed}`, team: hi, initialSeed: hiSeed },
			spot2: { type: 'Seed', number: loSeed, label: `#${loSeed}`, team: lo, initialSeed: loSeed },
			winner: loser ? (loser.id === hi.id ? lo : hi) : null,
			loser,
			resultText: loser ? 'decided' : 'Series tied 0-0'
		});
	return {
		id: 41,
		name: 'Quarter-finals',
		series: [
			series(1, alphas, 1, thetas, 8, thetas), // #1 beats #8
			series(2, betas, 2, etas, 7, null), // undecided
			series(3, gammas, 3, zetas, 6, zetas), // #3 beats #6
			series(4, deltas, 4, epsilons, 5, deltas) // upset: #5 beats #4
		]
	};
}

export function makePool(overrides: Partial<RoundRobinStructure> = {}): RoundRobinStructure {
	return {
		id: 7,
		name: 'Pool A',
		historical: false,
		seedsFromRegularSeason: false,
		seeding: [
			{
				outputStart: 1,
				outputEnd: 2,
				result: 'Standings',
				sourceType: 'Season',
				sourceID: 15,
				rankStart: 9,
				rankEnd: 10
			}
		],
		resolvedSeeds: [
			{ seed: 1, team: seasonOrder[8] },
			{ seed: 2, team: seasonOrder[9] }
		],
		standings: [makeStandingsEntry(seasonOrder[9], 2), makeStandingsEntry(seasonOrder[8], 1)],
		games: [],
		canDelete: true,
		...overrides
	};
}

/** Sources as the API would list them for a tournament with one bracket (two rounds) and one pool. */
export const mockBoardSources: SeedingSourceOption[] = [
	{
		sourceType: 'Season',
		sourceID: 15,
		label: '2026 regular season standings',
		result: 'Standings',
		availableTeams: 10
	},
	{
		sourceType: 'BracketRound',
		sourceID: 41,
		label: 'Quarter-finals results (Main bracket)',
		result: 'Standings',
		availableTeams: 8
	},
	{
		sourceType: 'BracketRound',
		sourceID: 41,
		label: 'Teams knocked out in the Quarter-finals (Main bracket)',
		result: 'Losers',
		availableTeams: 4
	},
	{
		sourceType: 'TournamentRoundRobin',
		sourceID: 7,
		label: 'Pool A final standings',
		result: 'Standings',
		availableTeams: 2
	}
];

export function makeTournamentDetail(overrides: Partial<TournamentDetail> = {}): TournamentDetail {
	return {
		id: 6,
		season: {
			id: 16,
			year: 2026,
			subseason: 'Playoffs',
			name: '2026 Playoffs',
			startDate: '2026-08-13'
		},
		brackets: [
			makeBracket({
				rounds: [
					makeDecidedQuarterFinals(),
					{ id: 21, name: 'Semi-finals', series: [makeUnresolvedSeries()] }
				]
			})
		],
		roundRobins: [makePool()],
		referenceData: { ...mockReferenceData, seedingSources: mockBoardSources },
		...overrides
	};
}
