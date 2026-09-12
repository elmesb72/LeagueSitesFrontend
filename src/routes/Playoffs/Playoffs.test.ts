import { render, screen } from '@testing-library/svelte';
import { describe, test, expect, vi } from 'vitest';
import PlayoffsPage from './+page.svelte';
import {
	mockPlayoffsData,
	emptyPlayoffsData,
	roundRobinOnlyPlayoffsData,
	makeFourTeamBracket,
	makePlayoffs,
	makePlayedGame
} from '../../tests/playoffMocks';

describe('Playoffs Page', () => {
	test('renders year in heading', () => {
		render(PlayoffsPage, { props: { data: { playoffs: mockPlayoffsData } } });
		expect(screen.getByText('2026 Playoffs')).toBeInTheDocument();
	});

	test('renders bracket when data exists', () => {
		const { container } = render(PlayoffsPage, { props: { data: { playoffs: mockPlayoffsData } } });
		expect(container.querySelector('.tournament-bracket')).not.toBeNull();
	});

	test('renders round robin when data exists', () => {
		render(PlayoffsPage, { props: { data: { playoffs: mockPlayoffsData } } });
		expect(screen.getByText('Pool A Round Robin Standings')).toBeInTheDocument();
	});

	test('renders series details for resolved matchups', () => {
		render(PlayoffsPage, { props: { data: { playoffs: mockPlayoffsData } } });
		// Both resolved series have same teams, so there are 2 detail headings
		expect(screen.getAllByText('#1 Alphas vs #4 Betas').length).toBe(2);
	});

	test('does not render series detail for TBD matchups', () => {
		render(PlayoffsPage, { props: { data: { playoffs: mockPlayoffsData } } });
		// The TBD series (spot1=winner, spot2=null) should not render a detail section
		const seriesDetails = screen.queryAllByText(/vs/);
		// Only the two resolved series should have "vs" headings (h3 under the bracket's h2)
		const detailHeadings = seriesDetails.filter((el) => el.tagName === 'H3');
		expect(detailHeadings.length).toBe(2);
	});

	test('shows no-playoffs message when brackets are empty', () => {
		render(PlayoffsPage, { props: { data: { playoffs: emptyPlayoffsData } } });
		expect(screen.getByText(/playoffs have not yet started/)).toBeInTheDocument();
	});

	test('round-robin-only playoffs render the round robin, not the empty state', () => {
		const { container } = render(PlayoffsPage, {
			props: { data: { playoffs: roundRobinOnlyPlayoffsData } }
		});
		expect(screen.getByText('Pool A Round Robin Standings')).toBeInTheDocument();
		expect(screen.queryByText(/playoffs have not yet started/)).toBeNull();
		// No empty bracket container should render either
		expect(container.querySelector('.tournament')).toBeNull();
	});

	test('shows no-playoffs message when data is null', () => {
		render(PlayoffsPage, { props: { data: { playoffs: null } } });
		expect(screen.getByText(/Playoffs/)).toBeInTheDocument();
	});

	test('does not render tournament when no brackets', () => {
		const { container } = render(PlayoffsPage, { props: { data: { playoffs: emptyPlayoffsData } } });
		expect(container.querySelector('.tournament')).toBeNull();
	});
});

