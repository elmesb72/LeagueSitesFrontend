import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import TournamentBracketForm from './TournamentBracketForm.svelte';
import { makeBracket, mockReferenceData } from '../tests/tournamentMocks';

function renderCreate(
	defaultSeeding = {
		outputStart: 1,
		outputEnd: 8,
		result: 'Standings' as const,
		sourceType: 'Season' as const,
		sourceID: 15,
		rankStart: 1,
		rankEnd: 8
	}
) {
	return render(TournamentBracketForm, {
		props: { tournamentId: 6, referenceData: mockReferenceData, defaultSeeding }
	});
}

describe('TournamentBracketForm (creating)', () => {
	test('asks the three questions in plain language', () => {
		renderCreate();
		expect(screen.getByText('What is this bracket called?')).toBeInTheDocument();
		expect(screen.getByText('Who plays in it?')).toBeInTheDocument();
		expect(screen.getByText('How does it progress?')).toBeInTheDocument();
	});

	test('explains the two progression choices without jargon', () => {
		renderCreate();
		expect(screen.getByText('Re-seed after every round')).toBeInTheDocument();
		expect(
			screen.getByText(/best team still alive always plays the worst team still alive/)
		).toBeInTheDocument();
		expect(screen.getByText('Fixed bracket')).toBeInTheDocument();
	});

	test('reports how many rounds the chosen team count gives', () => {
		renderCreate();
		expect(screen.getByText(/8 teams gives 3 rounds/)).toBeInTheDocument();
	});

	test('builds the rounds on request and names them from the final backwards', async () => {
		renderCreate();
		await fireEvent.click(screen.getByRole('button', { name: 'Build the rounds' }));

		expect(screen.getByDisplayValue('Quarter-finals')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Semi-finals')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Finals')).toBeInTheDocument();
	});

	test('describes the generated matchups in plain language', async () => {
		renderCreate();
		await fireEvent.click(screen.getByRole('button', { name: 'Build the rounds' }));

		expect(screen.getByText(/#1 seed vs #8 seed/)).toBeInTheDocument();
		expect(
			screen.getByText(/Best team still alive vs 4th best team still alive/)
		).toBeInTheDocument();
	});

	test('shows home field per game and which seed hosts', async () => {
		renderCreate();
		await fireEvent.click(screen.getByRole('button', { name: 'Build the rounds' }));

		expect(screen.getAllByText('G1').length).toBe(3);
		expect(screen.getAllByText(/Higher seed hosts games 1 and 3/).length).toBe(3);
	});

	test('refuses a team count it cannot lay out', () => {
		renderCreate({
			outputStart: 1,
			outputEnd: 6,
			result: 'Standings',
			sourceType: 'Season',
			sourceID: 15,
			rankStart: 1,
			rankEnd: 6
		});
		expect(screen.getByText(/needs 2, 4, 8, 16 teams/)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Build the rounds' })).toBeDisabled();
	});

	test('cannot be saved before the rounds exist', () => {
		renderCreate();
		expect(screen.getByRole('button', { name: 'Create bracket' })).toBeDisabled();
	});

	test('reacts when the seeding range changes', async () => {
		renderCreate();
		expect(screen.getByText(/8 teams gives 3 rounds/)).toBeInTheDocument();

		await fireEvent.change(screen.getByLabelText('Last rank to include'), {
			target: { value: '4' }
		});

		expect(screen.getByText(/4 teams gives 2 rounds/)).toBeInTheDocument();
	});

	test('builds the smaller bracket after the seeding range changes', async () => {
		renderCreate();
		await fireEvent.change(screen.getByLabelText('Last rank to include'), {
			target: { value: '4' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Build the rounds' }));

		expect(screen.getByDisplayValue('Semi-finals')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Finals')).toBeInTheDocument();
		expect(screen.queryByDisplayValue('Quarter-finals')).not.toBeInTheDocument();
	});
});

describe('TournamentBracketForm (editing)', () => {
	test('fills in the existing bracket', () => {
		render(TournamentBracketForm, {
			props: { tournamentId: 6, referenceData: mockReferenceData, existing: makeBracket() }
		});

		expect(screen.getByDisplayValue('Main')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Semi-finals')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
	});

	test('names known teams in the matchup list instead of seed numbers', () => {
		render(TournamentBracketForm, {
			props: { tournamentId: 6, referenceData: mockReferenceData, existing: makeBracket() }
		});
		expect(screen.getByText(/#1 Alphas vs #4 Deltas/)).toBeInTheDocument();
	});

	test('refuses to rebuild rounds while games are scheduled, and says why', () => {
		render(TournamentBracketForm, {
			props: { tournamentId: 6, referenceData: mockReferenceData, existing: makeBracket() }
		});

		expect(
			screen.getByText(/has 1 scheduled game, so the rounds cannot be rebuilt/)
		).toBeInTheDocument();
		expect(screen.queryByText('Rebuild the rounds from these settings')).not.toBeInTheDocument();
	});

	test('blocks deleting a bracket that has games', () => {
		render(TournamentBracketForm, {
			props: { tournamentId: 6, referenceData: mockReferenceData, existing: makeBracket() }
		});
		expect(screen.getByRole('button', { name: 'Delete bracket' })).toBeDisabled();
	});
});
