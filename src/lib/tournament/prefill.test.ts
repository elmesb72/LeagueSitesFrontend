import { describe, test, expect } from 'vitest';
import { bracketPrefill, poolPrefill } from './prefill';
import {
	makeBracket,
	makeDecidedQuarterFinals,
	makePool,
	makeTournamentDetail,
	makeUnresolvedSeries
} from '../../tests/tournamentMocks';

const detail = makeTournamentDetail({
	brackets: [
		makeBracket({
			rounds: [
				makeDecidedQuarterFinals(),
				{ id: 21, name: 'Semi-finals', series: [makeUnresolvedSeries(), makeUnresolvedSeries()] }
			]
		})
	],
	roundRobins: [makePool({ id: 7, name: 'B Side' })]
});

describe('poolPrefill', () => {
	test('a pool for the teams knocked out in a round, with a note saying so', () => {
		const prefill = poolPrefill(detail, new URLSearchParams('losersOf=41'));
		expect(prefill).toEqual({
			seeding: {
				outputStart: 1,
				outputEnd: 4,
				result: 'Losers',
				sourceType: 'BracketRound',
				sourceID: 41,
				rankStart: 1,
				rankEnd: 4
			},
			note: 'Pre-filled with the 4 teams knocked out in the Quarter-finals of the Main bracket. Change them below if that is not right.'
		});
	});

	test('nothing without the parameter, or for a round that is not in this tournament', () => {
		expect(poolPrefill(detail, new URLSearchParams(''))).toBeNull();
		expect(poolPrefill(detail, new URLSearchParams('losersOf=999'))).toBeNull();
		expect(poolPrefill(detail, new URLSearchParams('losersOf=abc'))).toBeNull();
	});
});

describe('bracketPrefill', () => {
	test('the final the top 2 of a pool go on to, named after the pool', () => {
		const prefill = bracketPrefill(detail, new URLSearchParams('afterPool=7&top=2'));
		expect(prefill).toEqual({
			seeding: {
				outputStart: 1,
				outputEnd: 2,
				result: 'Standings',
				sourceType: 'TournamentRoundRobin',
				sourceID: 7,
				rankStart: 1,
				rankEnd: 2
			},
			name: 'B Side Final',
			title: 'Add the B Side final',
			note: 'Seeded from the top 2 of B Side by final standings, named, and marked as a champion. Build the rounds and save; nothing else to fill in.'
		});
	});

	test('top defaults to 2 and is clamped to a size a bracket can lay out', () => {
		expect(bracketPrefill(detail, new URLSearchParams('afterPool=7'))!.seeding.outputEnd).toBe(2);
		expect(
			bracketPrefill(detail, new URLSearchParams('afterPool=7&top=4'))!.seeding.outputEnd
		).toBe(4);
		expect(
			bracketPrefill(detail, new URLSearchParams('afterPool=7&top=3'))!.seeding.outputEnd
		).toBe(2);
		expect(
			bracketPrefill(detail, new URLSearchParams('afterPool=7&top=8'))!.seeding.outputEnd
		).toBe(4);
	});

	test('nothing without the parameter or for an unknown pool', () => {
		expect(bracketPrefill(detail, new URLSearchParams(''))).toBeNull();
		expect(bracketPrefill(detail, new URLSearchParams('afterPool=999'))).toBeNull();
	});
});