describe('Playoffs Page (year navigation)', () => {
	const years = [2026, 2025, 2024, 2023];

	test('offers a year picker with the shown year selected, and links to the neighbouring years', () => {
		render(PlayoffsPage, { props: { data: { playoffs: mockPlayoffsData, years, year: null } } });
		const select = screen.getByLabelText('Choose a year') as HTMLSelectElement;
		expect(select.value).toBe('2026');
		expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['2026', '2025', '2024', '2023']);
		// 2026 is the newest, so only an "older" link
		expect(screen.getByRole('link', { name: /2025/ })).toHaveAttribute('href', '/Playoffs?year=2025');
		expect(screen.queryByRole('link', { name: /2027/ })).toBeNull();
	});

	test('a middle year gets both arrows', () => {
		const data = { playoffs: { ...mockPlayoffsData, season: { ...mockPlayoffsData.season, year: 2025 } }, years, year: 2025 };
		render(PlayoffsPage, { props: { data } });
		expect(screen.getByRole('link', { name: /2024/ })).toHaveAttribute('href', '/Playoffs?year=2024');
		expect(screen.getByRole('link', { name: /2026/ })).toHaveAttribute('href', '/Playoffs?year=2026');
	});

	test('hides the picker when there is only one season to choose from', () => {
		render(PlayoffsPage, { props: { data: { playoffs: mockPlayoffsData, years: [2026], year: null } } });
		expect(screen.queryByLabelText('Choose a year')).toBeNull();
	});

	test('a year with no playoffs keeps the year in the heading and says so', () => {
		render(PlayoffsPage, { props: { data: { playoffs: null, years, year: 2023 } } });
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('2023 Playoffs');
		expect(screen.getByText('There are no playoffs recorded for 2023.')).toBeInTheDocument();
	});

	test('with nothing loaded at all the heading has no dangling year', () => {
		render(PlayoffsPage, { props: { data: { playoffs: null } } });
		expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Playoffs');
	});
});

