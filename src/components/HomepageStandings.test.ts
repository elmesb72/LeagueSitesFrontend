import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import HomepageStandings from './HomepageStandings.svelte';
import { mockStandings } from '../tests/mocks';

describe('HomepageStandings', () => {
	test('renders standings table with team data', () => {
		render(HomepageStandings, { props: { standings: mockStandings } });
		expect(screen.getByText('Standings')).toBeInTheDocument();
		expect(screen.getByText('SPR')).toBeInTheDocument();
		expect(screen.getByText('SHL')).toBeInTheDocument();
	});

	test('renders column headers', () => {
		render(HomepageStandings, { props: { standings: mockStandings } });
		expect(screen.getByText('GP')).toBeInTheDocument();
		expect(screen.getByText('W')).toBeInTheDocument();
		expect(screen.getByText('L')).toBeInTheDocument();
		expect(screen.getByText('T')).toBeInTheDocument();
		expect(screen.getByText('Pts')).toBeInTheDocument();
		expect(screen.getByText('RF')).toBeInTheDocument();
		expect(screen.getByText('RA')).toBeInTheDocument();
		expect(screen.getByText('Diff')).toBeInTheDocument();
	});

	test('shows positive run differential with green class and plus sign', () => {
		render(HomepageStandings, { props: { standings: mockStandings } });
		const positiveCell = screen.getByText('+15');
		expect(positiveCell).toBeInTheDocument();
		expect(positiveCell.classList.contains('green')).toBe(true);
	});

	test('shows negative run differential with red class', () => {
		render(HomepageStandings, { props: { standings: mockStandings } });
		const negativeCell = screen.getByText('-5');
		expect(negativeCell).toBeInTheDocument();
		expect(negativeCell.classList.contains('red')).toBe(true);
	});

	test('renders stats correctly for first team', () => {
		render(HomepageStandings, { props: { standings: mockStandings } });
		// Team A: GP=10, W=7, L=2, T=1, Pts=15, RF=45, RA=30
		expect(screen.getByText('45')).toBeInTheDocument();
		expect(screen.getAllByText('30').length).toBeGreaterThanOrEqual(1);
	});
});
