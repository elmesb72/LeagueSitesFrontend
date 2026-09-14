import { render, fireEvent } from '@testing-library/svelte';
import { describe, test, expect, vi } from 'vitest';
import TeamLogoLarge from './TeamLogoLarge.svelte';
import { mockTeamA } from '../tests/mocks';

// Same pattern as TeamLogoMedium, at the large size used on the team page.
describe('TeamLogoLarge', () => {
	test('renders the large team image with an accessible alt', () => {
		const { container } = render(TeamLogoLarge, { props: { team: mockTeamA } });
		const img = container.querySelector('img.team-logo-lg');
		expect(img?.getAttribute('src')).toBe('/images/teams/1-lg.webp');
		expect(img?.getAttribute('alt')).toBe('SPR logo');
		expect(container.querySelector('.team-logo-fallback')).toBeNull();
	});

	test('falls back to the abbreviation in team colours when the image fails', async () => {
		const info = vi.spyOn(console, 'info').mockImplementation(() => {});
		const { container } = render(TeamLogoLarge, { props: { team: mockTeamA } });
		await fireEvent.error(container.querySelector('img.team-logo-lg')!);

		const fallback = container.querySelector('.team-logo-fallback');
		expect(container.querySelector('img')).toBeNull();
		expect(fallback?.textContent?.trim()).toBe('SPR');
		expect(fallback?.getAttribute('aria-label')).toBe('SPR logo');
		// jsdom normalises inline colours, so read them back as the browser would
		const style = (fallback as HTMLElement).style;
		expect(style.backgroundColor).toBe('rgb(0, 51, 102)');
		expect(style.color).toBe('rgb(255, 255, 255)');
		info.mockRestore();
	});
});
