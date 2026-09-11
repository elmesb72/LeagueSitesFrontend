// "When do they play next?" — the next scheduled game of every live series.

import type { Game } from '$lib/models/Game';
import type { Bracket, BracketRound, PlayoffsData, Series } from '$lib/models/Playoffs';

export interface ComingUpEntry {
	bracket: Bracket;
	round: BracketRound;
	series: Series;
	game: Game;
}

function startOfDay(now: Date): Date {
	const d = new Date(now);
	d.setHours(0, 0, 0, 0);
	return d;
}

/**
 * The earliest upcoming game of a series whose teams are both known and that
 * has no winner yet. A game dated today counts all day, so a fan checking at
 * 9pm still sees tonight's 8:30 game rather than nothing.
 */
export function nextGameOf(series: Series, now: Date = new Date()): Game | null {
	if (!series.spot1?.team || !series.spot2?.team || series.winner) return null;
	const floor = startOfDay(now).getTime();
	const candidates = series.games
		.map((sg) => sg.game)
		.filter(
			(g): g is Game =>
				g !== null && g.status.name === 'Upcoming' && new Date(g.date).getTime() >= floor
		)
		.sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime());
	return candidates[0] ?? null;
}

/** Every live series' next game across all brackets, soonest first. Pools list their own games by date already. */
export function comingUp(playoffs: PlayoffsData, now: Date = new Date()): ComingUpEntry[] {
	const out: ComingUpEntry[] = [];
	for (const bracket of playoffs.brackets) {
		for (const round of bracket.rounds) {
			for (const series of round.series) {
				const game = nextGameOf(series, now);
				if (game) out.push({ bracket, round, series, game });
			}
		}
	}
	return out.sort((x, y) => new Date(x.game.date).getTime() - new Date(y.game.date).getTime());
}
