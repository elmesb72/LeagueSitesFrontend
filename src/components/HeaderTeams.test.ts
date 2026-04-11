import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import HeaderTeams from './HeaderTeams.svelte';
import { mockTeamA, mockTeamB } from '../tests/mocks';

describe('HeaderTeams', () => {
	test('renders a list item for each team', () => {
		const { container } = render(HeaderTeams, { props: { teams: [mockTeamA, mockTeamB] } });
		const items = container.querySelectorAll('li');
		expect(items.length).toBe(2);
	});

	test('renders team abbreviations', () => {
		render(HeaderTeams, { props: { teams: [mockTeamA, mockTeamB] } });
		expect(screen.getByText('SPR')).toBeInTheDocument();
		expect(screen.getByText('SHL')).toBeInTheDocument();
	});

	test('links to team pages', () => {
		render(HeaderTeams, { props: { teams: [mockTeamA, mockTeamB] } });
		const links = screen.getAllByRole('link');
		expect(links.some(l => l.getAttribute('href') === '/Team/SPR')).toBe(true);
		expect(links.some(l => l.getAttribute('href') === '/Team/SHL')).toBe(true);
	});

	test('renders empty list when no teams', () => {
		const { container } = render(HeaderTeams, { props: { teams: [] } });
		const items = container.querySelectorAll('li');
		expect(items.length).toBe(0);
	});
});
