import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, test, expect, vi } from 'vitest';
import LeagueLogo from './LeagueLogo.svelte';

// The logo is a plain <img> so the browser can cache it and it never flickers;
// when the tenant has no logo file the image errors and the league name takes
// its place (1010f66).
describe('LeagueLogo', () => {
	test('renders the tenant logo image with the alt text', () => {
		const { container } = render(LeagueLogo, { props: { alt: 'My League' } });
		const img = container.querySelector('img.league-logo');
		expect(img).not.toBeNull();
		expect(img?.getAttribute('src')).toBe('/images/logo.webp');
		expect(img?.getAttribute('alt')).toBe('My League');
		expect(screen.queryByText('My League')).toBeNull();
	});

	test('falls back to the league name when the image fails to load', async () => {
		const info = vi.spyOn(console, 'info').mockImplementation(() => {});
		const { container } = render(LeagueLogo, { props: { alt: 'My League' } });
		await fireEvent.error(container.querySelector('img.league-logo')!);

		expect(container.querySelector('img')).toBeNull();
		expect(screen.getByText('My League')).toHaveClass('league-logo-fallback');
		info.mockRestore();
	});
});
