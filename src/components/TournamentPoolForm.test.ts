import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import TournamentPoolForm from './TournamentPoolForm.svelte';
import {
	makePool,
	makeTournamentDetail,
	mockBoardSources,
	mockReferenceData,
	mockStandingsResponse
} from '../tests/tournamentMocks';

const referenceData = { ...mockReferenceData, seedingSources: mockBoardSources };

describe('TournamentPoolForm', () => {
	beforeEach(() =>
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => ({ ok: true, json: async () => mockStandingsResponse }))
		)
	);
	afterEach(() => vi.unstubAllGlobals());

	test('asks for a name and who plays, and explains that order does not matter', () => {
		render(TournamentPoolForm, {
			props: { tournamentId: 6, referenceData, tournament: makeTournamentDetail() }
		});
		expect(screen.getByText('What is this pool called?')).toBeInTheDocument();
		expect(screen.getByText('Who plays in it?')).toBeInTheDocument();
		expect(screen.getByText(/order does not matter/)).toBeInTheDocument();
	});

	test('uses the seeding board in pool mode: a membership bin, no seeds or connectors', () => {
		const { container } = render(TournamentPoolForm, {
			props: {
				tournamentId: 6,
				referenceData,
				existing: makePool(),
				tournament: makeTournamentDetail()
			}
		});
		expect(screen.getByText('In this pool (2)')).toBeInTheDocument();
		expect(screen.queryByText('Bracket seeds')).toBeNull();
		expect(container.querySelector('.seeding-connectors')).toBeNull();
	});

	test('fills in the existing pool and lists its members by name once standings load', async () => {
		render(TournamentPoolForm, {
			props: {
				tournamentId: 6,
				referenceData,
				existing: makePool(),
				tournament: makeTournamentDetail()
			}
		});
		expect(screen.getByDisplayValue('Pool A')).toBeInTheDocument();
		await waitFor(() =>
			expect(
				screen.getByRole('button', { name: 'Remove Springfield Kappas from the pool' })
			).toBeInTheDocument()
		);
		expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
	});

	test('a new pool starts empty and cannot be saved until it has a team', () => {
		render(TournamentPoolForm, {
			props: { tournamentId: 6, referenceData, tournament: makeTournamentDetail() }
		});
		expect(screen.getByText('In this pool (0)')).toBeInTheDocument();
		expect(screen.getByText('Pick at least one team for the pool.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Create pool' })).toBeDisabled();
	});

	test('"Add all" on the knocked-out teams source fills a consolation pool in one tap', async () => {
		render(TournamentPoolForm, {
			props: { tournamentId: 6, referenceData, tournament: makeTournamentDetail() }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Add all 4' }));
		expect(screen.getByText('In this pool (4)')).toBeInTheDocument();
		expect(screen.queryByText('Pick at least one team for the pool.')).toBeNull();
		expect(screen.getByRole('button', { name: 'Create pool' })).toBeEnabled();
	});

	test('refuses to save without a name', async () => {
		render(TournamentPoolForm, {
			props: {
				tournamentId: 6,
				referenceData,
				existing: makePool(),
				tournament: makeTournamentDetail()
			}
		});
		await fireEvent.input(screen.getByLabelText('Pool name'), { target: { value: '   ' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
		expect(screen.getByText('Give the pool a name.')).toBeInTheDocument();
	});
});
