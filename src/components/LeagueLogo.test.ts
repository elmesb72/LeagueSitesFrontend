import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import LeagueLogo from './LeagueLogo.svelte';

describe('LeagueLogo', () => {
	test('renders object element with logo source', () => {
		const { container } = render(LeagueLogo, { props: { alt: 'My League' } });
		const obj = container.querySelector('object');
		expect(obj).not.toBeNull();
		expect(obj?.getAttribute('data')).toBe('/images/logo.webp');
	});

	test('sets title attribute for accessibility', () => {
		const { container } = render(LeagueLogo, { props: { alt: 'My League' } });
		const obj = container.querySelector('object');
		expect(obj?.getAttribute('title')).toBe('My League');
	});

	test('renders alt text as fallback content', () => {
		render(LeagueLogo, { props: { alt: 'My League' } });
		expect(screen.getByText('My League')).toBeInTheDocument();
	});
});
