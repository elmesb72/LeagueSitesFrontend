import { render, fireEvent } from '@testing-library/svelte';
import { describe, test, expect, vi } from 'vitest';
import TeamLogoMedium from './TeamLogoMedium.svelte';
import { mockTeamA } from '../tests/mocks';

// Team logos are plain <img>s (no flicker, cacheable); a team without a logo
// file gets a coloured disc with its abbreviation once the image errors.
describe('TeamLogoMedium', () => {
	test('renders the medium team image with an accessible alt', () => {
		const { container } = render(TeamLogoMedium, { props: { team: mockTeamA } });
		const img = container.querySelector('img.team-logo-md');
		expect(img?.getAttribute('src')).toBe('/images/teams/1-md.webp');
		expect(img?.getAttribute('alt')).toBe('SPR logo');
		expect(container.querySelector('.team-logo-fallback')).toBeNull();
	});

	test('falls back to the abbreviation in team colours when the image fails', async () => {
		const info = vi.spyOn(console, 'info').mockImplementation(() => {});
		const { container } = render(TeamLogoMedium, { props: { team: mockTeamA } });
		await fireEvent.error(container.querySelector('img.team-logo-md')!);

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
