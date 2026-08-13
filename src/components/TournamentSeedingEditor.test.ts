import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import TournamentSeedingEditor from './TournamentSeedingEditor.svelte';
import { mockSeedingSources } from '../tests/tournamentMocks';
import type { SeedGroup } from '$lib/models/Tournament';

const simpleSeeding: SeedGroup[] = [
	{
		outputStart: 1,
		outputEnd: 8,
		result: 'Standings',
		sourceType: 'Season',
		sourceID: 15,
		rankStart: 1,
		rankEnd: 8
	}
];

function renderEditor(seeding: SeedGroup[] = simpleSeeding) {
	return render(TournamentSeedingEditor, {
		props: { seeding, sources: mockSeedingSources }
	});
}

describe('TournamentSeedingEditor', () => {
	test('states the seeding as a sentence rather than a configuration string', () => {
		renderEditor();
		expect(screen.getByText('Take the teams from')).toBeInTheDocument();
		expect(screen.getByText('Ranked')).toBeInTheDocument();
		expect(screen.getByText(/8 teams will enter this bracket, seeded 1 to 8/)).toBeInTheDocument();
	});

	test('offers each source in plain language', () => {
		renderEditor();
		expect(screen.getByText('2026 regular season standings')).toBeInTheDocument();
		expect(
			screen.getByText('Teams knocked out in the Semi-finals (Main bracket)')
		).toBeInTheDocument();
	});

	test('warns when a source cannot supply the ranks asked for', () => {
		// The regular season only has 10 teams in these mocks.
		renderEditor([{ ...simpleSeeding[0], outputEnd: 12, rankEnd: 12 }]);

		expect(screen.getByText(/can only supply 10 team\(s\)/)).toBeInTheDocument();
	});

	test('starts in simple mode and can reveal the full rule list', async () => {
		renderEditor();
		expect(screen.queryByText('Come from')).not.toBeInTheDocument();

		await fireEvent.click(screen.getByText('More seeding options'));

		expect(screen.getByText('Come from')).toBeInTheDocument();
		expect(screen.getByText('Add another rule')).toBeInTheDocument();
	});

	test('starts in advanced mode when the seeding already has several rules', () => {
		renderEditor([
			{ ...simpleSeeding[0], outputStart: 1, outputEnd: 1, rankStart: 1, rankEnd: 1 },
			{
				outputStart: 2,
				outputEnd: 2,
				result: 'Losers',
				sourceType: 'BracketRound',
				sourceID: 20,
				rankStart: 1,
				rankEnd: 1
			}
		]);

		expect(screen.getByText('Come from')).toBeInTheDocument();
		expect(screen.getByText(/2 teams will enter this bracket/)).toBeInTheDocument();
	});

	test('reports a seed filled by more than one rule', () => {
		renderEditor([
			{ ...simpleSeeding[0], outputStart: 1, outputEnd: 4, rankStart: 1, rankEnd: 4 },
			{ ...simpleSeeding[0], outputStart: 4, outputEnd: 6, rankStart: 4, rankEnd: 6 }
		]);

		expect(screen.getByText('Seed 4 is filled by more than one rule.')).toBeInTheDocument();
	});

	test('reports a rule that supplies the wrong number of teams', () => {
		renderEditor([{ ...simpleSeeding[0], outputStart: 1, outputEnd: 4, rankStart: 1, rankEnd: 2 }]);

		expect(screen.getByText(/takes 2 team\(s\) but fills 4 seed\(s\)/)).toBeInTheDocument();
	});

	test('shows how many teams each source can supply', () => {
		renderEditor([
			{ ...simpleSeeding[0] },
			{
				outputStart: 9,
				outputEnd: 9,
				result: 'Losers',
				sourceType: 'BracketRound',
				sourceID: 20,
				rankStart: 1,
				rankEnd: 1
			}
		]);

		expect(screen.getByText('10 available')).toBeInTheDocument();
		expect(screen.getByText('2 available')).toBeInTheDocument();
	});
});
