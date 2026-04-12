import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import GamePage from './[id]/+page.svelte';
import { mockTeamA, mockTeamB, mockPlayedGame, mockUpcomingGame, mockForfeitGame } from '../../tests/mocks';

const baseData = (game: typeof mockPlayedGame, canEdit = false) => ({
	gameData: { game, canEdit },
	siteConfig: { siteName: 'Test League', shortName: 'TL', home: { aboutBlurb: '', executives: {}, socials: {}, links: {}, information: {} }, apiKeys: { googleMaps: '' } }
});

describe('Game Page', () => {
	test('renders team names for played game', () => {
		render(GamePage, { props: { data: baseData(mockPlayedGame) } });
		expect(screen.getByText(/Sharks 3, Isotopes 5/)).toBeInTheDocument();
	});

	test('renders @ matchup for upcoming game', () => {
		render(GamePage, { props: { data: baseData(mockUpcomingGame) } });
		expect(screen.getByText(/Sharks @ Isotopes/)).toBeInTheDocument();
	});

	test('renders upcoming message', () => {
		render(GamePage, { props: { data: baseData(mockUpcomingGame) } });
		expect(screen.getByText(/not yet been played or scored/)).toBeInTheDocument();
	});

	test('renders forfeit message', () => {
		render(GamePage, { props: { data: baseData(mockForfeitGame) } });
		expect(screen.getByText(/forfeit/i)).toBeInTheDocument();
	});

	test('renders location link', () => {
		render(GamePage, { props: { data: baseData(mockPlayedGame) } });
		const link = screen.getByText('Diamond Park');
		expect(link.closest('a')?.getAttribute('href')).toBe('/Locations/#Diamond Park');
	});

	test('renders team logo images', () => {
		const { container } = render(GamePage, { props: { data: baseData(mockPlayedGame) } });
		const imgs = container.querySelectorAll('.game-team img');
		expect(imgs.length).toBe(2);
	});

	test('renders team links', () => {
		render(GamePage, { props: { data: baseData(mockPlayedGame) } });
		const links = screen.getAllByRole('link');
		expect(links.some(l => l.getAttribute('href') === '/Team/SPR')).toBe(true);
		expect(links.some(l => l.getAttribute('href') === '/Team/SHL')).toBe(true);
	});

	test('shows edit link when canEdit is true', () => {
		render(GamePage, { props: { data: baseData(mockPlayedGame, true) } });
		expect(screen.getByText('Edit this game')).toBeInTheDocument();
	});

	test('hides edit link when canEdit is false', () => {
		render(GamePage, { props: { data: baseData(mockPlayedGame, false) } });
		expect(screen.queryByText('Edit this game')).toBeNull();
	});

	test('shows not found when gameData is null', () => {
		render(GamePage, { props: { data: { gameData: null, siteConfig: baseData(mockPlayedGame).siteConfig } } });
		expect(screen.getByText('Game Not Found')).toBeInTheDocument();
	});

	test('renders game date and time', () => {
		render(GamePage, { props: { data: baseData(mockPlayedGame) } });
		expect(screen.getByText(/April 8, 2026/)).toBeInTheDocument();
	});

	test('does not show upcoming message for played games', () => {
		render(GamePage, { props: { data: baseData(mockPlayedGame) } });
		expect(screen.queryByText(/not yet been played/)).toBeNull();
	});
});
