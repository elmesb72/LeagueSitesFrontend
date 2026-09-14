import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import EditTournamentPage from './[id]/+page.svelte';
import { goto } from '$app/navigation';
import {
	makeBracket,
	makeTournamentDetail,
	makeUnresolvedSeries,
	makePool
} from '../../../../tests/tournamentMocks';

const siteConfig = {
	siteName: 'Test League',
	shortName: 'TL',
	home: { aboutBlurb: '', executives: {}, socials: {}, links: {}, information: {} },
	apiKeys: { googleMaps: '' }
};

const cupSeason = {
	id: 302,
	year: 2027,
	subseason: 'Tournament',
	name: '2027 Canada Day Cup',
	startDate: '2027-07-01'
};

/** A cup with a bracket whose only series has no game scheduled, and a pool with no games. */
function emptyCup() {
	return makeTournamentDetail({
		id: 31,
		season: cupSeason,
		brackets: [
			makeBracket({ rounds: [{ id: 20, name: 'Final', series: [makeUnresolvedSeries()] }] })
		],
		roundRobins: [makePool({ games: [] })]
	});
}

describe('Tournament page — mid-season tournaments', () => {
	beforeEach(() => {
		vi.mocked(goto).mockClear();
		vi.stubGlobal(
			'confirm',
			vi.fn(() => true)
		);
	});
	afterEach(() => vi.unstubAllGlobals());

	test('a cup links to its own public page and can be deleted while it has no games', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => ({ ok: true, text: async () => '' }))
		);
		render(EditTournamentPage, {
			props: { data: { redirect: null, tournament: emptyCup(), siteConfig } }
		});

		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('2027 Canada Day Cup');
		expect(screen.getByRole('link', { name: 'See what the public page shows' })).toHaveAttribute(
			'href',
			'/Tournaments/31'
		);

		const button = screen.getByRole('button', { name: 'Delete this tournament' });
		expect(button).toBeEnabled();
		await fireEvent.click(button);
		await waitFor(() => expect(goto).toHaveBeenCalledWith('/Executive', { invalidateAll: true }));
		expect(vi.mocked(fetch).mock.calls[0][0]).toBe('/api/Executive/Season/Tournament/302');
		expect((vi.mocked(fetch).mock.calls[0][1] as RequestInit).method).toBe('DELETE');
	});

	test('the delete control is disabled and explains itself while games are scheduled', () => {
		// makeTournamentDetail's default bracket has decided quarter-finals with games.
		const withGames = makeTournamentDetail({ id: 31, season: cupSeason });
		render(EditTournamentPage, {
			props: { data: { redirect: null, tournament: withGames, siteConfig } }
		});

		expect(screen.getByRole('button', { name: 'Delete this tournament' })).toBeDisabled();
		expect(screen.getByText(/scheduled in this tournament/)).toBeInTheDocument();
	});

	test('the playoffs link to the playoffs page and cannot be deleted here', () => {
		render(EditTournamentPage, {
			props: { data: { redirect: null, tournament: makeTournamentDetail(), siteConfig } }
		});
		expect(screen.getByRole('link', { name: 'See what the public page shows' })).toHaveAttribute(
			'href',
			'/Playoffs?year=2026'
		);
		expect(screen.queryByRole('button', { name: 'Delete this tournament' })).toBeNull();
	});
});
