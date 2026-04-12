import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import HistoryPage from './+page.svelte';
import type { HistoryYear } from '$lib/models/HistoryYear';

const completedYear: HistoryYear = {
	calendarYear: 2025,
	exceptionYearDescription: null,
	champion: 'Springfield Isotopes',
	championAbbreviation: 'SPR',
	bestRecord: 'Springfield Isotopes',
	bestRecordAbbreviation: 'SPR',
	bestRecordResults: '(12-2-0)',
	playoffsComplete: true,
	regularSeasonComplete: true
};

const inProgressYear: HistoryYear = {
	calendarYear: 2026,
	exceptionYearDescription: null,
	champion: null,
	championAbbreviation: null,
	bestRecord: null,
	bestRecordAbbreviation: null,
	bestRecordResults: null,
	playoffsComplete: false,
	regularSeasonComplete: false
};

const exceptionYear: HistoryYear = {
	calendarYear: 2020,
	exceptionYearDescription: 'Season cancelled',
	champion: null,
	championAbbreviation: null,
	bestRecord: null,
	bestRecordAbbreviation: null,
	bestRecordResults: null,
	playoffsComplete: false,
	regularSeasonComplete: false
};

const mockYears = [inProgressYear, completedYear, exceptionYear];

describe('History Page', () => {
	test('renders heading', () => {
		render(HistoryPage, { props: { data: { years: mockYears } } });
		expect(screen.getByText('League History')).toBeInTheDocument();
	});

	test('renders column headers', () => {
		render(HistoryPage, { props: { data: { years: mockYears } } });
		expect(screen.getByText('Year')).toBeInTheDocument();
		expect(screen.getByText('Champion')).toBeInTheDocument();
		expect(screen.getByText('Best Record')).toBeInTheDocument();
	});

	test('renders year links to standings', () => {
		render(HistoryPage, { props: { data: { years: mockYears } } });
		const links = screen.getAllByRole('link');
		expect(links.some(l => l.getAttribute('href') === '/Standings?year=2025')).toBe(true);
	});

	test('completed year shows champion with link to playoffs', () => {
		render(HistoryPage, { props: { data: { years: [completedYear] } } });
		const champLink = screen.getByText('Springfield Isotopes');
		expect(champLink.closest('a')?.getAttribute('href')).toBe('/Playoffs?year=2025');
	});

	test('completed year shows best record with results', () => {
		render(HistoryPage, { props: { data: { years: [completedYear] } } });
		expect(screen.getByText(/\(12-2-0\)/)).toBeInTheDocument();
	});

	test('in-progress year shows dashes', () => {
		render(HistoryPage, { props: { data: { years: [inProgressYear] } } });
		const dashes = screen.getAllByText('-');
		expect(dashes.length).toBe(2);
	});

	test('exception year shows description instead of champion', () => {
		render(HistoryPage, { props: { data: { years: [exceptionYear] } } });
		expect(screen.getByText('Season cancelled')).toBeInTheDocument();
	});

	test('exception year shows blank for best record', () => {
		const { container } = render(HistoryPage, { props: { data: { years: [exceptionYear] } } });
		// The best record cell should have &nbsp; (empty)
		const cells = container.querySelectorAll('td');
		const bestRecordCell = cells[2]; // 3rd td in the row
		expect(bestRecordCell.textContent?.trim()).toBe('');
	});

	test('shows empty message when no years', () => {
		render(HistoryPage, { props: { data: { years: [] } } });
		expect(screen.getByText('No history data available.')).toBeInTheDocument();
	});

	test('does not render table when no years', () => {
		const { container } = render(HistoryPage, { props: { data: { years: [] } } });
		expect(container.querySelector('table')).toBeNull();
	});
});
