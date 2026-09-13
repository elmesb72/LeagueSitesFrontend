// How a tournament's brackets and pools feed one another, worked out from the
// seeding rules the executive has already entered. Drives the "How it fits
// together" panel on the tournament page: the chain itself, the one rule about
// the champion mark (it belongs on the last stop of a path), and the next piece
// worth adding. Pure.

import type {
	BracketStructure,
	RoundRobinStructure,
	SeedGroup,
	TournamentDetail
} from '$lib/models/Tournament';

export type StageKind = 'bracket' | 'pool';

export interface Stage {
	key: string;
	kind: StageKind;
	id: number;
	name: string;
	historical: boolean;
	/** "3 rounds", "4 teams" */
	size: string;
	/** The stage's own management page. */
	href: string;
	/** The page where its champion mark is changed. */
	settingsHref: string;
}

export interface Edge {
	/** Stage key, or null when the teams come from outside the tournament (the regular season). */
	from: string | null;
	to: string;
	/** Losers drop out of `from`; standings means its top teams move on. */
	kind: 'standings' | 'losers';
	/** Short text for the arrow: "standings 1–8", "knocked out in the Quarter-finals". */
	label: string;
	/** For a bracket-round source, which round. */
	sourceRoundId: number | null;
	/** Where outside teams come from, when `from` is null. */
	sourceLabel: string | null;
}

export type FlowItem =
	| { type: 'source'; label: string }
	| { type: 'stage'; stage: Stage }
	| { type: 'ref'; stage: Stage }
	| { type: 'arrow'; edge: Edge }
	| { type: 'ghost-arrow'; label: string }
	| { type: 'ghost'; label: string; href: string };

export interface FlowRow {
	items: FlowItem[];
}

export interface FlowWarning {
	stage: Stage;
	feeds: Stage;
	message: string;
}

export interface FlowSuggestion {
	kind: 'add-pool';
	bracket: Stage;
	roundName: string;
	losers: number;
	href: string;
}

export interface TournamentFlow {
	stages: Stage[];
	edges: Edge[];
	rows: FlowRow[];
	warnings: FlowWarning[];
	suggestion: FlowSuggestion | null;
}

const DASH = '\u2013';

function range(a: number, b: number): string {
	return a === b ? `${a}` : `${a}${DASH}${b}`;
}

