import { describe, test, expect } from 'vitest';
import { inkFor, pathFor, routeLines, type ConnectorLine, type RoutedLine } from './routing';
import { bracketAnchor, seriesAnchor, slugify } from './anchors';
import { makeFourTeamBracket, teamAlphas } from '../../tests/playoffMocks';

// Horizontal segments of a routed line: the exit run and the entry run.
const segments = (l: RoutedLine<string>) => [
	{ y: l.ys, a: Math.min(l.x1, l.xm), b: Math.max(l.x1, l.xm), l },
	{ y: l.ye, a: Math.min(l.xm, l.x2), b: Math.max(l.xm, l.x2), l }
];
function horizontalOverlaps(lines: RoutedLine<string>[]): string[] {
	const segs = lines.flatMap(segments);
	const found: string[] = [];
	for (let i = 0; i < segs.length; i++) {
		for (let j = i + 1; j < segs.length; j++) {
			const p = segs[i],
				q = segs[j];
			if (p.l === q.l) continue;
			if (Math.abs(p.y - q.y) < 0.5 && Math.min(p.b, q.b) - Math.max(p.a, q.a) > 0.5) {
				found.push(`${p.l.from}@${p.y} with ${q.l.from}@${q.y}`);
			}
		}
	}
	return found;
}
function sharedLanes(lines: RoutedLine<string>[]): number {
	let n = 0;
	for (let i = 0; i < lines.length; i++)
		for (let j = i + 1; j < lines.length; j++) {
			const p = lines[i],
				q = lines[j];
			if (p.gap !== q.gap || Math.abs(p.xm - q.xm) > 0.5) continue;
			const [pa, pb] = [Math.min(p.ys, p.ye), Math.max(p.ys, p.ye)];
			const [qa, qb] = [Math.min(q.ys, q.ye), Math.max(q.ys, q.ye)];
			if (Math.min(pb, qb) - Math.max(pa, qa) > 0.5) n++;
		}
	return n;
}

// Geometry from the review screenshots: semis exit at x=455, finals column enters at
// x=560; rows at 347/383 (upper pair) and 520/556 (lower pair) in both columns.
const X1 = 455,
	X2 = 560;
const line = (
	from: string,
	style: 'advance' | 'consolation',
	y1: number,
	y2: number
): ConnectorLine<string> => ({ from, gap: 1, style, x1: X1, y1, x2: X2, y2 });

describe('routeLines', () => {
	test('fixed bracket after the semis (the cyclic case): no shared segments, no shared lanes', () => {
		const routed = routeLines([
			line('semi1-winner', 'advance', 347, 383), // Sabres → final, spot 2
			line('semi1-loser', 'consolation', 383, 556), // Wolves → 3rd place, spot 2
			line('semi2-winner', 'advance', 520, 347), // Rockets → final, spot 1
			line('semi2-loser', 'consolation', 556, 520) // Millers → 3rd place, spot 1
		]);
		expect(horizontalOverlaps(routed)).toEqual([]);
		expect(sharedLanes(routed)).toBe(0);
		expect(new Set(routed.map((l) => l.xm)).size).toBe(4);
		// the exit on the shared 383 row moved up, the entry moved down
		expect(routed[1].ys).toBe(378);
		expect(routed[0].ye).toBe(388);
	});

	test('re-seed after the semis: the straight-across line stays straight', () => {
		const routed = routeLines([
			line('semi1-winner', 'advance', 347, 347),
			line('semi1-loser', 'consolation', 383, 556),
			line('semi2-winner', 'advance', 520, 383),
			line('semi2-loser', 'consolation', 556, 520)
		]);
		expect(horizontalOverlaps(routed)).toEqual([]);
		expect(routed[0].ys).toBe(347);
		expect(routed[0].ye).toBe(347);
		expect(pathFor(routed[0])).toMatch(/^M 455 347 H [\d.]+ V 347 H 560$/);
	});

	test('two lines leaving one box fan apart, advance above consolation', () => {
		const routed = routeLines([
			line('semi1-midpoint', 'consolation', 365, 556),
			line('semi1-midpoint', 'advance', 365, 347)
		]);
		const adv = routed.find((l) => l.style === 'advance')!;
		const con = routed.find((l) => l.style === 'consolation')!;
		expect(adv.ys).toBe(360);
		expect(con.ys).toBe(370);
		expect(horizontalOverlaps(routed)).toEqual([]);
	});

	test('lanes are assigned per gap and ordered top to bottom', () => {
		const routed = routeLines([
			{ ...line('a', 'advance', 300, 100), gap: 0 },
			{ ...line('b', 'advance', 100, 300), gap: 0 },
			{ ...line('c', 'advance', 200, 200), gap: 1 }
		]);
		const gap0 = routed.filter((l) => l.gap === 0).sort((p, q) => p.ys - q.ys);
		expect(gap0[0].xm).toBeLessThan(gap0[1].xm);
		expect(routed.find((l) => l.from === 'c')!.xm).toBe(X1 + (X2 - X1) / 2);
	});
});

describe('inkFor', () => {
	test('uses the team background colour when it is dark enough', () => {
		expect(inkFor(teamAlphas)).toBe('#003366');
	});

	test('falls back to the foreground colour for a very light background', () => {
		expect(inkFor({ ...teamAlphas, backgroundColor: 'FFFFFF', color: '222222' })).toBe('#222222');
	});

	test('falls back to the neutral colour when neither parses', () => {
		expect(inkFor({ ...teamAlphas, backgroundColor: 'nope', color: 'x' }, 'grey')).toBe('grey');
	});
});

describe('anchors', () => {
	test('slugify is lower-case, dashed, and never empty', () => {
		expect(slugify('B Side (2026)')).toBe('b-side-2026');
		expect(slugify('***')).toBe('bracket');
	});

	test('bracket and series anchors are stable and namespaced by bracket', () => {
		const b = makeFourTeamBracket({ name: 'Main' });
		expect(bracketAnchor(b)).toBe('main-bracket');
		expect(seriesAnchor(b, b.rounds[1].series[0])).toBe('main-series-3');
	});
});
