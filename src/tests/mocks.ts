import type { Team } from '$lib/models/Team';
import type { Game } from '$lib/models/Game';
import type { News } from '$lib/models/News';
import type { StandingsEntry } from '$lib/models/StandingsEntry';

export const mockTeamA: Team = {
	id: 1,
	location: 'Springfield',
	name: 'Isotopes',
	fullName: 'Springfield Isotopes',
	abbreviation: 'SPR',
	backgroundColor: '003366',
	color: 'FFFFFF'
};

export const mockTeamB: Team = {
	id: 2,
	location: 'Shelbyville',
	name: 'Sharks',
	fullName: 'Shelbyville Sharks',
	abbreviation: 'SHL',
	backgroundColor: 'CC0000',
	color: 'FFFFFF'
};

const mockLocation = { id: 1, name: 'Diamond Park' };
const mockSeason = { id: 1, year: 2026, subseason: 'Regular Season' };

export const mockUpcomingGame: Game = {
	id: 101,
	date: '2026-04-15T19:00:00',
	hostTeam: mockTeamA,
	visitingTeam: mockTeamB,
	scoreHost: null,
	scoreVisitor: null,
	status: { id: 1, name: 'Upcoming' },
	location: mockLocation,
	season: mockSeason
};

export const mockPlayedGame: Game = {
	id: 102,
	date: '2026-04-08T19:00:00',
	hostTeam: mockTeamA,
	visitingTeam: mockTeamB,
	scoreHost: 5,
	scoreVisitor: 3,
	status: { id: 2, name: 'Played' },
	location: mockLocation,
	season: mockSeason
};

export const mockPostponedGame: Game = {
	id: 103,
	date: '2026-04-10T19:00:00',
	hostTeam: mockTeamB,
	visitingTeam: mockTeamA,
	scoreHost: null,
	scoreVisitor: null,
	status: { id: 3, name: 'Postponed' },
	location: { id: 2, name: 'Shark Stadium' },
	season: mockSeason
};

export const mockForfeitGame: Game = {
	id: 104,
	date: '2026-04-09T19:00:00',
	hostTeam: mockTeamA,
	visitingTeam: mockTeamB,
	scoreHost: 7,
	scoreVisitor: 0,
	status: { id: 4, name: 'Forfeit' },
	location: mockLocation,
	season: mockSeason
};

export const mockNews: News = {
	id: 201,
	title: 'Season Opener Recap',
	contents: '<p>Great game last night!</p>',
	date: '2026-04-08T12:00:00',
	edited: null,
	isHidden: false,
	authorId: 1,
	authorInvitationId: 1,
	author: { id: 1, name: 'John Doe' }
};

export const mockHiddenNews: News = {
	id: 202,
	title: 'Draft Post',
	contents: '<p>Work in progress</p>',
	date: '2026-04-09T10:00:00',
	edited: null,
	isHidden: true,
	authorId: 1,
	authorInvitationId: 1,
	author: { id: 1, name: 'John Doe' }
};

export const mockStandings: StandingsEntry[] = [
	{
		team: mockTeamA,
		gamesPlayed: 10,
		wins: 7,
		losses: 2,
		ties: 1,
		points: 15,
		runsScored: 45,
		runsAllowed: 30,
		runDifferential: 15,
		record: '7-2-1',
		homeRecord: '4-1-0',
		awayRecord: '3-1-1',
		streak: 'W3'
	},
	{
		team: mockTeamB,
		gamesPlayed: 10,
		wins: 4,
		losses: 5,
		ties: 1,
		points: 9,
		runsScored: 30,
		runsAllowed: 35,
		runDifferential: -5,
		record: '4-5-1',
		homeRecord: '2-3-0',
		awayRecord: '2-2-1',
		streak: 'L2'
	}
];
