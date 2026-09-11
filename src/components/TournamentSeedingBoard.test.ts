import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, test, expect, vi } from 'vitest';
import type { SeedGroup } from '$lib/models/Tournament';
import Harness from '../tests/SeedingBoardHarness.svelte';
import {
	makeTournamentDetail,
	mockBoardSources,
	mockStandingsResponse,
	seasonOrder
} from '../tests/tournamentMocks';

const season = (
	outputStart: number,
	outputEnd: number,
	rankStart: number,
	rankEnd: number
): SeedGroup => ({
	outputStart,
	outputEnd,
	result: 'Standings',
	sourceType: 'Season',
	sourceID: 15,
	rankStart,
	rankEnd
});
const losers = (
	outputStart: number,
	outputEnd: number,
	rankStart: number,
	rankEnd: number
): SeedGroup => ({
	outputStart,
	outputEnd,
	result: 'Losers',
	sourceType: 'BracketRound',
	sourceID: 41,
	rankStart,
	rankEnd
});

const okFetch = () =>
	vi.fn(async () => ({
		ok: true,
		json: async () => mockStandingsResponse
	})) as unknown as typeof fetch;

function renderBoard(seeding: SeedGroup[], extra: Record<string, unknown> = {}) {
	return render(Harness, {
		props: {
			seeding,
			sources: mockBoardSources,
			subject: 'bracket',
			tournament: makeTournamentDetail(),
			seeds: null,
			fetchFn: okFetch(),
			...extra
		}
	});
}

const rules = () => JSON.parse(screen.getByTestId('seeding').textContent!) as SeedGroup[];
const writes = () => Number(screen.getByTestId('writes').textContent);

const slotTexts = (container: HTMLElement) =>
	[...container.querySelectorAll('.seeding-slot-target')].map((el) =>
		el.textContent!.replace(/\s+/g, ' ').trim()
	);
const slotNames = (container: HTMLElement) => slotTexts(container).map((t) => t.split(' ')[1]);
const slotTags = (container: HTMLElement) =>
	[...container.querySelectorAll('.seeding-slot-tag')].map((el) => el.textContent!.trim());
/** The visible status line (the same text is also mirrored into an aria-live region). */
const statusText = () => screen.getByRole('status').textContent!.replace(/\s+/g, ' ').trim();

async function namesLoaded() {
	await waitFor(() => expect(screen.getAllByText('Alphas').length).toBeGreaterThan(0));
}

