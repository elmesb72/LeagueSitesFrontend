import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import TournamentStrip from './TournamentStrip.svelte';
import type { TournamentLink } from '$lib/models/Playoffs';

const links: TournamentLink[] = [
	{
		seasonId: 301,
		tournamentId: 30,
		name: '2027 Playoffs',
		shortName: 'Playoffs',
		kind: 'playoffs'
	},
	{
		seasonId: 302,
		tournamentId: 31,
		name: '2027 Canada Day Cup',
		shortName: 'Canada Day Cup',
		kind: 'tournament'
	},
	{
		seasonId: 303,
		tournamentId: 32,
		name: '2027 Labour Day Classic',
		shortName: 'Labour Day Classic',
		kind: 'tournament'
	}
];

describe('TournamentStrip', () => {
	test('lists the other tournaments of the year with their pages', () => {
		render(TournamentStrip, { props: { links, year: 2027, excludeTournamentId: 31 } });
		expect(screen.getByText('Also in 2027:')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Playoffs' })).toHaveAttribute(
			'href',
			'/Playoffs?year=2027'
		);
		expect(screen.getByRole('link', { name: 'Labour Day Classic' })).toHaveAttribute(
			'href',
			'/Tournaments/32'
		);
		expect(screen.queryByRole('link', { name: 'Canada Day Cup' })).toBeNull();
	});

	test('the playoffs page leaves the playoffs out', () => {
		render(TournamentStrip, { props: { links, year: 2027, excludeKind: 'playoffs' } });
		expect(screen.queryByRole('link', { name: 'Playoffs' })).toBeNull();
		expect(screen.getAllByRole('link')).toHaveLength(2);
	});

	test('renders nothing when there is nothing else', () => {
		const { container } = render(TournamentStrip, {
			props: { links: [links[0]], year: 2027, excludeKind: 'playoffs' }
		});
		expect(container.querySelector('.tournament-strip')).toBeNull();
	});
});
