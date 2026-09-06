import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import StandingsRulesEditor from './StandingsRulesEditor.svelte';
import {
	defaultStandingsConfig,
	validateStandingsConfig,
	type StandingsComparatorOption
} from '$lib/models/StandingsConfig';

const comparators: StandingsComparatorOption[] = [
	{ name: 'Points', description: 'Points, using the configured win/tie/loss values', groupRestricted: false },
	{ name: 'Wins', description: 'Most wins', groupRestricted: false },
	{ name: 'RunDifferential', description: 'Run differential: runs scored minus runs allowed', groupRestricted: false },
	{ name: 'HeadToHeadPoints', description: 'Points in games between the tied teams, using the configured values', groupRestricted: true },
	{ name: 'HeadToHeadRunDifferential', description: 'Run differential in games between the tied teams', groupRestricted: true }
];

function renderEditor(initial = defaultStandingsConfig()) {
	return render(StandingsRulesEditor, { props: { initial, comparators } });
}

describe('StandingsRulesEditor', () => {
	test('renders point and forfeit inputs with initial values', () => {
		renderEditor({ ...defaultStandingsConfig(), winsValue: 3, forfeitWinnerScore: 9 });

		expect(screen.getByLabelText('Win points')).toHaveValue(3);
		expect(screen.getByLabelText('Tie points')).toHaveValue(1);
		expect(screen.getByLabelText('Loss points')).toHaveValue(0);
		expect(screen.getByLabelText('Forfeit winner score')).toHaveValue(9);
		expect(screen.getByLabelText('Forfeit loser score')).toHaveValue(0);
	});

	test('renders the default tiebreakers in order with descriptions', () => {
		renderEditor();

		const removeButtons = screen.getAllByLabelText(/Remove tiebreaker/);
		expect(removeButtons).toHaveLength(3);
		expect(removeButtons[0]).toHaveAccessibleName('Remove tiebreaker 1 (Points)');
		expect(removeButtons[1]).toHaveAccessibleName('Remove tiebreaker 2 (Wins)');
		expect(removeButtons[2]).toHaveAccessibleName('Remove tiebreaker 3 (Run differential)');
		expect(screen.getByText('Most wins')).toBeInTheDocument();
	});

	test('mentions the alphabetical final fallback', () => {
		renderEditor();

		expect(screen.getByText(/listed alphabetically/)).toBeInTheDocument();
	});

	test('adds a tiebreaker chosen from the select', async () => {
		const { component } = renderEditor();

		await fireEvent.change(screen.getByLabelText('Tiebreaker to add'), {
			target: { value: 'HeadToHeadPoints' }
		});
		await fireEvent.click(screen.getByText('+ Add tiebreaker'));

		expect(component.currentConfig().tiebreakers).toEqual([
			'Points', 'Wins', 'RunDifferential', 'HeadToHeadPoints'
		]);
	});

	test('already-chosen comparators are not offered again', () => {
		renderEditor();

		const select = screen.getByLabelText('Tiebreaker to add') as HTMLSelectElement;
		const offered = [...select.options].map((o) => o.value).filter(Boolean);
		expect(offered).toEqual(['HeadToHeadPoints', 'HeadToHeadRunDifferential']);
	});

	test('removes a tiebreaker', async () => {
		const { component } = renderEditor();

		await fireEvent.click(screen.getByLabelText('Remove tiebreaker 3 (Run differential)'));

		expect(component.currentConfig().tiebreakers).toEqual(['Points', 'Wins']);
	});

	test('reports a problem when every tiebreaker is removed', async () => {
		const { component } = renderEditor({ ...defaultStandingsConfig(), tiebreakers: ['Wins'] });

		await fireEvent.click(screen.getByLabelText('Remove tiebreaker 1 (Wins)'));

		expect(component.validationProblems()).toContain('At least one tiebreaker is required.');
		expect(screen.getByText('At least one tiebreaker is required.')).toBeInTheDocument();
	});

	test('reports a problem when the forfeit loser score meets the winner score', async () => {
		renderEditor();

		await fireEvent.input(screen.getByLabelText('Forfeit loser score'), {
			target: { value: '7' }
		});

		expect(
			screen.getByText('The forfeit winner score must be higher than the loser score.')
		).toBeInTheDocument();
	});

	test('currentConfig reflects edited point values', async () => {
		const { component } = renderEditor();

		await fireEvent.input(screen.getByLabelText('Win points'), { target: { value: '3' } });

		expect(component.currentConfig().winsValue).toBe(3);
	});
});

describe('validateStandingsConfig', () => {
	test('accepts the defaults', () => {
		expect(validateStandingsConfig(defaultStandingsConfig())).toEqual([]);
	});

	test('rejects out-of-range points, bad forfeit pair, and empty tiebreakers together', () => {
		const problems = validateStandingsConfig({
			winsValue: 500,
			tiesValue: 1,
			lossesValue: 0,
			forfeitWinnerScore: 0,
			forfeitLoserScore: 0,
			tiebreakers: []
		});

		expect(problems.length).toBeGreaterThanOrEqual(3);
	});
});
