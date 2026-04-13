import { render } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import TeamLogoMedium from './TeamLogoMedium.svelte';
import { mockTeamA } from '../tests/mocks';

describe('TeamLogoMedium', () => {
	test('renders object element with team image', () => {
		const { container } = render(TeamLogoMedium, { props: { team: mockTeamA } });
		const obj = container.querySelector('object');
		expect(obj?.getAttribute('data')).toBe('/images/teams/1-md.webp');
	});

	test('renders fallback with team abbreviation', () => {
		const { container } = render(TeamLogoMedium, { props: { team: mockTeamA } });
		const fallback = container.querySelector('.team-logo-md div');
		expect(fallback?.textContent).toBe('SPR');
	});

	test('applies team colors to fallback', () => {
		const { container } = render(TeamLogoMedium, { props: { team: mockTeamA } });
		const fallback = container.querySelector('.team-logo-md div');
		expect(fallback?.getAttribute('style')).toContain('background-color');
	});
});
