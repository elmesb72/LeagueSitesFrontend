import { describe, test, expect } from 'vitest';
import { tournamentFlow, type FlowItem } from './flow';
import {
	makeBracket,
	makeDecidedQuarterFinals,
	makePool,
	makeTournamentDetail,
	makeUnresolvedSeries
} from '../../tests/tournamentMocks';
import type { SeedGroup } from '$lib/models/Tournament';

const fromSeason = (rankStart: number, rankEnd: number, outputStart = 1): SeedGroup => ({
	outputStart,
	outputEnd: outputStart + (rankEnd - rankStart),
	result: 'Standings',
	sourceType: 'Season',
	sourceID: 15,
	rankStart,
	rankEnd
});
const losersOf = (roundId: number, count: number): SeedGroup => ({
	outputStart: 1,
	outputEnd: count,
	result: 'Losers',
	sourceType: 'BracketRound',
	sourceID: roundId,
	rankStart: 1,
	rankEnd: count
});
const topOfPool = (poolId: number, count: number): SeedGroup => ({
	outputStart: 1,
	outputEnd: count,
	result: 'Standings',
	sourceType: 'TournamentRoundRobin',
	sourceID: poolId,
	rankStart: 1,
	rankEnd: count
});

/** Main bracket: quarter-finals (round 41, four series) then semi-finals. */
const main = () =>
	makeBracket({
		id: 12,
		name: 'Main',
		historical: true,
		seeding: [fromSeason(1, 8)],
		rounds: [
			makeDecidedQuarterFinals(),
			{ id: 21, name: 'Semi-finals', series: [makeUnresolvedSeries(), makeUnresolvedSeries()] }
		]
	});

function text(items: FlowItem[]): string {
	return items
		.map((i) => {
			switch (i.type) {
				case 'source':
					return `(${i.label})`;
				case 'stage':
					return `[${i.stage.name}${i.stage.historical ? '*' : ''}]`;
				case 'ref':
					return `{${i.stage.name}}`;
				case 'arrow':
					return i.edge.kind === 'losers' ? `┄${i.edge.label}┄>` : `─${i.edge.label}─>`;
				case 'ghost-arrow':
					return `…${i.label}…>`;
				case 'ghost':
					return `<${i.label}>`;
			}
		})
		.join(' ');
}

