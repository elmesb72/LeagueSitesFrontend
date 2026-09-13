import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import TournamentFlow from './TournamentFlow.svelte';
import {
	makeBracket,
	makeDecidedQuarterFinals,
	makePool,
	makeTournamentDetail,
	makeUnresolvedSeries
} from '../tests/tournamentMocks';
import type { SeedGroup } from '$lib/models/Tournament';

const losersOfQuarterFinals: SeedGroup = {
	outputStart: 1,
	outputEnd: 4,
	result: 'Losers',
	sourceType: 'BracketRound',
	sourceID: 41,
	rankStart: 1,
	rankEnd: 4
};
const topTwoOfPool: SeedGroup = {
	outputStart: 1,
	outputEnd: 2,
	result: 'Standings',
	sourceType: 'TournamentRoundRobin',
	sourceID: 7,
	rankStart: 1,
	rankEnd: 2
};
const main = () =>
	makeBracket({
		rounds: [
			makeDecidedQuarterFinals(),
			{ id: 21, name: 'Semi-finals', series: [makeUnresolvedSeries(), makeUnresolvedSeries()] }
		]
	});

describe('TournamentFlow', () => {
	test('draws the chain with the champion mark where it sits, and links each stage', () => {
		const detail = makeTournamentDetail({
			brackets: [main()],
			roundRobins: [
				makePool({ id: 7, name: 'B Side', historical: true, seeding: [losersOfQuarterFinals] })
			]
		});
		const { container } = render(TournamentFlow, { props: { detail } });

		expect(screen.getByRole('heading', { name: 'How it fits together' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Main' })).toHaveAttribute(
			'href',
			'/Executive/Edit/Tournament/6/Bracket/12'
		);
		expect(screen.getByRole('link', { name: 'B Side' })).toHaveAttribute(
			'href',
			'/Executive/Edit/Tournament/6/Pool/7'
		);
		expect(container.querySelectorAll('.tournament-flow-champion')).toHaveLength(2);
		expect(container.querySelector('.tournament-flow-arrow-losers')).toHaveTextContent(
			'knocked out in the Quarter-finals'
		);
		expect(screen.queryByRole('status')).toBeNull();
	});

	test('warns when a marked pool is really a qualifier, with links to fix both ends', () => {
		const detail = makeTournamentDetail({
			brackets: [
				main(),
				makeBracket({
					id: 13,
					name: 'B Final',
					historical: false,
					seeding: [topTwoOfPool],
					rounds: [{ id: 30, name: 'Final', series: [makeUnresolvedSeries()] }]
				})
			],
			roundRobins: [
				makePool({ id: 7, name: 'B Side', historical: true, seeding: [losersOfQuarterFinals] })
			]
		});
		render(TournamentFlow, { props: { detail } });

		const note = screen.getByRole('status');
		expect(note).toHaveTextContent(
			'B Side is marked as a champion, but its top teams go on to play B Final.'
		);
		expect(screen.getByRole('link', { name: 'Edit B Side' })).toHaveAttribute(
			'href',
			'/Executive/Edit/Tournament/6/Pool/7'
		);
		expect(screen.getByRole('link', { name: 'Edit B Final' })).toHaveAttribute(
			'href',
			'/Executive/Edit/Tournament/6/Bracket/13'
		);
	});

	test('suggests the B-side pool right after the Main bracket, pre-filled from the opening round', () => {
		const detail = makeTournamentDetail({ brackets: [main()], roundRobins: [] });
		const { container } = render(TournamentFlow, { props: { detail } });

		expect(
			screen.getByText(/the 4 teams knocked out in the Quarter-finals have nowhere to play/)
		).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Add a B-side pool for them' })).toHaveAttribute(
			'href',
			'/Executive/Edit/Tournament/6/AddPool?losersOf=41'
		);
		expect(container.querySelector('a.tournament-flow-ghost')).toHaveAttribute(
			'href',
			'/Executive/Edit/Tournament/6/AddPool?losersOf=41'
		);
	});

	test('renders nothing for an empty tournament', () => {
		const { container } = render(TournamentFlow, {
			props: { detail: makeTournamentDetail({ brackets: [], roundRobins: [] }) }
		});
		expect(container.querySelector('.tournament-flow')).toBeNull();
	});
});
