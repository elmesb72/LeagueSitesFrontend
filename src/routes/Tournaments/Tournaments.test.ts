import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import TournamentsPage from './+page.svelte';
import TournamentPage from './[id]/+page.svelte';
import type { TournamentData, TournamentSummary } from '$lib/models/Playoffs';
import { makeFourTeamBracket, makePlayoffs, teamAlphas } from '../../tests/playoffMocks';

const season = {
	id: 302,
	year: 2027,
	subseason: 'Tournament',
	name: '2027 Canada Day Cup',
	startDate: '2027-07-01T00:00:00'
};

const playoffsSummary: TournamentSummary = {
	id: 30,
	name: '2027 Playoffs',
	kind: 'playoffs',
	season: {
		...season,
		id: 301,
		subseason: 'Playoffs',
		name: '2027 Playoffs',
		startDate: '2027-08-20T00:00:00'
	},
	startDate: '2027-08-20T00:00:00',
	firstGame: null,
	lastGame: null,
	gamesScheduled: 0,
	gamesPlayed: 0,
	decided: false,
	titles: []
};

const cupSummary: TournamentSummary = {
	id: 31,
	name: '2027 Canada Day Cup',
	kind: 'tournament',
	season,
	startDate: '2027-07-01T00:00:00',
	firstGame: '2027-07-01T19:00:00',
	lastGame: '2027-07-03T21:00:00',
	gamesScheduled: 3,
	gamesPlayed: 3,
	decided: true,
	titles: [{ label: 'Final', team: teamAlphas }]
};

function cup(overrides: Partial<TournamentData> = {}): TournamentData {
	return {
		...makePlayoffs([makeFourTeamBracket({ played: 'all', name: 'Final' })]),
		id: 31,
		name: '2027 Canada Day Cup',
		kind: 'tournament',
		season,
		...overrides
	};
}

describe('Tournaments index', () => {
	test('lists the year, playoffs first, each linking to its page with progress', () => {
		render(TournamentsPage, {
			props: {
				data: {
					tournaments: [playoffsSummary, cupSummary],
					available: true,
					years: [2027, 2026],
					year: 2027
				}
			}
		});
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('2027 Tournaments');
		const names = screen.getAllByRole('link', { name: /Playoffs|Canada Day Cup/ });
		expect(names[0]).toHaveTextContent('Playoffs');
		expect(names[0]).toHaveAttribute('href', '/Playoffs?year=2027');
		expect(names[1]).toHaveTextContent('Canada Day Cup');
		expect(names[1]).toHaveAttribute('href', '/Tournaments/31');
		expect(screen.getByText('No games scheduled yet')).toBeInTheDocument();
		expect(screen.getByText('Won by Alpha City Alphas')).toBeInTheDocument();
		expect(screen.getByRole('navigation', { name: 'Tournament year' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /2026/ })).toHaveAttribute(
			'href',
			'/Tournaments?year=2026'
		);
	});

	test('says so when the year has none, and when the backend is down', () => {
		const empty = render(TournamentsPage, {
			props: { data: { tournaments: [], available: true, years: [2027], year: 2027 } }
		});
		expect(screen.getByText('No tournaments in 2027 yet.')).toBeInTheDocument();
		empty.unmount();

		render(TournamentsPage, {
			props: { data: { tournaments: [], available: false, years: [], year: null } }
		});
		expect(screen.getByText(/temporarily unavailable/)).toBeInTheDocument();
	});
});

describe('Tournament page', () => {
	test('renders the cup under its own name, with the banner worded for the cup', () => {
		const tournament = cup();
		render(TournamentPage, {
			props: {
				data: { tournament, state: 'ok', editUrl: null, others: [playoffsSummary, cupSummary] }
			}
		});
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('2027 Canada Day Cup');
		expect(screen.getByText('2027 Canada Day Cup Champions')).toBeInTheDocument();
		expect(document.querySelector('.tournament-bracket')).not.toBeNull();
		// The strip points at the playoffs but not at this cup itself.
		expect(screen.getByRole('link', { name: 'Playoffs' })).toHaveAttribute(
			'href',
			'/Playoffs?year=2027'
		);
		expect(screen.queryByRole('link', { name: 'Canada Day Cup' })).toBeNull();
	});

	test('names the stage when the cup has several marked brackets', () => {
		const tournament = cup({
			brackets: [
				makeFourTeamBracket({ played: 'all', name: 'Main' }),
				makeFourTeamBracket({ played: 'all', name: 'B Final' })
			]
		});
		render(TournamentPage, {
			props: { data: { tournament, state: 'ok', editUrl: null, others: [] } }
		});
		expect(screen.getByText('2027 Canada Day Cup \u00b7 Main Champions')).toBeInTheDocument();
		expect(screen.getByText('2027 Canada Day Cup \u00b7 B Final Champions')).toBeInTheDocument();
	});

	test('offers executives the edit pen', () => {
		render(TournamentPage, {
			props: {
				data: {
					tournament: cup(),
					state: 'ok',
					editUrl: '/Executive/Edit/Tournament/31',
					others: []
				}
			}
		});
		expect(screen.getByRole('link', { name: 'Edit the 2027 Canada Day Cup' })).toHaveAttribute(
			'href',
			'/Executive/Edit/Tournament/31'
		);
	});

	test('tells apart unavailable, missing and not-started', () => {
		const down = render(TournamentPage, {
			props: { data: { tournament: null, state: 'unavailable', editUrl: null, others: [] } }
		});
		expect(screen.getByText(/temporarily unavailable/)).toBeInTheDocument();
		down.unmount();

		const missing = render(TournamentPage, {
			props: { data: { tournament: null, state: 'notFound', editUrl: null, others: [] } }
		});
		expect(screen.getByText(/no tournament here/)).toBeInTheDocument();
		missing.unmount();

		render(TournamentPage, {
			props: {
				data: {
					tournament: cup({ brackets: [], roundRobins: [] }),
					state: 'empty',
					editUrl: null,
					others: []
				}
			}
		});
		expect(screen.getByText(/2027 Canada Day Cup has not started yet/)).toBeInTheDocument();
	});
});
