<script lang="ts">
	// SVG overlay drawing one curve per assignment, from a rank chip in the source
	// column to its seed slot. Purely decorative: the slot's text tag carries the
	// meaning for assistive technology, so the whole thing is aria-hidden.
	//
	// Geometry is measured from the DOM (data-chip / data-slot attributes inside
	// `container`), so this re-measures whenever `version` changes and on resize.
	import type { LineState } from '$lib/seeding/model';

	let {
		container,
		pairs,
		version
	}: {
		container: HTMLElement | null;
		pairs: { chipId: string; slotIndex: number; state: LineState }[];
		version: number;
	} = $props();

	let paths = $state<{ d: string; state: LineState }[]>([]);

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
		const next: { d: string; state: LineState }[] = [];
		for (const pair of pairs) {
			const chip = container.querySelector<HTMLElement>(`[data-chip="${pair.chipId}"]`);
			const slot = container.querySelector<HTMLElement>(`[data-slot="${pair.slotIndex}"]`);
			if (!chip || !slot) continue;
			const c = chip.getBoundingClientRect();
			const s = slot.getBoundingClientRect();
			const x1 = c.right - origin.left;
			const y1 = c.top + c.height / 2 - origin.top;
			const x2 = s.left - origin.left;
			const y2 = s.top + s.height / 2 - origin.top;
			const dx = (x2 - x1) * 0.4;
			next.push({
				d: `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`,
				state: pair.state
			});
		}
		paths = next;
	}

	$effect(() => {
		// Re-measure after every board change once the DOM has settled.
		void version;
		void pairs;
		void container;
		schedule(measure);
	});

	$effect(() => {
		if (!container || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(() => schedule(measure));
		observer.observe(container);
		return () => observer.disconnect();
	});
</script>

<svg class="seeding-connectors" aria-hidden="true" focusable="false">
	{#each paths as path, i (i)}
		<path class="line-{path.state}" d={path.d} />
	{/each}
</svg>

<style>
	.seeding-connectors {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		overflow: visible;
	}

	path {
		fill: none;
		stroke-width: 2.5;
		stroke: var(--text-soft);
	}

	.line-shifted {
		stroke: var(--color-olive);
	}

	.line-override {
		stroke: var(--color-copper);
	}

	.line-other {
		stroke: var(--color-tan);
		stroke-dasharray: 6 4;
	}
</style>