describe('TournamentSeedingBoard (bracket)', () => {
	test('shows team names next to ranks once standings load, with the "as of today" caveat', async () => {
		renderBoard([season(1, 8, 1, 8)]);
		await namesLoaded();
		expect(screen.getByText(/as of today/)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Rank 10, Kappas/ })).toBeInTheDocument();
	});

	test('starts from the loaded rules with every seed in default state, without rewriting the rules', async () => {
		const { container } = renderBoard([season(1, 8, 1, 8)]);
		await namesLoaded();
		expect(slotTexts(container)[0]).toBe('1 Alphas default');
		expect(slotTags(container)).toEqual(Array(8).fill('default'));
		expect(writes()).toBe(0);
	});

	test('reads sitting-out teams off a skip-a-rank configuration and tags the rest "moved up"', async () => {
		const { container } = renderBoard([season(1, 7, 2, 8), season(8, 8, 10, 10)]);
		await namesLoaded();
		expect(screen.getByText('1. Alphas')).toBeInTheDocument();
		expect(screen.getByText('9. Iotas')).toBeInTheDocument();
		expect(slotTags(container)).toEqual(Array(8).fill('moved up'));
	});

	test('tap a team, then a seed: places it, announces it, and compiles the rules', async () => {
		const { container } = renderBoard([season(1, 4, 1, 4)]);
		await namesLoaded();
		await fireEvent.click(screen.getByRole('button', { name: /Rank 7, Etas/ }));
		expect(screen.getByText(/Selected: Etas/)).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: /^Seed 2:/ }));

		expect(slotTexts(container)[1]).toBe('2 Etas changed');
		expect(statusText()).toContain('Etas placed at seed 2; Betas is no longer seeded.');
		expect(rules()).toEqual([season(1, 1, 1, 1), season(2, 2, 7, 7), season(3, 4, 3, 4)]);
	});

	test('tapping two seeds swaps them', async () => {
		const { container } = renderBoard([season(1, 4, 1, 4)]);
		await namesLoaded();
		await fireEvent.click(screen.getByRole('button', { name: /^Seed 1:/ }));
		await fireEvent.click(screen.getByRole('button', { name: /^Seed 4:/ }));
		expect(slotNames(container)).toEqual(['Deltas', 'Betas', 'Gammas', 'Alphas']);
		expect(slotTags(container)).toEqual(['changed', 'default', 'default', 'changed']);
	});

	test('sitting a seeded team out moves everyone below up and pulls in the next team', async () => {
		const { container } = renderBoard([season(1, 4, 1, 4)]);
		await namesLoaded();
		await fireEvent.click(screen.getByRole('button', { name: /Rank 2, Betas/ }));
		await fireEvent.click(
			screen.getByRole('button', { name: /Put Betas on the sitting-out list/ })
		);

		expect(slotNames(container)).toEqual(['Alphas', 'Gammas', 'Deltas', 'Epsilons']);
		expect(slotTags(container)).toEqual(['default', 'moved up', 'moved up', 'moved up']);
		expect(rules()).toEqual([season(1, 1, 1, 1), season(2, 4, 3, 5)]);
		expect(screen.getByRole('button', { name: 'Bring Betas back in' })).toBeInTheDocument();
	});

	test('restore undoes the shift', async () => {
		const { container } = renderBoard([season(1, 3, 2, 4)]);
		await namesLoaded();
		await fireEvent.click(screen.getByRole('button', { name: 'Bring Alphas back in' }));
		expect(slotNames(container)).toEqual(['Alphas', 'Betas', 'Gammas']);
		expect(slotTags(container)).toEqual(['default', 'default', 'default']);
		expect(rules()).toEqual([season(1, 3, 1, 3)]);
	});

	test('clearing a seed leaves a hole and reports it as a problem', async () => {
		const { container, component } = renderBoard([season(1, 4, 1, 4)]);
		await namesLoaded();
		await fireEvent.click(screen.getByRole('button', { name: 'Clear seed 3' }));
		expect(slotTexts(container)[2]).toBe('3 Drop a team here empty');
		expect(screen.getByText('Seed 3 has no team.')).toBeInTheDocument();
		expect(rules()).toEqual([season(1, 2, 1, 2), season(4, 4, 4, 4)]);
		expect(component.problems()).toEqual(['Seed 3 has no team.']);
	});

	test('a seed from another source is tagged with that source and stays visible when unresolved', async () => {
		const { container } = renderBoard([season(1, 3, 1, 3), losers(4, 4, 4, 4)]);
		await namesLoaded();
		expect(slotTexts(container)[3]).toContain('Quarter-finals losers rank 4');
		expect(slotTags(container)[3]).toBe('from Quarter-finals losers');
		await waitFor(() =>
			expect(container.querySelectorAll('.seeding-connectors path.line-other')).toHaveLength(1)
		);
	});

	test('Undo restores the previous board and rules', async () => {
		const { container } = renderBoard([season(1, 4, 1, 4)]);
		await namesLoaded();
		await fireEvent.click(screen.getByRole('button', { name: 'Clear seed 3' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
		expect(slotTexts(container)[2]).toBe('3 Gammas default');
		expect(rules()).toEqual([season(1, 4, 1, 4)]);
		expect(statusText()).toContain('Undone.');
	});

	test('Ctrl+Z undoes too, but not while typing in a field', async () => {
		const { container } = renderBoard([season(1, 4, 1, 4)]);
		await namesLoaded();
		await fireEvent.click(screen.getByRole('button', { name: 'Clear seed 3' }));
		// Two rules now, so the Advanced table is showing; type into one of its fields.
		await fireEvent.keyDown(screen.getByLabelText('First seed filled by rule 1'), {
			key: 'z',
			ctrlKey: true
		});
		expect(slotTexts(container)[2]).toBe('3 Drop a team here empty');
		await fireEvent.keyDown(container.querySelector('.seeding-board')!, {
			key: 'z',
			ctrlKey: true
		});
		expect(slotTexts(container)[2]).toBe('3 Gammas default');
	});

	test('Reset to default re-derives the order but keeps sitting-out marks', async () => {
		const { container } = renderBoard([season(1, 1, 3, 3), season(2, 2, 2, 2), season(3, 3, 4, 4)]);
		await namesLoaded();
		await fireEvent.click(screen.getByRole('button', { name: 'Reset to default' }));
		expect(slotNames(container)).toEqual(['Betas', 'Gammas', 'Deltas']);
		expect(rules()).toEqual([season(1, 3, 2, 4)]);
	});

	test('changing the default source keeps other-source seeds and re-fills the rest, with no dialog', async () => {
		const { container } = renderBoard([season(1, 2, 1, 2), losers(3, 3, 1, 1)]);
		await namesLoaded();
		await fireEvent.change(screen.getByLabelText('Fill seeds by default from'), {
			target: { value: 'Standings|TournamentRoundRobin|7' }
		});
		expect(statusText()).toContain('2 seeds re-filled from Pool A final standings, 1 kept');
		expect(slotTexts(container)[0]).toBe('1 Kappas default');
		expect(slotTags(container)[2]).toBe('from Quarter-finals losers');
	});

	test('the seed count control appears for new brackets only and refills when grown', async () => {
		const { container } = renderBoard([season(1, 4, 1, 4)]);
		await namesLoaded();
		await fireEvent.change(screen.getByLabelText('Number of seeds'), { target: { value: '8' } });
		expect(container.querySelectorAll('.seeding-slot')).toHaveLength(8);
		expect(rules()).toEqual([season(1, 8, 1, 8)]);
	});

	test('with seeds given (an existing bracket) there is no seed count control', async () => {
		renderBoard([season(1, 4, 1, 4)], { seeds: [1, 2, 3, 4] });
		await namesLoaded();
		expect(screen.queryByLabelText('Number of seeds')).toBeNull();
	});

	test('edits in the Advanced rule table flow onto the board', async () => {
		const { container } = renderBoard([season(1, 4, 1, 4)]);
		await namesLoaded();
		await fireEvent.change(screen.getByLabelText('Last rank to include'), {
			target: { value: '2' }
		});
		await waitFor(() => expect(slotTexts(container)[3]).toBe('4 Drop a team here empty'));
		expect(container.querySelectorAll('.seeding-slot')).toHaveLength(4);
	});

	test('the bracket being edited is not offered as its own source on the board', async () => {
		renderBoard([season(1, 4, 1, 4)], { ownRoundIds: [41] });
		await namesLoaded();
		expect(screen.queryByRole('region', { name: /knocked out in the Quarter-finals/ })).toBeNull();
		expect(screen.queryByRole('region', { name: /Quarter-finals results/ })).toBeNull();
		expect(screen.getByRole('region', { name: 'Pool A final standings' })).toBeInTheDocument();
		// The Advanced rule table deliberately still lists every source.
		expect(
			screen.getByRole('option', { name: /knocked out in the Quarter-finals/ })
		).toBeInTheDocument();
	});

	test("prefers the server's resolved team for an untouched seed", async () => {
		const { container } = renderBoard([season(1, 2, 1, 2)], {
			seeds: [1, 2],
			resolvedSeeds: [{ seed: 1, team: seasonOrder[9] }]
		});
		await namesLoaded();
		expect(slotTexts(container)[0]).toBe('1 Kappas default');
		expect(slotTexts(container)[1]).toBe('2 Betas default');
	});

	test('a failed standings fetch degrades to rank numbers with a notice', async () => {
		const failing = vi.fn(async () => ({ ok: false })) as unknown as typeof fetch;
		renderBoard([season(1, 2, 1, 2)], { fetchFn: failing });
		await waitFor(() => expect(screen.getByText(/could not be loaded/)).toBeInTheDocument());
		expect(screen.getAllByText(/regular season rank 1/).length).toBeGreaterThan(0);
	});
});

describe('TournamentSeedingBoard (pool)', () => {
	test('shows a membership bin instead of seeds, with no connectors, legend, or sitting out', async () => {
		const { container } = renderBoard([losers(1, 3, 1, 3)], { subject: 'pool' });
		await namesLoaded();
		expect(screen.getByText('In this pool (3)')).toBeInTheDocument();
		expect(container.querySelector('.seeding-connectors')).toBeNull();
		expect(screen.queryByText(/Sitting out/)).toBeNull();
		expect(screen.queryByText('Bracket seeds')).toBeNull();
		expect(screen.queryByText('Reset to default')).toBeNull();
	});

	test('tapping a team toggles membership and compiles canonical rules', async () => {
		renderBoard([losers(1, 3, 1, 3)], { subject: 'pool' });
		await namesLoaded();
		await fireEvent.click(screen.getByRole('button', { name: /Rank 10, Kappas/ }));
		expect(screen.getByText('In this pool (4)')).toBeInTheDocument();
		expect(rules()).toEqual([season(1, 1, 10, 10), losers(2, 4, 1, 3)]);

		await fireEvent.click(screen.getByRole('button', { name: 'Remove Kappas from the pool' }));
		expect(rules()).toEqual([losers(1, 3, 1, 3)]);
	});

	test('"Add all" pulls in every rank of a source, including unresolved ones', async () => {
		renderBoard([], { subject: 'pool' });
		await namesLoaded();
		await fireEvent.click(screen.getByRole('button', { name: 'Add all 4' }));
		expect(screen.getByText('In this pool (4)')).toBeInTheDocument();
		expect(rules()).toEqual([losers(1, 4, 1, 4)]);
	});

	test('leaves the loaded rules untouched until membership changes, and restores them on undo', async () => {
		const loaded = [losers(1, 3, 1, 3), season(4, 4, 10, 10)];
		renderBoard(loaded, { subject: 'pool' });
		await namesLoaded();
		expect(writes()).toBe(0);
		await fireEvent.click(screen.getByRole('button', { name: /Rank 9, Iotas/ }));
		expect(writes()).toBe(1);
		await fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
		expect(rules()).toEqual(loaded);
	});
});