describe('tournamentFlow', () => {
	test('shape 1: Main bracket, losers feed a B pool that decides the B title', () => {
		const detail = makeTournamentDetail({
			brackets: [main()],
			roundRobins: [
				makePool({ id: 7, name: 'B Side', historical: true, seeding: [losersOf(41, 4)] })
			]
		});
		const flow = tournamentFlow(detail);

		expect(flow.rows.map((r) => text(r.items))).toEqual([
			'(2026 regular season) ─standings 1–8─> [Main*] ┄knocked out in the Quarter-finals┄> [B Side*]'
		]);
		expect(flow.stages.map((s) => s.size)).toEqual(['2 rounds', '4 teams']);
		expect(flow.warnings).toEqual([]);
		expect(flow.suggestion).toBeNull();
	});

	test('shape 2: the pool feeds a final — the mark belongs on the final, and a marked pool is warned', () => {
		const detail = makeTournamentDetail({
			brackets: [
				main(),
				makeBracket({
					id: 13,
					name: 'B Final',
					historical: false,
					seeding: [topOfPool(7, 2)],
					rounds: [{ id: 30, name: 'Final', series: [makeUnresolvedSeries()] }]
				})
			],
			roundRobins: [
				makePool({ id: 7, name: 'B Side', historical: true, seeding: [losersOf(41, 4)] })
			]
		});
		const flow = tournamentFlow(detail);

		expect(flow.rows.map((r) => text(r.items))).toEqual([
			'(2026 regular season) ─standings 1–8─> [Main*] ┄knocked out in the Quarter-finals┄> [B Side*] ─final standings 1–2─> [B Final]'
		]);
		expect(flow.warnings).toHaveLength(1);
		expect(flow.warnings[0].stage.name).toBe('B Side');
		expect(flow.warnings[0].feeds.name).toBe('B Final');
		expect(flow.warnings[0].message).toBe(
			'B Side is marked as a champion, but its top teams go on to play B Final. The B Side title is decided in B Final, so the champion mark belongs there.'
		);
		expect(flow.suggestion).toBeNull();
	});

	test('shape 2 with the marks right has no warning', () => {
		const detail = makeTournamentDetail({
			brackets: [
				main(),
				makeBracket({
					id: 13,
					name: 'B Final',
					historical: true,
					seeding: [topOfPool(7, 2)],
					rounds: [{ id: 30, name: 'Final', series: [makeUnresolvedSeries()] }]
				})
			],
			roundRobins: [
				makePool({ id: 7, name: 'B Side', historical: false, seeding: [losersOf(41, 4)] })
			]
		});
		expect(tournamentFlow(detail).warnings).toEqual([]);
	});

	test('a bracket whose losers drop into a pool is still a title: no warning for losers edges', () => {
		const detail = makeTournamentDetail({
			brackets: [main()],
			roundRobins: [
				makePool({ id: 7, name: 'B Side', historical: true, seeding: [losersOf(41, 4)] })
			]
		});
		expect(tournamentFlow(detail).warnings).toEqual([]);
	});

	test('right after the Main bracket is created, suggests a B-side pool for the knocked-out teams', () => {
		const detail = makeTournamentDetail({ brackets: [main()], roundRobins: [] });
		const flow = tournamentFlow(detail);

		expect(flow.suggestion).toEqual({
			kind: 'add-pool',
			bracket: flow.stages[0],
			roundName: 'Quarter-finals',
			losers: 4,
			href: '/Executive/Edit/Tournament/6/AddPool?losersOf=41'
		});
		expect(text(flow.rows[0].items)).toBe(
			'(2026 regular season) ─standings 1–8─> [Main*] …knocked out in the Quarter-finals…> <Add a B-side pool>'
		);
	});

	test('no suggestion once anything takes the losers, or for a two-team bracket', () => {
		const consolation = makeBracket({
			id: 14,
			name: 'Consolation',
			historical: false,
			seeding: [losersOf(41, 4)],
			rounds: [
				{ id: 50, name: 'Semi-finals', series: [makeUnresolvedSeries(), makeUnresolvedSeries()] }
			]
		});
		expect(
			tournamentFlow(makeTournamentDetail({ brackets: [main(), consolation], roundRobins: [] }))
				.suggestion
		).toBeNull();

		const twoTeams = makeBracket({
			id: 15,
			name: 'Final only',
			seeding: [fromSeason(1, 2)],
			rounds: [{ id: 60, name: 'Final', series: [makeUnresolvedSeries()] }]
		});
		expect(
			tournamentFlow(makeTournamentDetail({ brackets: [twoTeams], roundRobins: [] })).suggestion
		).toBeNull();
	});

	test('a bracket feeding two things gets a second, referring row', () => {
		const detail = makeTournamentDetail({
			brackets: [
				main(),
				makeBracket({
					id: 14,
					name: 'Consolation',
					historical: false,
					seeding: [losersOf(41, 4)],
					rounds: [
						{
							id: 50,
							name: 'Semi-finals',
							series: [makeUnresolvedSeries(), makeUnresolvedSeries()]
						}
					]
				})
			],
			roundRobins: [
				makePool({ id: 7, name: 'Third place', historical: false, seeding: [losersOf(21, 2)] })
			]
		});
		const rows = tournamentFlow(detail).rows.map((r) => text(r.items));
		expect(rows).toEqual([
			'(2026 regular season) ─standings 1–8─> [Main*] ┄knocked out in the Quarter-finals┄> [Consolation]',
			'{Main} ┄knocked out in the Semi-finals┄> [Third place]'
		]);
	});

	test('several rules from one source merge into one arrow', () => {
		const detail = makeTournamentDetail({
			brackets: [
				makeBracket({
					id: 12,
					name: 'Main',
					seeding: [fromSeason(1, 2, 1), fromSeason(5, 6, 3)],
					rounds: [
						{
							id: 20,
							name: 'Semi-finals',
							series: [makeUnresolvedSeries(), makeUnresolvedSeries()]
						}
					]
				})
			],
			roundRobins: []
		});
		const flow = tournamentFlow(detail);
		expect(flow.edges).toHaveLength(1);
		expect(flow.edges[0].label).toBe('standings 1–2, 5–6');
	});

	test('a pool seeded from the regular season stands on its own row', () => {
		const detail = makeTournamentDetail({
			brackets: [main()],
			roundRobins: [makePool({ id: 7, name: 'Pool A', seeding: [fromSeason(9, 10)] })]
		});
		const rows = tournamentFlow(detail).rows.map((r) => text(r.items));
		expect(rows[1]).toBe('(2026 regular season) ─standings 9–10─> [Pool A]');
	});
});
