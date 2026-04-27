import type { Game } from '$lib/models/Game';
import type { StandingsEntry } from '$lib/models/StandingsEntry';

export interface ScoresGameEntry {
	game: Game;
	canEdit: boolean;
}

export const load = async ({ fetch, url }) => {
	const day = url.searchParams.get('day') ?? new Date().toISOString().split('T')[0];

	try {
		const response = await fetch(`/api/Scores?day=${day}`);
		if (!response.ok) {
			return { date: day, games: [] as ScoresGameEntry[], standings: [] as StandingsEntry[], gameCounts: {} };
		}

		const data = await response.json();

		// Build game counts for the week surrounding the selected date
		const selected = new Date(day + 'T12:00:00');
		const dayOfWeek = selected.getDay();
		const weekDays: string[] = [];
		for (let offset = -dayOfWeek; offset < 7 - dayOfWeek; offset++) {
			const d = new Date(selected);
			d.setDate(selected.getDate() + offset);
			weekDays.push(d.toISOString().split('T')[0]);
		}

		const countResponses = await Promise.all(
			weekDays
				.filter((wd) => wd !== day)
				.map((wd) => fetch(`/api/Scores?day=${wd}`).then((r) => (r.ok ? r.json() : null)))
		);

		const gameCounts: Record<string, number> = { [day]: (data.games ?? []).length };
		weekDays
			.filter((wd) => wd !== day)
			.forEach((wd, i) => {
				gameCounts[wd] = countResponses[i]?.games?.length ?? 0;
			});

		return {
			date: day,
			games: (data.games ?? []) as ScoresGameEntry[],
			standings: (data.standings ?? []) as StandingsEntry[],
			gameCounts
		};
	} catch {
		console.error('Failed to fetch scores. Is the backend available?');
		return { date: day, games: [] as ScoresGameEntry[], standings: [] as StandingsEntry[], gameCounts: {} };
	}
};
