// Seeding board view model.
//
// The API speaks in SeedGroup rules ("seeds 1-7 come from ranks 2-8 of source X").
// The board edits a per-seed table instead and converts both ways; see adapters.ts.
// Nothing here is sent to the backend as-is.

import type {
	SeedGroup,
	SeedResult,
	SeedSourceType,
	SeedingSourceOption
} from '$lib/models/Tournament';
import type { Team } from '$lib/models/Team';

/** Identity of a seeding source. Same key the rule table has always used. */
export function sourceKey(option: {
	result: string;
	sourceType: string;
	sourceID: number;
}): string {
	return `${option.result}|${option.sourceType}|${option.sourceID}`;
}

export function parseSourceKey(key: string): {
	result: SeedResult;
	sourceType: SeedSourceType;
	sourceID: number;
} {
	const [result, sourceType, sourceID] = key.split('|');
	return {
		result: result as SeedResult,
		sourceType: sourceType as SeedSourceType,
		sourceID: Number(sourceID)
	};
}

/** One rank of one source, assigned to a seed. */
export interface Assignment {
	sourceKey: string;
	rank: number;
}

export function sameAssignment(a: Assignment | null, b: Assignment | null): boolean {
	if (a === null || b === null) return a === b;
	return a.sourceKey === b.sourceKey && a.rank === b.rank;
}

/** Stable string form, used for DOM data attributes and drag payloads. */
export function assignmentId(a: Assignment): string {
	return `${a.sourceKey}#${a.rank}`;
}

export function parseAssignmentId(id: string): Assignment | null {
	const at = id.lastIndexOf('#');
	if (at < 0) return null;
	const rank = Number(id.slice(at + 1));
	if (!Number.isInteger(rank) || rank < 1) return null;
	return { sourceKey: id.slice(0, at), rank };
}

export interface SeedSlot {
	/** The bracket's seed number. Usually 1..N; an old bracket may start higher. */
	seed: number;
	assignment: Assignment | null;
	/** A rule fills this seed but no matchup in the bracket uses it. Kept visible, never dropped. */
	orphan: boolean;
}

/** How a seed relates to the default mapping. Drives connector colour and the slot's text tag. */
export type LineState = 'default' | 'shifted' | 'override' | 'other' | 'empty';

export interface BoardState {
	/** The source seeds are filled from by default. */
	primaryKey: string;
	slots: SeedSlot[];
	/** Ranks of the primary source the executive has excluded. Sorted ascending. Never persisted. */
	sittingOut: number[];
}

/** A rank as displayed: resolved to a team when the data allows it. */
export interface RankEntry {
	rank: number;
	team: Team | null;
	/** Shown when team is null, e.g. "fills in when the Quarter-finals are played". */
	resolvesWhen: string | null;
}

export interface SourceGroup {
	key: string;
	option: SeedingSourceOption;
	/** Short form for status messages: "regular season", "Pool A", "Quarter-finals losers". */
	shortLabel: string;
	ranks: RankEntry[];
	/** Caveat shown under the group heading. */
	note: string | null;
}

export type SeedingRule = SeedGroup;
