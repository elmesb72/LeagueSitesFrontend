import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import HomePage from './+page.svelte';

const siteConfig = {
	siteName: 'Test League',
	shortName: 'TL',
	home: { aboutBlurb: '', executives: {}, socials: {}, links: {}, information: {} },
	apiKeys: { googleMaps: '' }
};

const base = {
	games: [],
	news: [],
	standings: [],
	isPlayoffs: false,
	tournaments: [],
	canPost: false,
	siteConfig,
	user: { isAuthenticated: false, name: '', claims: [] },
	teams: []
};

describe('Homepage — tournament callouts', () => {
	test('a cup gets a callout like the playoffs one, linking to its page', () => {
		render(HomePage, {
			props: {
				data: {
					...base,
					isPlayoffs: true,
					tournaments: [
						{
							seasonId: 9,
							tournamentId: 31,
							name: '2026 Canada Day Cup',
							shortName: 'Canada Day Cup',
							kind: 'tournament'
						}
					]
				}
			}
		});
		// Mobile and desktop variants of each callout.
		expect(screen.getAllByRole('link', { name: /Playoffs/ }).length).toBeGreaterThanOrEqual(2);
		const cupLinks = screen.getAllByRole('link', { name: /Canada Day Cup/ });
		expect(cupLinks.length).toBeGreaterThanOrEqual(2);
		for (const link of cupLinks) expect(link).toHaveAttribute('href', '/Tournaments/31');
	});

	test('no callout without tournaments', () => {
		render(HomePage, { props: { data: { ...base } } });
		expect(screen.queryByRole('link', { name: /Canada Day Cup/ })).toBeNull();
		expect(screen.queryByRole('link', { name: /^Playoffs/ })).toBeNull();
	});
});
