import type { TournamentData } from '$lib/models/Playoffs';
import type { PlayoffsState } from '../../Playoffs/+page';
import { loadTournamentSummaries } from '$lib/tournaments/summaries';

async function loadTournament(
	fetchFn: typeof fetch,
	id: string
): Promise<{ tournament: TournamentData | null; state: PlayoffsState }> {
	try {
		const response = await fetchFn(`/api/Tournaments/${id}`);
		if (response.status === 404) return { tournament: null, state: 'notFound' };
		if (!response.ok) return { tournament: null, state: 'unavailable' };
		const tournament = (await response.json()) as TournamentData;
		const empty = tournament.brackets.length === 0 && tournament.roundRobins.length === 0;
		return { tournament, state: empty ? 'empty' : 'ok' };
	} catch {
		console.error('Failed to fetch the tournament. Is the backend available?');
		return { tournament: null, state: 'unavailable' };
	}
}

/** Executives get a link to the tournament editor; the lookup doubles as the permission check (403 → null). */
async function loadEditUrl(
	fetchFn: typeof fetch,
	seasonId: number | undefined,
	signedIn: boolean
): Promise<string | null> {
	if (!signedIn || !seasonId) return null;
	try {
		const response = await fetchFn(`/api/Tournament/ForSeason/${seasonId}`);
		if (!response.ok) return null;
		const { id } = (await response.json()) as { id: number };
		return `/Executive/Edit/Tournament/${id}`;
	} catch {
		return null;
	}
}

export const load = async ({ fetch, params, parent }) => {
	const [{ tournament, state }, { user }] = await Promise.all([
		loadTournament(fetch, params.id),
		parent()
	]);
	const year = tournament?.season?.year ?? null;
	const [editUrl, others] = await Promise.all([
		loadEditUrl(fetch, tournament?.season?.id, user?.isAuthenticated ?? false),
		year ? loadTournamentSummaries(fetch, year) : Promise.resolve([])
	]);
	return { tournament, state, editUrl, others };
};
