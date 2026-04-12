import type {
	PlayoffsData,
	Bracket,
	BracketRound,
	Series,
	SeriesSpot,
	SeriesGame,
	RoundRobin
} from '$lib/models/Playoffs';
import type { Game } from '$lib/models/Game';
import type { Team } from '$lib/models/Team';

export const teamAlphas: Team = {
	id: 1, location: 'Alpha City', name: 'Alphas', fullName: 'Alpha City Alphas',
	abbreviation: 'ALP', backgroundColor: '003366', color: 'FFFFFF'
};

export const teamBetas: Team = {
	id: 2, location: 'Beta Town', name: 'Betas', fullName: 'Beta Town Betas',
	abbreviation: 'BET', backgroundColor: 'CC0000', color: 'FFFFFF'
};

export const teamGammas: Team = {
	id: 3, location: 'Gamma Falls', name: 'Gammas', fullName: 'Gamma Falls Gammas',
	abbreviation: 'GAM', backgroundColor: '00CC00', color: '000000'
};

export const teamDeltas: Team = {
	id: 4, location: 'Delta Bay', name: 'Deltas', fullName: 'Delta Bay Deltas',
	abbreviation: 'DEL', backgroundColor: 'FF9900', color: '000000'
};

const mockLocation = { id: 1, name: 'Playoff Park' };
const mockSeason = { id: 10, year: 2026, subseason: 'Playoffs' };

export function makePlayedGame(id: number, host: Team, visitor: Team, scoreHost: number, scoreVisitor: number): Game {
	return {
		id, date: '2026-09-01T19:00:00',
		hostTeam: host, visitingTeam: visitor,
		scoreHost, scoreVisitor,
		status: { id: 2, name: 'Played' },
		location: mockLocation, season: mockSeason
	};
}

export function makeUpcomingGame(id: number, host: Team, visitor: Team): Game {
	return {
		id, date: '2026-09-15T19:00:00',
		hostTeam: host, visitingTeam: visitor,
		scoreHost: null, scoreVisitor: null,
		status: { id: 1, name: 'Upcoming' },
		location: mockLocation, season: mockSeason
	};
}

export const spot1Alphas: SeriesSpot = { source: 's', seed: 1, team: teamAlphas, initialSeed: 1 };
export const spot2Betas: SeriesSpot = { source: 's', seed: 2, team: teamBetas, initialSeed: 4 };
export const spotWinner: SeriesSpot = { source: 'w', seed: 1, team: null, initialSeed: null };
export const spotLoser: SeriesSpot = { source: 'l', seed: 1, team: null, initialSeed: null };
export const spotRemaining: SeriesSpot = { source: 'r', seed: 3, team: null, initialSeed: null };

export const completedSeriesGames: SeriesGame[] = [
	{ gameNumber: 1, game: makePlayedGame(201, teamAlphas, teamBetas, 5, 3) },
	{ gameNumber: 2, game: makePlayedGame(202, teamBetas, teamAlphas, 2, 4) },
	{ gameNumber: 3, game: makePlayedGame(203, teamAlphas, teamBetas, 6, 1) },
];

export const inProgressSeriesGames: SeriesGame[] = [
	{ gameNumber: 1, game: makePlayedGame(301, teamAlphas, teamBetas, 5, 3) },
	{ gameNumber: 2, game: makePlayedGame(302, teamBetas, teamAlphas, 4, 2) },
	{ gameNumber: 3, game: makeUpcomingGame(303, teamAlphas, teamBetas) },
];

export const tbdSeriesGames: SeriesGame[] = [
	{ gameNumber: 1, game: null },
	{ gameNumber: 2, game: null },
	{ gameNumber: 3, game: null },
];

export const completedSeries: Series = {
	number: 1, format: 'Best of', hostOrder: '12121',
	spot1: spot1Alphas, spot2: spot2Betas,
	winner: teamAlphas, loser: teamBetas,
	results: {
		teamResults: [
			{ team: teamAlphas, wins: 3, losses: 0 },
			{ team: teamBetas, wins: 0, losses: 3 }
		],
		statusText: 'Alpha City Alphas win 3-0'
	},
	games: completedSeriesGames
};

export const inProgressSeries: Series = {
	number: 2, format: 'Best of', hostOrder: '12121',
	spot1: spot1Alphas, spot2: spot2Betas,
	winner: null, loser: null,
	results: {
		teamResults: [
			{ team: teamAlphas, wins: 1, losses: 1 },
			{ team: teamBetas, wins: 1, losses: 1 }
		],
		statusText: 'Series tied 1-1'
	},
	games: inProgressSeriesGames
};

export const tbdSeries: Series = {
	number: 3, format: 'Best of', hostOrder: '12121',
	spot1: spotWinner, spot2: null,
	winner: null, loser: null,
	results: null,
	games: tbdSeriesGames
};

export const mockRound1: BracketRound = {
	name: 'Semifinals',
	series: [completedSeries, inProgressSeries]
};

export const mockRound2: BracketRound = {
	name: 'Finals',
	series: [tbdSeries]
};

export const mockBracket: Bracket = {
	name: 'Championship',
	format: 'Best of',
	rounds: [mockRound1, mockRound2]
};

export const mockRoundRobin: RoundRobin = {
	name: 'Pool A',
	standings: [
		{
			team: teamAlphas, gamesPlayed: 2, wins: 2, losses: 0, ties: 0,
			points: 4, runsScored: 10, runsAllowed: 4, runDifferential: 6,
			record: '2-0-0', homeRecord: '1-0-0', awayRecord: '1-0-0', streak: 'W2'
		},
		{
			team: teamBetas, gamesPlayed: 2, wins: 0, losses: 2, ties: 0,
			points: 0, runsScored: 4, runsAllowed: 10, runDifferential: -6,
			record: '0-2-0', homeRecord: '0-1-0', awayRecord: '0-1-0', streak: 'L2'
		}
	],
	games: [
		{ game: makePlayedGame(401, teamAlphas, teamBetas, 5, 2) },
		{ game: makePlayedGame(402, teamBetas, teamAlphas, 2, 5) }
	]
};

export const mockPlayoffsData: PlayoffsData = {
	season: { id: 10, year: 2026, subseason: 'Playoffs', name: '2026 Playoffs', startDate: '2026-09-01' },
	brackets: [mockBracket],
	roundRobins: [mockRoundRobin]
};

export const emptyPlayoffsData: PlayoffsData = {
	season: { id: 10, year: 2026, subseason: 'Playoffs', name: '2026 Playoffs', startDate: '2026-09-01' },
	brackets: [],
	roundRobins: []
};