describe('Playoffs Page (bracket overhaul)', () => {
	test('shows a champion banner for a decided historical bracket, naming the same team History would', () => {
		const bracket = makeFourTeamBracket({ played: 'all', historical: true });
		const { container } = render(PlayoffsPage, { props: { data: { playoffs: makePlayoffs([bracket]), state: 'ok' } } });
		const banner = container.querySelector('.playoff-champion')!;
		expect(banner).not.toBeNull();
		expect(banner.textContent).toContain('2026 Main Bracket Champions');
		expect(banner.textContent).toContain(bracket.winner!.fullName);
		expect(container.querySelector('.playoff-won-by')).toBeNull();
	});

	test('a decided bracket the league does not treat as a championship gets the quiet "won by" line', () => {
		const bracket = makeFourTeamBracket({ played: 'all', historical: false, name: 'Consolation' });
		const { container } = render(PlayoffsPage, { props: { data: { playoffs: makePlayoffs([bracket]), state: 'ok' } } });
		expect(container.querySelector('.playoff-champion')).toBeNull();
		expect(container.querySelector('.playoff-won-by')!.textContent).toContain('Consolation bracket won by');
	});

	test('no champion treatment while the bracket is undecided', () => {
		const { container } = render(PlayoffsPage, { props: { data: { playoffs: makePlayoffs([makeFourTeamBracket({ played: 'semis' })]), state: 'ok' } } });
		expect(container.querySelector('.playoff-champion')).toBeNull();
		expect(container.querySelector('.playoff-won-by')).toBeNull();
	});

	test('lists the next game of every live series under "Coming up", soonest first', () => {
		// The page uses the real clock; pin it before the fixture's games.
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-09-05T12:00:00'));
		const playoffs = makePlayoffs([makeFourTeamBracket({ played: 'semis', thirdPlace: true })]);
		render(PlayoffsPage, { props: { data: { playoffs, state: 'ok' } } });
		vi.useRealTimers();
		expect(screen.getByRole('heading', { name: 'Coming up' })).toBeInTheDocument();
		const items = screen.getAllByRole('listitem').filter((li) => li.closest('.playoff-coming-up'));
		expect(items).toHaveLength(2);
		expect(items[0].textContent).toContain('Finals, series 3');
		expect(items[0].textContent).toContain('Deltas at Betas');
		expect(items[1].textContent).toContain('Finals, series 4');
		expect(screen.getByRole('link', { name: 'Finals, series 3' })).toHaveAttribute('href', '#main-series-3');
	});

	test('omits "Coming up" when nothing is live', () => {
		render(PlayoffsPage, { props: { data: { playoffs: makePlayoffs([makeFourTeamBracket({ played: 'all' })]), state: 'ok' } } });
		expect(screen.queryByRole('heading', { name: 'Coming up' })).toBeNull();
	});

	test('groups series details under a heading per bracket, with ids the bracket links to', () => {
		const main = makeFourTeamBracket({ played: 'semis' });
		const b = makeFourTeamBracket({ played: 'semis', name: 'B Side', historical: false });
		const { container } = render(PlayoffsPage, { props: { data: { playoffs: makePlayoffs([main, b]), state: 'ok' } } });
		const groups = [...container.querySelectorAll('.tournament-items-bracket h2')].map((h) => h.textContent);
		expect(groups).toEqual(['Main Bracket · Series', 'B Side Bracket · Series']);
		expect(container.querySelector('#main-series-1')).not.toBeNull();
		expect(container.querySelector('#b-side-series-1')).not.toBeNull();
		// the bracket's series-number link points at the section
		expect(container.querySelector('#main-bracket a[href="#main-series-1"]')).not.toBeNull();
	});

	test('survives data the backend does not police: duplicate game numbers, bracket and pool names', () => {
		// The 2025 season: a final entered as "game 1" twice. Bracket and pool names
		// are only required to be present, so two "Main"s must not crash the page either.
		const main = makeFourTeamBracket({ played: 'all', historical: false });
		const final = main.rounds[1].series[0];
		final.games = [
			{ gameNumber: 1, game: makePlayedGame(490, final.spot1!.team!, final.spot2!.team!, 5, 3, '2025-09-15T20:30:00') },
			{ gameNumber: 1, game: makePlayedGame(491, final.spot2!.team!, final.spot1!.team!, 2, 6, '2025-09-17T20:30:00') }
		];
		const twin = makeFourTeamBracket({ played: 'semis', historical: false });
		const pool = { ...roundRobinOnlyPlayoffsData.roundRobins[0] };
		const playoffs = makePlayoffs([main, twin], [pool, { ...pool }]);
		const { container } = render(PlayoffsPage, { props: { data: { playoffs, state: 'ok', years: [2026, 2025], year: 2025 } } });
		expect(screen.getByText('2026 Playoffs')).toBeInTheDocument(); // the fixture season's year
		expect(container.querySelectorAll('.tournament-bracket')).toHaveLength(2);
		expect(container.querySelectorAll('.tournament-items-bracket')).toHaveLength(2);
		expect(container.querySelectorAll('.tournament-items-game')).toHaveLength(3 + 3 + 2 + 3 + 3 + 3);
	});
	test('switching years updates the same page instance', async () => {
		const first = makePlayoffs([makeFourTeamBracket({ played: 'semis' })]);
		const { container, rerender } = render(PlayoffsPage, {
			props: { data: { playoffs: first, state: 'ok', years: [2026, 2025], year: 2026 } }
		});
		// two semi-finals and a final whose teams are known
		expect(container.querySelectorAll('article.tournament-items-series')).toHaveLength(3);

		const second = makePlayoffs([makeFourTeamBracket({ played: 'all', thirdPlace: true, name: 'Cup' })]);
		second.season = { ...second.season, year: 2025, name: '2025 Playoffs' };
		await rerender({ data: { playoffs: second, state: 'ok', years: [2026, 2025], year: 2025 } });
		expect(screen.getByText('2025 Playoffs')).toBeInTheDocument();
		expect(screen.getByText('Cup Bracket')).toBeInTheDocument();
		expect(container.querySelectorAll('article.tournament-items-series')).toHaveLength(4);
		expect(container.querySelector('#cup-series-4')).not.toBeNull();
		expect(container.querySelector('#main-series-1')).toBeNull();
	});
	test('tells the difference between a failed backend, an unknown year, and an empty season', () => {
		render(PlayoffsPage, { props: { data: { playoffs: null, state: 'unavailable', years: [], year: null } } });
		expect(screen.getByText(/temporarily unavailable/)).toBeInTheDocument();
	});

	test('a requested year with no playoffs says so', () => {
		render(PlayoffsPage, { props: { data: { playoffs: null, state: 'notFound', years: [2026, 2019], year: 2019 } } });
		expect(screen.getByText('There are no playoffs recorded for 2019.')).toBeInTheDocument();
	});

	test('an empty season still says "not yet started"', () => {
		render(PlayoffsPage, { props: { data: { playoffs: emptyPlayoffsData, state: 'empty' } } });
		expect(screen.getByText(/playoffs have not yet started/)).toBeInTheDocument();
	});
});
