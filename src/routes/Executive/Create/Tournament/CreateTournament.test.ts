import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import CreateTournamentPage from './+page.svelte';
import { goto } from '$app/navigation';

const data = {
	redirect: null,
	siteConfig: {
		siteName: 'Test League',
		shortName: 'TL',
		home: { aboutBlurb: '', executives: {}, socials: {}, links: {}, information: {} },
		apiKeys: { googleMaps: '' }
	}
};

describe('Create tournament', () => {
	const calls: { url: string; init: RequestInit }[] = [];
	beforeEach(() => {
		calls.length = 0;
		vi.mocked(goto).mockClear();
		vi.stubGlobal(
			'fetch',
			vi.fn(async (url: string, init: RequestInit) => {
				calls.push({ url, init });
				return {
					ok: true,
					json: async () => ({ seasonID: 302, tournamentID: 31 }),
					text: async () => ''
				};
			})
		);
	});
	afterEach(() => vi.unstubAllGlobals());

	test('has the playoffs setup shape plus a name and a start date, and says games stay out of the standings', () => {
		render(CreateTournamentPage, { props: { data } });
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			'Set up a mid-season tournament'
		);
		expect(screen.getByText(/do not count in the regular-season standings/)).toBeInTheDocument();
		expect(screen.getByText('Next you will:')).toBeInTheDocument();
		expect(screen.getByLabelText('Tournament name')).toHaveAttribute(
			'placeholder',
			'Canada Day Cup'
		);
		expect(screen.getByLabelText('Start date')).toHaveValue(new Date().toISOString().slice(0, 10));
	});

	test('needs a name before it will create anything', async () => {
		render(CreateTournamentPage, { props: { data } });
		await fireEvent.click(screen.getByRole('button', { name: 'Create tournament' }));
		expect(screen.getByText('Give the tournament a name.')).toBeInTheDocument();
		expect(calls).toHaveLength(0);
	});

	test('posts the trimmed name and date, then opens the new tournament page', async () => {
		render(CreateTournamentPage, { props: { data } });
		await fireEvent.input(screen.getByLabelText('Tournament name'), {
			target: { value: '  Canada Day Cup ' }
		});
		await fireEvent.input(screen.getByLabelText('Start date'), { target: { value: '2027-07-01' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Create tournament' }));

		await waitFor(() =>
			expect(goto).toHaveBeenCalledWith('/Executive/Edit/Tournament/31', { invalidateAll: true })
		);
		expect(calls[0].url).toBe('/api/Executive/Season/Tournament');
		expect(calls[0].init.method).toBe('POST');
		expect(JSON.parse(calls[0].init.body as string)).toEqual({
			name: 'Canada Day Cup',
			startDate: '2027-07-01'
		});
	});

	test('shows the name the season will get, with the year put in front exactly once', async () => {
		render(CreateTournamentPage, { props: { data } });
		await fireEvent.input(screen.getByLabelText('Start date'), { target: { value: '2027-07-01' } });
		expect(screen.getByText(/The year is added for you/)).toBeInTheDocument();

		await fireEvent.input(screen.getByLabelText('Tournament name'), {
			target: { value: 'Canada Day Cup' }
		});
		expect(screen.getByText('2027 Canada Day Cup')).toBeInTheDocument();

		await fireEvent.input(screen.getByLabelText('Tournament name'), {
			target: { value: '2027 Canada Day Cup' }
		});
		expect(screen.getByText('2027 Canada Day Cup')).toBeInTheDocument();
		expect(screen.queryByText(/2027 2027/)).toBeNull();
	});
	test('shows the backend refusal', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => ({
				ok: false,
				text: async () => 'There is already a 2027 tournament called "Canada Day Cup".'
			}))
		);
		render(CreateTournamentPage, { props: { data } });
		await fireEvent.input(screen.getByLabelText('Tournament name'), {
			target: { value: 'Canada Day Cup' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Create tournament' }));
		await waitFor(() => expect(screen.getByText(/already a 2027 tournament/)).toBeInTheDocument());
		expect(goto).not.toHaveBeenCalled();
	});
});
