import { render } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import TeamLogoLarge from './TeamLogoLarge.svelte';
import { mockTeamA } from '../tests/mocks';

describe('TeamLogoLarge', () => {
	test('renders object element with team image', () => {
		const { container } = render(TeamLogoLarge, { props: { team: mockTeamA } });
		const obj = container.querySelector('object');
		expect(obj?.getAttribute('data')).toBe('/images/teams/1-lg.webp');
	});

	test('renders fallback with team abbreviation', () => {
		const { container } = render(TeamLogoLarge, { props: { team: mockTeamA } });
		const fallback = container.querySelector('.team-logo-lg div');
		expect(fallback?.textContent).toBe('SPR');
	});

	test('applies team colors to fallback', () => {
		const { container } = render(TeamLogoLarge, { props: { team: mockTeamA } });
		const fallback = container.querySelector('.team-logo-lg div');
		expect(fallback?.getAttribute('style')).toContain('background-color');
	});
});
