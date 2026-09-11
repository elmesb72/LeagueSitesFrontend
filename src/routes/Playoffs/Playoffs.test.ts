import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import PlayoffsPage from './+page.svelte';
import { mockPlayoffsData, emptyPlayoffsData, roundRobinOnlyPlayoffsData } from '../../tests/playoffMocks';

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
		// Only the two resolved series should have "vs" headings
		const detailHeadings = seriesDetails.filter((el) => el.tagName === 'H2');
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
