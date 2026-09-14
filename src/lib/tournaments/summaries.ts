// Helpers for the public tournament pages: where a tournament lives, how to
// describe its progress, and the champion-banner wording for a cup. Pure.

import type {
	Bracket,
	TournamentData,
	TournamentKind,
	TournamentLink,
	TournamentSummary
} from '$lib/models/Playoffs';
import { formatDate } from '$lib/utils/date';

/** The public page for a tournament: the playoffs are addressed by year, a cup by id. */
export function tournamentHref(kind: TournamentKind, id: number, year: number | null): string {
	return kind === 'playoffs' && year !== null ? `/Playoffs?year=${year}` : `/Tournaments/${id}`;
}

/** A season's name without its leading year: "2027 Canada Day Cup" → "Canada Day Cup". */
export function withoutYear(name: string, year: number): string {
	const prefix = `${year} `;
	return name.startsWith(prefix) ? name.slice(prefix.length) : name;
}

/** "Playoffs", or the cup's name without the year ("Canada Day Cup"). */
export function shortNameOf(summary: TournamentSummary): string {
	if (summary.kind === 'playoffs') return 'Playoffs';
	return withoutYear(summary.name, summary.season.year);
}

export function toLinks(summaries: TournamentSummary[]): TournamentLink[] {
	return summaries.map((s) => ({
		seasonId: s.season.id,
		tournamentId: s.id,
		name: s.name,
		shortName: shortNameOf(s),
		kind: s.kind
	}));
}

/** "Won by X" / "Titles: …" once decided; otherwise how far along the games are. */
export function progressText(summary: TournamentSummary): string {
	if (summary.titles.length === 1) return `Won by ${summary.titles[0].team.fullName}`;
	if (summary.titles.length > 1) {
		return summary.titles.map((t) => `${t.label}: ${t.team.fullName}`).join(', ');
	}
	if (summary.decided) return 'Decided';
	if (summary.gamesScheduled === 0) return 'No games scheduled yet';
	return `${summary.gamesPlayed} of ${summary.gamesScheduled} game${summary.gamesScheduled === 1 ? '' : 's'} played`;
}

/** "Jul 1 – Jul 3" from the scheduled games, else the start date on its own. */
export function dateRangeText(summary: TournamentSummary): string {
	if (summary.firstGame && summary.lastGame) {
		const first = formatDate(summary.firstGame);
		const last = formatDate(summary.lastGame);
		return first === last ? first : `${first} \u2013 ${last}`;
	}
	return `From ${formatDate(summary.startDate)}`;
}

/**
 * The champion banner's kicker for a cup: "2027 Canada Day Cup Champions" when
 * the cup has one marked stage, "2027 Canada Day Cup · Main Champions" when it
 * has several. (The playoffs keep their default "{year} {bracket} Bracket Champions".)
 */
export function championHeadingFor(tournament: TournamentData): (bracket: Bracket) => string {
	const marked = tournament.brackets.filter((b) => b.historical).length;
	return (bracket) =>
		marked > 1
			? `${tournament.name} \u00b7 ${bracket.name} Champions`
			: `${tournament.name} Champions`;
}

/** The year's tournaments, or nothing when the request fails — a strip that is missing is not an error. */
export async function loadTournamentSummaries(
	fetchFn: typeof fetch,
	year: number | null
): Promise<TournamentSummary[]> {
	try {
		const response = await fetchFn(`/api/Tournaments${year ? `?year=${year}` : ''}`);
		if (!response.ok) return [];
		return (await response.json()) as TournamentSummary[];
	} catch {
		return [];
	}
}
