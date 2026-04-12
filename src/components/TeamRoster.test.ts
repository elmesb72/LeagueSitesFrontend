import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import TeamRoster from './TeamRoster.svelte';
import type { RosterEntry } from '$lib/models/TeamPage';

const mockRoster: RosterEntry[] = [
	{
		id: 1,
		player: { id: 10, firstName: 'Homer', lastName: 'Simpson', name: 'Homer Simpson', number: '7', shortCode: 'simps01' },
		roles: ['Manager'],
		userRoles: ['Webmaster']
	},
	{
		id: 2,
		player: { id: 11, firstName: 'Bart', lastName: 'Simpson', name: 'Bart Simpson', number: '23', shortCode: 'simps02' },
		roles: ['Scorer'],
		userRoles: []
	},
	{
		id: 3,
		player: { id: 12, firstName: 'Ned', lastName: 'Flanders', name: 'Ned Flanders', number: null, shortCode: 'fland01' },
		roles: [],
		userRoles: ['Executive']
	}
];

describe('TeamRoster', () => {
	test('renders roster title', () => {
		render(TeamRoster, { props: { roster: mockRoster } });
		expect(screen.getByText('Active Roster')).toBeInTheDocument();
	});

	test('renders custom title', () => {
		render(TeamRoster, { props: { roster: mockRoster, title: 'Substitutes' } });
		expect(screen.getByText('Substitutes')).toBeInTheDocument();
	});

	test('renders player names with links', () => {
		render(TeamRoster, { props: { roster: mockRoster } });
		const homer = screen.getByText('Homer Simpson');
		expect(homer.closest('a')?.getAttribute('href')).toBe('/Player/simps01');
	});

	test('renders jersey numbers', () => {
		render(TeamRoster, { props: { roster: mockRoster } });
		expect(screen.getByText('7')).toBeInTheDocument();
		expect(screen.getByText('23')).toBeInTheDocument();
	});

	test('does not render number when null', () => {
		const { container } = render(TeamRoster, { props: { roster: [mockRoster[2]] } });
		const numbers = container.querySelectorAll('.player-number');
		expect(numbers.length).toBe(0);
	});

	test('renders manager icon', () => {
		const { container } = render(TeamRoster, { props: { roster: mockRoster } });
		expect(container.querySelector('.fa-users')).not.toBeNull();
	});

	test('renders scorer icon', () => {
		const { container } = render(TeamRoster, { props: { roster: mockRoster } });
		expect(container.querySelector('.fa-clipboard-list')).not.toBeNull();
	});

	test('renders webmaster icon', () => {
		const { container } = render(TeamRoster, { props: { roster: mockRoster } });
		expect(container.querySelector('.fa-tools')).not.toBeNull();
	});

	test('renders executive icon', () => {
		const { container } = render(TeamRoster, { props: { roster: mockRoster } });
		expect(container.querySelector('.fa-user-tie')).not.toBeNull();
	});

	test('shows (none) when roster is empty', () => {
		render(TeamRoster, { props: { roster: [] } });
		expect(screen.getByText('(none)')).toBeInTheDocument();
	});
});
