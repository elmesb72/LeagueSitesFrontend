import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import PlayerPage from './[code]/+page.svelte';
import type { PlayerPageData } from '$lib/models/PlayerPage';
import { mockTeamA } from '../../tests/mocks';

const mockPlayerData: PlayerPageData = {
	player: {
		id: 50,
		firstName: 'Homer',
		lastName: 'Simpson',
		name: 'Homer Simpson',
		number: '7',
		shortCode: 'simps01',
		bio: {
			bats: 'Right',
			throws: 'Right',
			positions: '1B, OF',
			height: 183,
			heightImperial: 72,
			weight: 109,
			weightImperial: 240,
			birthdate: '1990-05-12T00:00:00',
			from: 'Springfield',
			referredBy: 'Ned Flanders'
		},
		invitations: [{ team: mockTeamA, status: { name: 'Active' } }],
		socials: [{ account: 'homersimpson', platform: { name: 'Twitter' } }]
	},
	referredBy: { id: 51, name: 'Ned Flanders', shortCode: 'fland01' }
};

const baseData = {
	playerData: mockPlayerData,
	siteConfig: { siteName: 'Test League', shortName: 'TL', home: { aboutBlurb: '', executives: {}, socials: {}, links: {}, information: {} }, apiKeys: { googleMaps: '' } }
};

describe('Player Page', () => {
	test('renders player name', () => {
		render(PlayerPage, { props: { data: baseData } });
		expect(screen.getByText('Homer Simpson')).toBeInTheDocument();
	});

	test('renders jersey number', () => {
		render(PlayerPage, { props: { data: baseData } });
		expect(screen.getByText('7')).toBeInTheDocument();
	});

	test('renders team affiliation with link', () => {
		render(PlayerPage, { props: { data: baseData } });
		const teamLink = screen.getByText('Springfield Isotopes');
		expect(teamLink.closest('a')?.getAttribute('href')).toBe('/Team/SPR');
	});

	test('renders positions', () => {
		render(PlayerPage, { props: { data: baseData } });
		expect(screen.getByText(/1B, OF/)).toBeInTheDocument();
	});

	test('renders bats and throws', () => {
		render(PlayerPage, { props: { data: baseData } });
		expect(screen.getByText(/Bats:/)).toBeInTheDocument();
		expect(screen.getByText(/Throws:/)).toBeInTheDocument();
	});

	test('renders height and weight', () => {
		render(PlayerPage, { props: { data: baseData } });
		expect(screen.getByText(/6'0"/)).toBeInTheDocument();
		expect(screen.getByText(/240lbs/)).toBeInTheDocument();
	});

	test('renders hometown', () => {
		render(PlayerPage, { props: { data: baseData } });
		expect(screen.getByText(/From: Springfield/)).toBeInTheDocument();
	});

	test('renders birthdate', () => {
		render(PlayerPage, { props: { data: baseData } });
		expect(screen.getByText(/May 12, 1990/)).toBeInTheDocument();
	});

	test('renders referred by with link when player exists', () => {
		render(PlayerPage, { props: { data: baseData } });
		const link = screen.getByText('Ned Flanders');
		expect(link.closest('a')?.getAttribute('href')).toBe('/Player/fland01');
	});

	test('renders referred by as text when no matching player', () => {
		const noRef = { ...baseData, playerData: { ...mockPlayerData, referredBy: null } };
		const { container } = render(PlayerPage, { props: { data: noRef } });
		const recruitedText = container.querySelector('p');
		const allPs = container.querySelectorAll('p');
		const recruitedP = Array.from(allPs).find((p) => p.textContent?.includes('Recruited by'));
		expect(recruitedP?.textContent).toContain('Ned Flanders');
		expect(recruitedP?.querySelector('a')).toBeNull();
	});

	test('renders social media link', () => {
		const { container } = render(PlayerPage, { props: { data: baseData } });
		const socialImg = container.querySelector('.player-socials img');
		expect(socialImg).not.toBeNull();
	});

	test('renders stats placeholder', () => {
		render(PlayerPage, { props: { data: baseData } });
		expect(screen.getAllByText('Coming Soon').length).toBe(2);
	});

	test('shows not found when no player data', () => {
		render(PlayerPage, { props: { data: { ...baseData, playerData: null } } });
		expect(screen.getByText('Player Not Found')).toBeInTheDocument();
	});

	test('hides number when null', () => {
		const noNumber = {
			...baseData,
			playerData: { ...mockPlayerData, player: { ...mockPlayerData.player, number: null } }
		};
		const { container } = render(PlayerPage, { props: { data: noNumber } });
		expect(container.querySelector('.player-number')).toBeNull();
	});

	test('handles player with no bio', () => {
		const noBio = {
			...baseData,
			playerData: { ...mockPlayerData, player: { ...mockPlayerData.player, bio: null } }
		};
		render(PlayerPage, { props: { data: noBio } });
		expect(screen.getByText('Homer Simpson')).toBeInTheDocument();
		expect(screen.queryByText(/Position/)).toBeNull();
	});
});