function plural(n: number, word: string): string {
	return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function seatCount(seeding: SeedGroup[]): number {
	return seeding.reduce((sum, rule) => sum + (rule.outputEnd - rule.outputStart + 1), 0);
}

function bracketStage(detail: TournamentDetail, bracket: BracketStructure): Stage {
	const href = `/Executive/Edit/Tournament/${detail.id}/Bracket/${bracket.id}`;
	return {
		key: `bracket:${bracket.id}`,
		kind: 'bracket',
		id: bracket.id,
		name: bracket.name,
		historical: bracket.historical,
		size: plural(bracket.rounds.length, 'round'),
		href,
		settingsHref: href
	};
}

function poolStage(detail: TournamentDetail, pool: RoundRobinStructure): Stage {
	const teams = Math.max(
		seatCount(pool.seeding),
		pool.resolvedSeeds.length,
		pool.standings?.length ?? 0
	);
	const href = `/Executive/Edit/Tournament/${detail.id}/Pool/${pool.id}`;
	return {
		key: `pool:${pool.id}`,
		kind: 'pool',
		id: pool.id,
		name: pool.name,
		historical: pool.historical,
		size: plural(teams, 'team'),
		href,
		settingsHref: href
	};
}

/** One edge per (source, target, kind); rank ranges from several rules are joined. */
function edgesInto(detail: TournamentDetail, to: string, seeding: SeedGroup[]): Edge[] {
	const merged = new Map<string, Edge & { ranges: string[] }>();
	for (const rule of seeding) {
		let from: string | null = null;
		let kind: Edge['kind'] = 'standings';
		let sourceRoundId: number | null = null;
		let sourceLabel: string | null = null;
		let label: string;
		const ranks = range(rule.rankStart, rule.rankEnd);

		if (rule.sourceType === 'Season') {
			sourceLabel = `${detail.season.year} regular season`;
			label = 'standings';
		} else if (rule.sourceType === 'BracketRound') {
			const owner = detail.brackets.find((b) => b.rounds.some((r) => r.id === rule.sourceID));
			const round = owner?.rounds.find((r) => r.id === rule.sourceID);
			if (!owner || !round) {
				sourceLabel = 'a round that no longer exists';
				label = rule.result === 'Losers' ? 'knocked out' : 'results';
			} else {
				from = `bracket:${owner.id}`;
				sourceRoundId = round.id;
				if (rule.result === 'Losers') {
					kind = 'losers';
					label = `knocked out in the ${round.name}`;
				} else {
					label = `${round.name} results`;
				}
			}
		} else {
			const pool = detail.roundRobins.find((p) => p.id === rule.sourceID);
			if (!pool) {
				sourceLabel = 'a pool that no longer exists';
				label = 'standings';
			} else {
				from = `pool:${pool.id}`;
				label = 'final standings';
			}
		}
		if (from === to) continue; // a stage cannot feed itself

		const key = `${from ?? sourceLabel}|${kind}`;
		const existing = merged.get(key);
		if (existing) {
			if (kind === 'standings') existing.ranges.push(ranks);
		} else {
			merged.set(key, {
				from,
				to,
				kind,
				label,
				sourceRoundId,
				sourceLabel,
				ranges: kind === 'standings' ? [ranks] : []
			});
		}
	}
	return [...merged.values()].map(({ ranges, ...edge }) => ({
		...edge,
		label: ranges.length > 0 ? `${edge.label} ${ranges.join(', ')}` : edge.label
	}));
}

export function tournamentFlow(detail: TournamentDetail): TournamentFlow {
	const stages: Stage[] = [
		...detail.brackets.map((b) => bracketStage(detail, b)),
		...detail.roundRobins.map((p) => poolStage(detail, p))
	];
	const byKey = new Map(stages.map((s) => [s.key, s]));

	const edges: Edge[] = [
		...detail.brackets.flatMap((b) => edgesInto(detail, `bracket:${b.id}`, b.seeding)),
		...detail.roundRobins.flatMap((p) => edgesInto(detail, `pool:${p.id}`, p.seeding))
	];

	const incoming = (key: string) => edges.filter((e) => e.to === key);
	const outgoing = (key: string) => edges.filter((e) => e.from === key);

	// ---- rows: start from stages fed only from outside, follow the chain greedily
	const placed = new Set<string>();
	const drawn = new Set<Edge>();
	const rows: FlowRow[] = [];

	function startRow(stage: Stage): FlowItem[] {
		const items: FlowItem[] = [];
		for (const edge of incoming(stage.key).filter((e) => e.from === null)) {
			items.push(
				{ type: 'source', label: edge.sourceLabel ?? 'elsewhere' },
				{ type: 'arrow', edge }
			);
			drawn.add(edge);
		}
		items.push({ type: 'stage', stage });
		placed.add(stage.key);
		return items;
	}

	function extend(items: FlowItem[], from: Stage): void {
		let current = from;
		for (;;) {
			const next = outgoing(current.key).find((e) => !placed.has(e.to));
			if (!next) return;
			const target = byKey.get(next.to)!;
			items.push({ type: 'arrow', edge: next }, { type: 'stage', stage: target });
			drawn.add(next);
			placed.add(target.key);
			current = target;
		}
	}

	const roots = stages.filter((s) => incoming(s.key).every((e) => e.from === null));
	for (const root of roots) {
		if (placed.has(root.key)) continue;
		const items = startRow(root);
		extend(items, root);
		rows.push({ items });
	}
	// Stages the chains did not reach: a second thing fed by an already-drawn
	// stage opens with a reference back to it; anything else (a cycle in the
	// data) is drawn bare rather than lost.
	for (const stage of stages) {
		if (placed.has(stage.key)) continue;
		const feed = incoming(stage.key).find((e) => e.from !== null && placed.has(e.from));
		const items: FlowItem[] = feed
			? [
					{ type: 'ref', stage: byKey.get(feed.from!)! },
					{ type: 'arrow', edge: feed }
				]
			: [];
		if (feed) drawn.add(feed);
		items.push(...startRow(stage));
		extend(items, stage);
		rows.push({ items });
	}
	// Edges the chains did not cover (a stage fed from two places, or a bracket
	// feeding two things): one short row each, referring back to placed stages.
	for (const edge of edges) {
		if (drawn.has(edge)) continue;
		const to = byKey.get(edge.to)!;
		const head: FlowItem =
			edge.from === null
				? { type: 'source', label: edge.sourceLabel ?? 'elsewhere' }
				: { type: 'ref', stage: byKey.get(edge.from)! };
		rows.push({ items: [head, { type: 'arrow', edge }, { type: 'ref', stage: to }] });
		drawn.add(edge);
	}

	// ---- the rule: a champion mark belongs on the last stop of a path
	const warnings: FlowWarning[] = edges
		.filter((e) => e.kind === 'standings' && e.from !== null && byKey.get(e.from)!.historical)
		.map((e) => {
			const stage = byKey.get(e.from!)!;
			const feeds = byKey.get(e.to)!;
			return {
				stage,
				feeds,
				message:
					`${stage.name} is marked as a champion, but its top teams go on to play ${feeds.name}. ` +
					`The ${stage.name} title is decided in ${feeds.name}, so the champion mark belongs there.`
			};
		});

	// ---- next piece: knocked-out teams with nowhere to play
	let suggestion: FlowSuggestion | null = null;
	const anyoneTakesLosers = edges.some((e) => e.kind === 'losers');
	if (detail.roundRobins.length === 0 && !anyoneTakesLosers) {
		for (const bracket of detail.brackets) {
			const opening = bracket.rounds[0];
			if (!opening || opening.series.length < 2) continue;
			const stage = byKey.get(`bracket:${bracket.id}`)!;
			suggestion = {
				kind: 'add-pool',
				bracket: stage,
				roundName: opening.name,
				losers: opening.series.length,
				href: `/Executive/Edit/Tournament/${detail.id}/AddPool?losersOf=${opening.id}`
			};
			// Show it in the chain, right after the bracket, when it ends its row.
			const row = rows.find((r) => r.items.some((i) => i.type === 'stage' && i.stage === stage));
			const ghost: FlowItem[] = [
				{ type: 'ghost-arrow', label: `knocked out in the ${opening.name}` },
				{ type: 'ghost', label: 'Add a B-side pool', href: suggestion.href }
			];
			const last = row?.items[row.items.length - 1];
			if (row && last?.type === 'stage' && last.stage === stage) row.items.push(...ghost);
			else rows.push({ items: [{ type: 'ref', stage }, ...ghost] });
			break;
		}
	}

	return { stages, edges, rows, warnings, suggestion };
}
