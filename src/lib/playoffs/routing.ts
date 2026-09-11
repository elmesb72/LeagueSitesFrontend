// Connector routing for the bracket: turns measured start/end points into
// three-segment elbows that never sit on top of one another. Pure, so the
// geometry rules can be tested without a layout engine.
//
// Two things make elbows overlap, and lanes alone fix neither:
//  1. Two lines leaving the same box (an undecided series feeding both a final
//     and a third-place game) share their first segment. They fan apart.
//  2. Rows line up across columns (a final and a third-place game sit at the
//     same heights as the two semi-finals), so one line's last segment lands
//     on the row another departs from and the two share the stretch between
//     their lanes. In a fixed bracket those constraints form a cycle, so no
//     lane order can satisfy them all. Where an exit and an entry coincide,
//     the departing line leaves SPLIT px above the box centre and the
//     arriving line enters SPLIT px below. A line running straight along its
//     own row is left perfectly straight.

import type { Team } from '$lib/models/Team';
import type { ConnectorStyle } from './feeders';

export interface ConnectorLine<TKey = unknown> {
	/** Identity of the box the line leaves (two lines from one box fan apart). */
	from: TKey;
	/** Index of the column gap the line crosses. Lanes are assigned per gap. */
	gap: number;
	style: ConnectorStyle;
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

export interface RoutedFields {
	/** Exit height (y1, possibly split). */
	ys: number;
	/** Entry height (y2, possibly split). */
	ye: number;
	/** x of the vertical run: this line's lane within its gap. */
	xm: number;
}

export type RoutedLine<TKey = unknown> = ConnectorLine<TKey> & RoutedFields;

export const SPLIT = 5;

/** Generic over the line type so callers can carry extra fields (a stroke colour, say) through routing. */
export function routeLines<L extends ConnectorLine<unknown>>(input: L[]): (L & RoutedFields)[] {
	const lines: (L & RoutedFields)[] = input.map((l) => ({ ...l, ys: l.y1, ye: l.y2, xm: l.x1 }));

	// 1. Shared exits fan apart, advance above consolation.
	const byFrom = new Map<unknown, (L & RoutedFields)[]>();
	for (const l of lines) {
		const group = byFrom.get(l.from);
		if (group) group.push(l);
		else byFrom.set(l.from, [l]);
	}
	for (const group of byFrom.values()) {
		if (group.length < 2) continue;
		group.sort((a, b) => Number(a.style === 'consolation') - Number(b.style === 'consolation'));
		group.forEach((l, i) => {
			l.ys = l.y1 + (i - (group.length - 1) / 2) * 2 * SPLIT;
		});
	}

	// 2. An entry landing on a row another line departs from, in the same gap.
	for (const p of lines) {
		for (const q of lines) {
			if (p === q || p.gap !== q.gap) continue;
			if (Math.abs(p.y2 - q.y1) < 1 && p.ye === p.y2 && q.ys === q.y1) {
				p.ye = p.y2 + SPLIT;
				q.ys = q.y1 - SPLIT;
			}
		}
	}

	// 3. Lanes: within each gap, top to bottom by exit height.
	const byGap = new Map<number, (L & RoutedFields)[]>();
	for (const l of lines) {
		const group = byGap.get(l.gap);
		if (group) group.push(l);
		else byGap.set(l.gap, [l]);
	}
	for (const group of byGap.values()) {
		group.sort((a, b) => a.ys - b.ys);
		group.forEach((l, lane) => {
			l.xm = l.x1 + (l.x2 - l.x1) * ((lane + 1) / (group.length + 1));
		});
	}
	return lines;
}

/** SVG path for a routed line: out along the exit row, along the lane, in along the entry row. */
export function pathFor(l: ConnectorLine<unknown> & RoutedFields): string {
	return `M ${l.x1} ${l.ys} H ${l.xm} V ${l.ye} H ${l.x2}`;
}

/**
 * The colour a team's connector is drawn in. Team colours are stored as hex
 * without '#'. A very light background would vanish on the cream page, so
 * those teams use their foreground colour instead; anything unparseable falls
 * back to the neutral line colour.
 */
export function inkFor(team: Team, neutral = 'var(--text-soft)'): string {
	const bg = parseHex(team.backgroundColor);
	if (!bg) return neutral;
	const luminance = 0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2];
	if (luminance <= 0.72) return `#${team.backgroundColor.replace('#', '')}`;
	return parseHex(team.color) ? `#${team.color.replace('#', '')}` : neutral;
}

function parseHex(value: string): [number, number, number] | null {
	const hex = value.replace('#', '');
	if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
	return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
}
