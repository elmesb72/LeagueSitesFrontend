import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import PlayoffsPage from './+page.svelte';
import { mockPlayoffsData, emptyPlayoffsData } from '../../tests/playoffMocks';

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

	test('shows no-playoffs message when data is null', () => {
		render(PlayoffsPage, { props: { data: { playoffs: null } } });
		expect(screen.getByText(/Playoffs/)).toBeInTheDocument();
	});

	test('does not render tournament when no brackets', () => {
		const { container } = render(PlayoffsPage, { props: { data: { playoffs: emptyPlayoffsData } } });
		expect(container.querySelector('.tournament')).toBeNull();
	});
});
