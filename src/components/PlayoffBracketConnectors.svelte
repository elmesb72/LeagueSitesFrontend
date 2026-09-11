<script lang="ts">
	// SVG overlay drawing one connector per fed spot, from the box of the team it
	// carries to the spot it feeds, in that team's colour. Decorative: the same
	// relationships are in the spots' text labels, so the overlay is aria-hidden.
	//
	// Geometry is measured from the DOM inside `container` (data-series /
	// data-spot attributes), so it re-measures on every `version` bump, on
	// resize, and once fonts have settled.
	import type { Bracket } from '$lib/models/Playoffs';
	import { connectorsOf, gapOf, type ConnectorStyle } from '$lib/playoffs/feeders';
	import { inkFor, pathFor, routeLines, type ConnectorLine } from '$lib/playoffs/routing';

	let {
		bracket,
		container,
		version
	}: {
		bracket: Bracket;
		container: HTMLElement | null;
		version: number;
	} = $props();

	type Measured = ConnectorLine<Element> & { stroke: string };

	let paths = $state<{ d: string; style: ConnectorStyle; stroke: string }[]>([]);

	const connectors = $derived(connectorsOf(bracket));

	function schedule(fn: () => void): void {
		if (typeof requestAnimationFrame === 'function') requestAnimationFrame(fn);
		else setTimeout(fn, 0);
	}

	function measure(): void {
		if (!container) {
			paths = [];
			return;
		}
		const origin = container.getBoundingClientRect();
		const lines: Measured[] = [];
		for (const c of connectors) {
			const feeder = c.feeder.series;
			const carried = c.feeder.style === 'consolation' ? feeder.loser : feeder.winner;
			// Leave from the carried team's own box when the feeder is decided,
			// else from the series midpoint.
			let from: Element | null = null;
			if (carried) {
				const idx = [feeder.spot1, feeder.spot2].findIndex((sp) => sp?.team?.id === carried.id);
				if (idx >= 0) from = container.querySelector(`[data-spot="${feeder.number}-${idx}"]`);
			}
			from ??= container.querySelector(
				`[data-series="${feeder.number}"] .tournament-series-matchup`
			);
			const to = container.querySelector(`[data-spot="${c.series.number}-${c.spotIndex}"]`);
			if (!from || !to) continue;
			const f = from.getBoundingClientRect();
			const t = to.getBoundingClientRect();
			lines.push({
				from,
				gap: gapOf(c, bracket),
				style: c.feeder.style,
				x1: f.right - origin.left,
				y1: f.top + f.height / 2 - origin.top,
				x2: t.left - origin.left,
				y2: t.top + t.height / 2 - origin.top,
				stroke: carried ? inkFor(carried) : 'var(--text-soft)'
			});
		}
		paths = routeLines(lines).map((l) => ({ d: pathFor(l), style: l.style, stroke: l.stroke }));
	}

	$effect(() => {
		void version;
		void connectors;
		void container;
		schedule(measure);
	});

	$effect(() => {
		if (!container) return;
		const observer =
			typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => schedule(measure)) : null;
		observer?.observe(container);
		// Web fonts change box widths; draw again once they are in.
		if (typeof document !== 'undefined' && 'fonts' in document) {
			document.fonts.ready.then(() => schedule(measure)).catch(() => undefined);
		}
		return () => observer?.disconnect();
	});
</script>

<svg class="tournament-connectors" aria-hidden="true" focusable="false">
	{#each paths as path, i (i)}
		<path class="tournament-connector-{path.style}" d={path.d} style="stroke: {path.stroke}" />
	{/each}
</svg>
