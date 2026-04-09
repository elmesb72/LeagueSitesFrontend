import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import HomepageGame from './HomepageGame.svelte';
import { mockUpcomingGame, mockPlayedGame, mockPostponedGame, mockForfeitGame } from '../tests/mocks';

describe('HomepageGame', () => {
	test('renders upcoming game with time and location', () => {
		render(HomepageGame, { props: { game: mockUpcomingGame } });
		expect(screen.getByText('Springfield')).toBeInTheDocument();
		expect(screen.getByText('Isotopes')).toBeInTheDocument();
		expect(screen.getByText('Shelbyville')).toBeInTheDocument();
		expect(screen.getByText('Sharks')).toBeInTheDocument();
		expect(screen.getByText('Diamond Park')).toBeInTheDocument();
	});

	test('renders played game with scores', () => {
		render(HomepageGame, { props: { game: mockPlayedGame } });
		expect(screen.getByText('5')).toBeInTheDocument();
		expect(screen.getByText('3')).toBeInTheDocument();
	});

	test('renders postponed game with PPD indicator', () => {
		render(HomepageGame, { props: { game: mockPostponedGame } });
		expect(screen.getByText('(PPD)')).toBeInTheDocument();
	});

	test('renders forfeit game with FF indicator', () => {
		render(HomepageGame, { props: { game: mockForfeitGame } });
		expect(screen.getByText('0 (FF)')).toBeInTheDocument();
		expect(screen.getByText('7')).toBeInTheDocument();
	});

	test('does not render cancelled games', () => {
		const cancelledGame = { ...mockUpcomingGame, status: 'Cancelled' };
		const { container } = render(HomepageGame, { props: { game: cancelledGame } });
		expect(container.querySelector('.game')).toBeNull();
	});
});
