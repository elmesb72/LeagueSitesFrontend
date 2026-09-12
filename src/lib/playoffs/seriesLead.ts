// The series score as it stood after each game, for the detail rows' lead column.

import type { Series, SeriesGame } from '$lib/models/Playoffs';
import { getWinner, isDecided } from './gameResult';

/**
 * One entry per item in `series.games`, in the same order: the lead after
 * that game ("Hitmen lead 1-0", "Tied 1-1", "Hitmen win 2-1" at the clinch),
 * or null for an unplayed or tied game. Aggregate series show the running run
 * differential instead ("Hitmen +3", "Level"). Games are tallied in
 * gameNumber order regardless of array order; game numbers are not unique
 * (admins can enter two "game 1"s), so ties are broken by date and each row
 * still gets its own entry.
 */
/**
 * Indices of `games` in playing order: game number, then date (unscheduled
 * last), then array position. The API returns games by database id, so a
 * game added later can arrive first.
 */
export function gameOrder(games: SeriesGame[]): number[] {
	const time = (i: number) => {
		const date = games[i].game?.date;
		return date ? new Date(date).getTime() : Number.POSITIVE_INFINITY;
	};
	return games
		.map((_, i) => i)
		.sort((x, y) => games[x].gameNumber - games[y].gameNumber || time(x) - time(y) || x - y);
}

/** A copy of `games` in playing order (see gameOrder). */
export function sortGames(games: SeriesGame[]): SeriesGame[] {
	return gameOrder(games).map((i) => games[i]);
}

export function leadAfterEachGame(series: Series): (string | null)[] {
	const a = series.spot1?.team;
	const b = series.spot2?.team;
	const leads: (string | null)[] = series.games.map(() => null);
	if (!a || !b) return leads;

	const order = gameOrder(series.games);

	if (series.format === 'Aggregate') {
		const runs = new Map<number, number>([
			[a.id, 0],
			[b.id, 0]
		]);
		for (const i of order) {
			const g = series.games[i].game;
			if (!g || g.status.name !== 'Played' || g.scoreHost === null || g.scoreVisitor === null) {
				continue;
			}
			runs.set(g.hostTeam.id, (runs.get(g.hostTeam.id) ?? 0) + g.scoreHost);
			runs.set(g.visitingTeam.id, (runs.get(g.visitingTeam.id) ?? 0) + g.scoreVisitor);
			const diff = (runs.get(a.id) ?? 0) - (runs.get(b.id) ?? 0);
			leads[i] = diff === 0 ? 'Level' : `${diff > 0 ? a.name : b.name} +${Math.abs(diff)}`;
		}
		return leads;
	}

	const toWin = Math.ceil(series.hostOrder.length / 2);
	const wins = new Map<number, number>([
		[a.id, 0],
		[b.id, 0]
	]);
	let decided = false;
	for (const i of order) {
		const g = series.games[i].game;
		if (decided || !g || !isDecided(g)) continue;
		const winner = getWinner(g);
		wins.set(winner.id, (wins.get(winner.id) ?? 0) + 1);
		const wa = wins.get(a.id) ?? 0;
		const wb = wins.get(b.id) ?? 0;
		if (wa === wb) {
			leads[i] = `Tied ${wa}-${wb}`;
			continue;
		}
		const leader = wa > wb ? a : b;
		const [w, l] = wa > wb ? [wa, wb] : [wb, wa];
		decided = w >= toWin;
		leads[i] = `${leader.name} ${decided ? 'win' : 'lead'} ${w}-${l}`;
	}
	return leads;
}
