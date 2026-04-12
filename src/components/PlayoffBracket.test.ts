import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import PlayoffBracket from './PlayoffBracket.svelte';
import { mockBracket } from '../tests/playoffMocks';

describe('PlayoffBracket', () => {
	test('renders bracket name', () => {
		render(PlayoffBracket, { props: { bracket: mockBracket } });
		expect(screen.getByText('Championship Bracket')).toBeInTheDocument();
	});

	test('renders round names', () => {
		render(PlayoffBracket, { props: { bracket: mockBracket } });
		expect(screen.getByText('Semifinals')).toBeInTheDocument();
		expect(screen.getByText('Finals')).toBeInTheDocument();
	});

	test('renders series numbers', () => {
		const { container } = render(PlayoffBracket, { props: { bracket: mockBracket } });
		const numbers = container.querySelectorAll('.tournament-series-number');
		expect(numbers.length).toBe(3);
		expect(numbers[0].textContent?.trim()).toBe('1');
		expect(numbers[1].textContent?.trim()).toBe('2');
		expect(numbers[2].textContent?.trim()).toBe('3');
	});

	test('renders team names in matchups', () => {
		render(PlayoffBracket, { props: { bracket: mockBracket } });
		expect(screen.getAllByText('Alphas').length).toBeGreaterThanOrEqual(2);
		expect(screen.getAllByText('Betas').length).toBeGreaterThanOrEqual(2);
	});

	test('renders TBD for unresolved spots', () => {
		render(PlayoffBracket, { props: { bracket: mockBracket } });
		expect(screen.getAllByText('TBD').length).toBeGreaterThanOrEqual(1);
	});

	test('renders winner of placeholder', () => {
		render(PlayoffBracket, { props: { bracket: mockBracket } });
		expect(screen.getByText('Winner of 1')).toBeInTheDocument();
	});

	test('applies round CSS classes', () => {
		const { container } = render(PlayoffBracket, { props: { bracket: mockBracket } });
		expect(container.querySelector('.round-1')).not.toBeNull();
		expect(container.querySelector('.round-2')).not.toBeNull();
	});

	test('highlights series winner', () => {
		const { container } = render(PlayoffBracket, { props: { bracket: mockBracket } });
		expect(container.querySelector('.tournament-series-winner')).not.toBeNull();
	});
});
