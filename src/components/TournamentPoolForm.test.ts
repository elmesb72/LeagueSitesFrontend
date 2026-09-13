import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import TournamentPoolForm from './TournamentPoolForm.svelte';
import { goto } from '$app/navigation';
import {
	makeBracket,
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

describe('TournamentPoolForm — what happens after the pool', () => {
	const losersOfQuarterFinals = {
		outputStart: 1,
		outputEnd: 4,
		result: 'Losers' as const,
		sourceType: 'BracketRound' as const,
		sourceID: 41,
		rankStart: 1,
		rankEnd: 4
	};

	function mockApi(created = { id: 99 }) {
		const calls: { url: string; init: RequestInit }[] = [];
		vi.stubGlobal(
			'fetch',
			vi.fn(async (url: string, init?: RequestInit) => {
				if (init?.method === 'POST' || init?.method === 'PUT') {
					calls.push({ url, init });
					return { ok: true, json: async () => created, text: async () => '' };
				}
				return { ok: true, json: async () => mockStandingsResponse };
			})
		);
		return calls;
	}

	beforeEach(() => {
		vi.mocked(goto).mockClear();
	});

	test('offers the three outcomes instead of a History-page checkbox', () => {
		render(TournamentPoolForm, {
			props: { tournamentId: 6, referenceData, tournament: makeTournamentDetail() }
		});
		expect(screen.getByText('What happens after the pool?')).toBeInTheDocument();
		expect(screen.getByRole('radio', { name: /The standings decide it/ })).not.toBeChecked();
		expect(screen.getByRole('radio', { name: /The top teams play a final/ })).not.toBeChecked();
		expect(screen.getByRole('radio', { name: /Nothing more/ })).not.toBeChecked();
		expect(screen.queryByText(/Show the winner of this pool/)).toBeNull();
	});

	test('a new pool has to say what happens after it', async () => {
		mockApi();
		render(TournamentPoolForm, {
			props: { tournamentId: 6, referenceData, tournament: makeTournamentDetail() }
		});
		await fireEvent.input(screen.getByLabelText('Pool name'), { target: { value: 'B Side' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Add all 4' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Create pool' }));
		expect(screen.getByText('Say what happens after the pool.')).toBeInTheDocument();
		expect(goto).not.toHaveBeenCalled();
	});

	test('"The standings decide it" marks the pool as a champion and returns to the tournament', async () => {
		const calls = mockApi();
		render(TournamentPoolForm, {
			props: { tournamentId: 6, referenceData, tournament: makeTournamentDetail() }
		});
		await fireEvent.input(screen.getByLabelText('Pool name'), { target: { value: 'B Side' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Add all 4' }));
		await fireEvent.click(screen.getByRole('radio', { name: /The standings decide it/ }));
		await fireEvent.click(screen.getByRole('button', { name: 'Create pool' }));

		await waitFor(() => expect(goto).toHaveBeenCalled());
		expect(calls[0].url).toBe('/api/Tournament/6/RoundRobin');
		expect(JSON.parse(calls[0].init.body as string)).toMatchObject({
			name: 'B Side',
			historical: true
		});
		expect(goto).toHaveBeenCalledWith('/Executive/Edit/Tournament/6', { invalidateAll: true });
	});

	test('"The top teams play a final" leaves the mark off and carries on to a pre-seeded bracket', async () => {
		const calls = mockApi({ id: 99 });
		render(TournamentPoolForm, {
			props: { tournamentId: 6, referenceData, tournament: makeTournamentDetail() }
		});
		await fireEvent.input(screen.getByLabelText('Pool name'), { target: { value: 'B Side' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Add all 4' }));
		await fireEvent.click(screen.getByRole('radio', { name: /The top teams play a final/ }));
		expect(screen.getByRole('button', { name: 'Create pool and set up the final' })).toBeEnabled();
		await fireEvent.change(screen.getByLabelText('How many teams go on to the final'), {
			target: { value: '4' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Create pool and set up the final' }));

		await waitFor(() => expect(goto).toHaveBeenCalled());
		expect(JSON.parse(calls[0].init.body as string)).toMatchObject({ historical: false });
		expect(goto).toHaveBeenCalledWith(
			'/Executive/Edit/Tournament/6/AddBracket?afterPool=99&top=4',
			{ invalidateAll: true }
		);
	});

	test('"Nothing more" leaves the mark off and returns to the tournament', async () => {
		const calls = mockApi();
		render(TournamentPoolForm, {
			props: { tournamentId: 6, referenceData, tournament: makeTournamentDetail() }
		});
		await fireEvent.input(screen.getByLabelText('Pool name'), { target: { value: 'B Side' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Add all 4' }));
		await fireEvent.click(screen.getByRole('radio', { name: /Nothing more/ }));
		await fireEvent.click(screen.getByRole('button', { name: 'Create pool' }));

		await waitFor(() =>
			expect(goto).toHaveBeenCalledWith('/Executive/Edit/Tournament/6', { invalidateAll: true })
		);
		expect(JSON.parse(calls[0].init.body as string)).toMatchObject({ historical: false });
	});

	test('an existing pool reflects its state: marked → standings decide it; feeding a bracket → a final, named', () => {
		const detail = makeTournamentDetail();
		const marked = render(TournamentPoolForm, {
			props: {
				tournamentId: 6,
				referenceData,
				existing: makePool({ historical: true }),
				tournament: detail
			}
		});
		expect(screen.getByRole('radio', { name: /The standings decide it/ })).toBeChecked();
		marked.unmount();

		const bFinal = makeBracket({
			id: 13,
			name: 'B Final',
			seeding: [
				{
					outputStart: 1,
					outputEnd: 2,
					result: 'Standings',
					sourceType: 'TournamentRoundRobin',
					sourceID: 7,
					rankStart: 1,
					rankEnd: 2
				}
			]
		});
		const withFinal = makeTournamentDetail({ brackets: [...detail.brackets, bFinal] });
		render(TournamentPoolForm, {
			props: {
				tournamentId: 6,
				referenceData,
				existing: makePool({ historical: false }),
				tournament: withFinal
			}
		});
		expect(screen.getByRole('radio', { name: /The top teams play a final/ })).toBeChecked();
		expect(screen.getByRole('link', { name: 'B Final' })).toHaveAttribute(
			'href',
			'/Executive/Edit/Tournament/6/Bracket/13'
		);
		expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
	});

	test('starts from the rule it was linked with and says so', () => {
		render(TournamentPoolForm, {
			props: {
				tournamentId: 6,
				referenceData,
				tournament: makeTournamentDetail(),
				defaultSeeding: losersOfQuarterFinals,
				prefillNote:
					'Pre-filled with the 4 teams knocked out in the Quarter-finals of the Main bracket.'
			}
		});
		expect(screen.getByText(/Pre-filled with the 4 teams knocked out/)).toBeInTheDocument();
		expect(screen.getByText('In this pool (4)')).toBeInTheDocument();
	});
});
