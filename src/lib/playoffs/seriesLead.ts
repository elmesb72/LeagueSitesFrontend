// The series score as it stood after each game, for the detail rows' lead column.

import type { Series } from '$lib/models/Playoffs';
import { getWinner, isDecided } from './gameResult';

/**
 * One entry per item in `series.games`, in the same order: the lead after
 * that game ("Hitmen lead 1-0", "Tied 1-1", "Hitmen win 2-1" at the clinch),
 * or null for an unplayed or tied game. Aggregate series show the running run
 * differential instead ("Hitmen +3", "Level"). Games are tallied in
 * gameNumber order regardless of array order.
 */
export function leadAfterEachGame(series: Series): (string | null)[] {
	const a = series.spot1?.team;
	const b = series.spot2?.team;
	if (!a || !b) return series.games.map(() => null);

	const ordered = [...series.games].sort((x, y) => x.gameNumber - y.gameNumber);
	const byGameNumber = new Map<number, string | null>();

	if (series.format === 'Aggregate') {
		const runs = new Map<number, number>([
			[a.id, 0],
			[b.id, 0]
		]);
		for (const sg of ordered) {
			const g = sg.game;
			if (!g || g.status.name !== 'Played' || g.scoreHost === null || g.scoreVisitor === null) {
				byGameNumber.set(sg.gameNumber, null);
				continue;
			}
			runs.set(g.hostTeam.id, (runs.get(g.hostTeam.id) ?? 0) + g.scoreHost);
			runs.set(g.visitingTeam.id, (runs.get(g.visitingTeam.id) ?? 0) + g.scoreVisitor);
			const diff = (runs.get(a.id) ?? 0) - (runs.get(b.id) ?? 0);
			byGameNumber.set(
				sg.gameNumber,
				diff === 0 ? 'Level' : `${diff > 0 ? a.name : b.name} +${Math.abs(diff)}`
			);
		}
		return series.games.map((sg) => byGameNumber.get(sg.gameNumber) ?? null);
	}

	const toWin = Math.ceil(series.hostOrder.length / 2);
	const wins = new Map<number, number>([
		[a.id, 0],
		[b.id, 0]
	]);
	let decided = false;
	for (const sg of ordered) {
		const g = sg.game;
		if (decided || !g || !isDecided(g)) {
			byGameNumber.set(sg.gameNumber, null);
			continue;
		}
		const winner = getWinner(g);
		wins.set(winner.id, (wins.get(winner.id) ?? 0) + 1);
		const wa = wins.get(a.id) ?? 0;
		const wb = wins.get(b.id) ?? 0;
		if (wa === wb) {
			byGameNumber.set(sg.gameNumber, `Tied ${wa}-${wb}`);
			continue;
		}
		const leader = wa > wb ? a : b;
		const [w, l] = wa > wb ? [wa, wb] : [wb, wa];
		decided = w >= toWin;
		byGameNumber.set(sg.gameNumber, `${leader.name} ${decided ? 'win' : 'lead'} ${w}-${l}`);
	}
	return series.games.map((sg) => byGameNumber.get(sg.gameNumber) ?? null);
}
