import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import ScoresDatePicker from './ScoresDatePicker.svelte';

const baseProps = {
	selectedDate: '2026-04-15',
	gameCounts: {
		'2026-04-12': 0,
		'2026-04-13': 2,
		'2026-04-14': 1,
		'2026-04-15': 3,
		'2026-04-16': 0,
		'2026-04-17': 1,
		'2026-04-18': 0
	}
};

describe('ScoresDatePicker', () => {
	test('renders month and year', () => {
		render(ScoresDatePicker, { props: baseProps });
		expect(screen.getByText(/Apr 2026/)).toBeInTheDocument();
	});

	test('renders all 7 days of the week', () => {
		render(ScoresDatePicker, { props: baseProps });
		expect(screen.getByText('Sun')).toBeInTheDocument();
		expect(screen.getByText('Mon')).toBeInTheDocument();
		expect(screen.getByText('Tue')).toBeInTheDocument();
		expect(screen.getByText('Wed')).toBeInTheDocument();
		expect(screen.getByText('Thu')).toBeInTheDocument();
		expect(screen.getByText('Fri')).toBeInTheDocument();
		expect(screen.getByText('Sat')).toBeInTheDocument();
	});

	test('highlights the selected day', () => {
		const { container } = render(ScoresDatePicker, { props: baseProps });
		const selectedDay = container.querySelector('.scores-date-picker-selected-day');
		expect(selectedDay).not.toBeNull();
		expect(selectedDay?.textContent).toContain('15');
	});

	test('marks days with no games', () => {
		const { container } = render(ScoresDatePicker, { props: baseProps });
		const noGameDays = container.querySelectorAll('.scores-date-picker-day-no-games');
		expect(noGameDays.length).toBe(3); // Apr 12, 16, 18
	});

	test('shows game counts for each day', () => {
		render(ScoresDatePicker, { props: baseProps });
		expect(screen.getByText('3 games')).toBeInTheDocument();
		expect(screen.getByText('2 games')).toBeInTheDocument();
		expect(screen.getAllByText('1 game').length).toBe(2);
		expect(screen.getAllByText('0 games').length).toBe(3);
	});

	test('week back link goes 7 days earlier', () => {
		render(ScoresDatePicker, { props: baseProps });
		const backLink = screen.getByText('<');
		expect(backLink.closest('a')?.getAttribute('href')).toBe('/Scores?day=2026-04-08');
	});

	test('week ahead link goes 7 days later', () => {
		render(ScoresDatePicker, { props: baseProps });
		const aheadLink = screen.getByText('>');
		expect(aheadLink.closest('a')?.getAttribute('href')).toBe('/Scores?day=2026-04-22');
	});

	test('each day links to the correct date', () => {
		const { container } = render(ScoresDatePicker, { props: baseProps });
		const dayLinks = container.querySelectorAll('.scores-date-picker-days a');
		expect(dayLinks.length).toBe(7);
		expect(dayLinks[0].getAttribute('href')).toBe('/Scores?day=2026-04-12');
		expect(dayLinks[3].getAttribute('href')).toBe('/Scores?day=2026-04-15');
		expect(dayLinks[6].getAttribute('href')).toBe('/Scores?day=2026-04-18');
	});
});
