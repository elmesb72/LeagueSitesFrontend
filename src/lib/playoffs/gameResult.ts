// Who won a playoff game. Shared by the series detail rows, the series-lead
// column and the bracket connectors so the three can never disagree.
//
// Backend status names are 'Played', 'Forfeit (Home)' and 'Forfeit (Away)';
// the forfeit names say which team forfeited, and forfeit scores are null.

import type { Game } from '$lib/models/Game';
import type { Team } from '$lib/models/Team';

export function isForfeit(game: Game): boolean {
	return game.status.name.startsWith('Forfeit');
}

/** A game with a definite winner: a forfeit, or a played game with unequal scores. */
export function isDecided(game: Game): boolean {
	if (isForfeit(game)) return true;
	return game.status.name === 'Played' && game.scoreHost !== game.scoreVisitor;
}

/** A played game that ended level (called for darkness, say). */
export function isTied(game: Game): boolean {
	return game.status.name === 'Played' && game.scoreHost === game.scoreVisitor;
}

export function getWinner(game: Game): Team {
	if (isForfeit(game)) {
		return game.status.name === 'Forfeit (Home)' ? game.visitingTeam : game.hostTeam;
	}
	return (game.scoreHost ?? 0) > (game.scoreVisitor ?? 0) ? game.hostTeam : game.visitingTeam;
}

export function getLoser(game: Game): Team {
	return getWinner(game).id === game.hostTeam.id ? game.visitingTeam : game.hostTeam;
}

/**
 * Score shown beside the winner or loser. Forfeit scores are null in the
 * database (the standings substitute the league's configured forfeit score),
 * so forfeits show FW/FL markers rather than invented numbers.
 */
export function scoreText(game: Game, side: 'winner' | 'loser'): string {
	if (isForfeit(game)) return side === 'winner' ? 'FW' : 'FL';
	const host = game.scoreHost ?? 0;
	const visitor = game.scoreVisitor ?? 0;
	return String(side === 'winner' ? Math.max(host, visitor) : Math.min(host, visitor));
}
