import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import TeamHeader from './TeamHeader.svelte';
import { mockTeamA } from '../tests/mocks';

describe('TeamHeader', () => {
	test('renders team name', () => {
		render(TeamHeader, { props: { team: mockTeamA, record: '(7-2-1)', managers: ['John Doe'] } });
		expect(screen.getByText('Springfield Isotopes')).toBeInTheDocument();
	});

	test('renders record', () => {
		render(TeamHeader, { props: { team: mockTeamA, record: '(7-2-1)', managers: [] } });
		expect(screen.getByText('(7-2-1)')).toBeInTheDocument();
	});

	test('renders manager name', () => {
		render(TeamHeader, { props: { team: mockTeamA, record: '(0-0)', managers: ['Jane Smith'] } });
		expect(screen.getByText('Manager: Jane Smith')).toBeInTheDocument();
	});

	test('renders multiple managers', () => {
		render(TeamHeader, { props: { team: mockTeamA, record: '(0-0)', managers: ['Alice', 'Bob'] } });
		expect(screen.getByText('Manager: Alice, Bob')).toBeInTheDocument();
	});

	test('shows Unknown when no managers', () => {
		render(TeamHeader, { props: { team: mockTeamA, record: '(0-0)', managers: [] } });
		expect(screen.getByText('Manager: (Unknown)')).toBeInTheDocument();
	});

	test('applies team colors as inline style', () => {
		const { container } = render(TeamHeader, { props: { team: mockTeamA, record: '(0-0)', managers: [] } });
		const header = container.querySelector('.team-header');
		const style = header?.getAttribute('style') ?? '';
		expect(style).toContain('background-color');
		expect(style).toContain('color');
	});
});
