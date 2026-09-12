import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import PlayoffBracket from './PlayoffBracket.svelte';
import { makeFourTeamBracket, mockBracket } from '../tests/playoffMocks';

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

	test('shows each round\u2019s series format under its name', () => {
		const { container } = render(PlayoffBracket, { props: { bracket: mockBracket } });
		const formats = [...container.querySelectorAll('.tournament-round-format')].map((el) =>
			el.textContent!.trim()
		);
		expect(formats).toEqual(['Best of 5', 'Best of 5']);
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

	test('is a labelled list of rounds, each a list of series, with no per-round CSS classes', () => {
		const { container } = render(PlayoffBracket, { props: { bracket: mockBracket } });
		const section = container.querySelector('section.tournament-bracket')!;
		expect(section.getAttribute('aria-labelledby')).toBe('championship-bracket-title');
		expect(
			screen.getByRole('heading', { level: 2, name: 'Championship Bracket' })
		).toBeInTheDocument();
		const rounds = container.querySelectorAll('ol.tournament-round-list > li.tournament-round');
		expect(rounds).toHaveLength(2);
		expect(
			rounds[0].querySelectorAll('ol.tournament-series-list > li.tournament-series')
		).toHaveLength(2);
		expect(container.querySelector('[class*="round-1"], [class*="round-2"]')).toBeNull();
	});

	test('highlights series winner', () => {
		const { container } = render(PlayoffBracket, { props: { bracket: mockBracket } });
		expect(container.querySelector('.tournament-series-winner')).not.toBeNull();
	});
});

describe('PlayoffBracket (four-team fixture)', () => {
	const NOW = new Date('2026-09-05T12:00:00');

	test('series numbers link to their detail anchors once both teams are known, otherwise stay plain', () => {
		const { container } = render(PlayoffBracket, {
			props: { bracket: makeFourTeamBracket({ played: 'none' }), now: NOW }
		});
		const numbers = [...container.querySelectorAll('.tournament-series-number')];
		expect(numbers.map((n) => n.tagName)).toEqual(['A', 'A', 'SPAN']);
		expect(numbers[0].getAttribute('href')).toBe('#main-series-1');
		expect(screen.getByRole('link', { name: 'Series 1 details' })).toBeInTheDocument();
	});

	test('every series carries a text label with seeds, teams and status', () => {
		const { container } = render(PlayoffBracket, {
			props: { bracket: makeFourTeamBracket({ played: 'semis' }), now: NOW }
		});
		const labels = [...container.querySelectorAll('li.tournament-series')].map((li) =>
			li.getAttribute('aria-label')
		);
		expect(labels[0]).toBe(
			'Series 1: #1 Alpha City Alphas vs #4 Delta Bay Deltas, Delta Bay Deltas win 2-1'
		);
		expect(labels[2]).toBe('Series 3: #2 Beta Town Betas vs #4 Delta Bay Deltas, Series tied 0-0');
	});

	test('unresolved spots keep a full text label behind the short visual one', () => {
		const { container } = render(PlayoffBracket, {
			props: { bracket: makeFourTeamBracket({ format: 'Re-seed', played: 'none' }), now: NOW }
		});
		const final = container.querySelector('[data-series="3"]')!;
		expect(final.querySelectorAll('.playoff-sr-only')[0].textContent).toBe(
			'Rank 1 of remaining teams'
		);
		expect(final.textContent).toContain('#1 remaining');
	});

	test('the winning spot says so in text, not only by outline', () => {
		render(PlayoffBracket, {
			props: { bracket: makeFourTeamBracket({ played: 'semis' }), now: NOW }
		});
		expect(screen.getByRole('link', { name: '#4 Delta Bay Deltas, winner' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: '#1 Alpha City Alphas' })).toBeInTheDocument();
	});

	test('draws one connector per fed spot, consolation lines dashed, in team colours', async () => {
		const { container } = render(PlayoffBracket, {
			props: { bracket: makeFourTeamBracket({ thirdPlace: true, played: 'semis' }), now: NOW }
		});
		await waitFor(() =>
			expect(container.querySelectorAll('.tournament-connectors path')).toHaveLength(4)
		);
		expect(container.querySelectorAll('path.tournament-connector-consolation')).toHaveLength(2);
		expect(container.querySelectorAll('path.tournament-connector-advance')).toHaveLength(2);
		const strokes = [
			...container.querySelectorAll<SVGPathElement>('.tournament-connectors path')
		].map((p) => p.style.stroke);
		expect(strokes).toContain('rgb(0, 51, 102)'); // #003366, Alphas, into the 3rd-place game
		expect(strokes).toContain('rgb(204, 0, 0)'); // #CC0000, Betas, into the final
	});

	test('a re-seeded final has no connectors until the semi-finals are decided', async () => {
		const { container } = render(PlayoffBracket, {
			props: { bracket: makeFourTeamBracket({ format: 'Re-seed', played: 'none' }), now: NOW }
		});
		await new Promise((r) => setTimeout(r, 20));
		expect(container.querySelectorAll('.tournament-connectors path')).toHaveLength(0);
	});

	test('a fixed bracket draws its lines before anything is played, in the neutral colour', async () => {
		const { container } = render(PlayoffBracket, {
			props: { bracket: makeFourTeamBracket({ format: 'Fixed', played: 'none' }), now: NOW }
		});
		await waitFor(() =>
			expect(container.querySelectorAll('.tournament-connectors path')).toHaveLength(2)
		);
		expect(
			container.querySelector<SVGPathElement>('.tournament-connectors path')!.style.stroke
		).toBe('var(--text-soft)');
	});

	test('redraws the connectors when a different bracket is passed to the same instance (year switch)', async () => {
		// The page keeps one PlayoffBracket per position across years, so a year
		// change arrives as a prop update, not a fresh mount.
		const { container, rerender } = render(PlayoffBracket, {
			props: { bracket: makeFourTeamBracket({ format: 'Re-seed', played: 'none' }), now: NOW }
		});
		await new Promise((r) => setTimeout(r, 20));
		expect(container.querySelectorAll('.tournament-connectors path')).toHaveLength(0);

		await rerender({
			bracket: makeFourTeamBracket({ thirdPlace: true, played: 'semis' }),
			now: NOW
		});
		await waitFor(() =>
			expect(container.querySelectorAll('.tournament-connectors path')).toHaveLength(4)
		);
		const strokes = [
			...container.querySelectorAll<SVGPathElement>('.tournament-connectors path')
		].map((p) => p.style.stroke);
		expect(strokes).toContain('rgb(204, 0, 0)'); // Betas, from the new data
		expect(container.querySelector('[data-spot="3-1"]')!.textContent).toContain('Deltas'); // upset winner in the final

		await rerender({
			bracket: makeFourTeamBracket({ format: 'Re-seed', played: 'none' }),
			now: NOW
		});
		await waitFor(() =>
			expect(container.querySelectorAll('.tournament-connectors path')).toHaveLength(0)
		);
	});

	test('marks a live series with its next game date and sets the gap width', () => {
		const { container } = render(PlayoffBracket, {
			props: { bracket: makeFourTeamBracket({ played: 'semis' }), now: NOW }
		});
		const final = container.querySelector('[data-series="3"]')!;
		expect(final.querySelector('.tournament-series-next')?.textContent).toBe('Thu 10');
		expect(container.querySelector('[data-series="1"] .tournament-series-next')).toBeNull();
		expect(container.querySelector('.tournament-bracket-rounds')!.getAttribute('style')).toContain(
			'--bracket-gap: 56px'
		);
	});
});
