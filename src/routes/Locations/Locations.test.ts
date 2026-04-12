import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import LocationsPage from './+page.svelte';
import type { LocationWithGames } from '$lib/models/LocationWithGames';
import { mockTeamA, mockTeamB, mockPlayedGame, mockUpcomingGame } from '../../tests/mocks';

const mockLocation1: LocationWithGames = {
	id: 1,
	name: 'Diamond 1',
	formalName: 'Central Park',
	city: 'Springfield',
	address: '123 Main St',
	mapsPlaceId: 'ChIJ_test1',
	recentGames: [mockPlayedGame],
	upcomingGames: [mockUpcomingGame]
};

const mockLocation2: LocationWithGames = {
	id: 2,
	name: 'Diamond 2',
	formalName: 'Central Park',
	city: 'Springfield',
	address: '123 Main St',
	mapsPlaceId: 'ChIJ_test1',
	recentGames: [],
	upcomingGames: []
};

const mockLocation3: LocationWithGames = {
	id: 3,
	name: 'Shark Field',
	formalName: null,
	city: 'Shelbyville',
	address: null,
	mapsPlaceId: null,
	recentGames: [mockPlayedGame],
	upcomingGames: []
};

const allLocations = [mockLocation1, mockLocation2, mockLocation3];

describe('Locations Page', () => {
	test('renders city names as headings', () => {
		render(LocationsPage, { props: { data: { locations: allLocations, googleMapsKey: 'test-key' } } });
		const headings = screen.getAllByRole('heading', { level: 1 });
		expect(headings.some(h => h.textContent === 'Springfield')).toBe(true);
		expect(headings.some(h => h.textContent === 'Shelbyville')).toBe(true);
	});

	test('renders diamond names as subheadings', () => {
		render(LocationsPage, { props: { data: { locations: allLocations, googleMapsKey: 'test-key' } } });
		const subheadings = screen.getAllByRole('heading', { level: 2 });
		expect(subheadings.some(h => h.textContent === 'Diamond 1')).toBe(true);
		expect(subheadings.some(h => h.textContent === 'Diamond 2')).toBe(true);
		expect(subheadings.some(h => h.textContent === 'Shark Field')).toBe(true);
	});

	test('renders recent games section when games exist', () => {
		render(LocationsPage, { props: { data: { locations: [mockLocation1], googleMapsKey: '' } } });
		expect(screen.getByText('Recent Games')).toBeInTheDocument();
	});

	test('renders upcoming games section when games exist', () => {
		render(LocationsPage, { props: { data: { locations: [mockLocation1], googleMapsKey: '' } } });
		expect(screen.getByText('Upcoming Games')).toBeInTheDocument();
	});

	test('shows no-games message when location has no games', () => {
		render(LocationsPage, { props: { data: { locations: [mockLocation2], googleMapsKey: '' } } });
		expect(screen.getByText(/no games that have been played/)).toBeInTheDocument();
	});

	test('renders team names in game listings', () => {
		render(LocationsPage, { props: { data: { locations: [mockLocation1], googleMapsKey: '' } } });
		expect(screen.getAllByText(/Isotopes/).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText(/Sharks/).length).toBeGreaterThanOrEqual(1);
	});

	test('renders Google Maps iframe when key and placeId exist', () => {
		const { container } = render(LocationsPage, {
			props: { data: { locations: [mockLocation1], googleMapsKey: 'test-key' } }
		});
		const iframe = container.querySelector('iframe');
		expect(iframe).not.toBeNull();
		expect(iframe?.getAttribute('src')).toContain('place_id:ChIJ_test1');
		expect(iframe?.getAttribute('src')).toContain('key=test-key');
	});

	test('shows fallback info when no Google Maps key', () => {
		render(LocationsPage, {
			props: { data: { locations: [mockLocation1], googleMapsKey: '' } }
		});
		expect(screen.getByText('Central Park')).toBeInTheDocument();
		expect(screen.getByText('123 Main St')).toBeInTheDocument();
		expect(screen.getByText('Search on Google')).toBeInTheDocument();
	});

	test('shows fallback info when no placeId', () => {
		render(LocationsPage, {
			props: { data: { locations: [mockLocation3], googleMapsKey: 'test-key' } }
		});
		expect(screen.getByText('Search on Google')).toBeInTheDocument();
	});

	test('shows empty message when no locations', () => {
		render(LocationsPage, { props: { data: { locations: [], googleMapsKey: '' } } });
		expect(screen.getByText('No location data available.')).toBeInTheDocument();
	});
});
