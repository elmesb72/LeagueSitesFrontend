<script lang="ts">
	import type { SiteEvent } from '../routes/Webmaster/+page';

	let { events }: { events: SiteEvent[] } = $props();

	const DAYS = 30;

	const buckets = $derived.by(() => {
		const map = new Map<string, { Information: number; Update: number; Error: number }>();
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		for (let i = DAYS - 1; i >= 0; i--) {
			const d = new Date(today);
			d.setDate(today.getDate() - i);
			map.set(d.toISOString().split('T')[0], { Information: 0, Update: 0, Error: 0 });
		}

		for (const e of events) {
			const key = e.date.split('T')[0];
			const bucket = map.get(key);
			if (bucket) bucket[e.type] += 1;
		}

		return [...map.entries()].map(([date, counts]) => ({ date, ...counts, total: counts.Information + counts.Update + counts.Error }));
	});

	const maxTotal = $derived(Math.max(1, ...buckets.map((b) => b.total)));

	function formatShortDate(dateStr: string): string {
		const d = new Date(dateStr + 'T12:00:00');
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	const W = 600;
	const H = 200;
	const PAD = { top: 20, right: 20, bottom: 40, left: 40 };
	const innerW = W - PAD.left - PAD.right;
	const innerH = H - PAD.top - PAD.bottom;
	const barWidth = $derived((innerW / buckets.length) * 0.7);
	const barStep = $derived(innerW / buckets.length);
</script>

<div class="chart">
	<h2>Events Per Day — Last {DAYS} Days</h2>
	{#if buckets.every((b) => b.total === 0)}
		<p class="no-data">No events in the last {DAYS} days.</p>
	{:else}
		<svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">
		<!-- Y-axis gridlines -->
		{#each [0, 0.5, 1] as pct}
			{@const y = PAD.top + innerH - pct * innerH}
			<line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="var(--color-cream)" stroke-width="1" />
			<text x={PAD.left - 6} y={y + 4} text-anchor="end" class="axis-label">
				{Math.round(maxTotal * pct)}
			</text>
		{/each}

		<!-- Stacked bars -->
		{#each buckets as b, i}
			{@const x = PAD.left + i * barStep + (barStep - barWidth) / 2}
			{@const infoH = (b.Information / maxTotal) * innerH}
			{@const updateH = (b.Update / maxTotal) * innerH}
			{@const errorH = (b.Error / maxTotal) * innerH}
			{@const baseY = PAD.top + innerH}

			{#if b.Information > 0}
				<rect x={x} y={baseY - infoH} width={barWidth} height={infoH} fill="var(--color-grey-light)">
					<title>{formatShortDate(b.date)}: {b.Information} Information</title>
				</rect>
			{/if}
			{#if b.Update > 0}
				<rect x={x} y={baseY - infoH - updateH} width={barWidth} height={updateH} fill="var(--color-olive)">
					<title>{formatShortDate(b.date)}: {b.Update} Update</title>
				</rect>
			{/if}
			{#if b.Error > 0}
				<rect x={x} y={baseY - infoH - updateH - errorH} width={barWidth} height={errorH} fill="var(--color-loss)">
					<title>{formatShortDate(b.date)}: {b.Error} Error</title>
				</rect>
			{/if}
		{/each}

		<!-- X-axis labels -->
		{#each buckets as b, i}
			{#if i % 5 === 0 || i === buckets.length - 1}
				{@const x = PAD.left + i * barStep + barStep / 2}
				<text {x} y={H - PAD.bottom + 16} text-anchor="middle" class="axis-label">
					{formatShortDate(b.date)}
				</text>
			{/if}
		{/each}
	</svg>

	<div class="legend">
		<span class="legend-item"><span class="legend-swatch" style="background: var(--color-grey-light)"></span>Information</span>
		<span class="legend-item"><span class="legend-swatch" style="background: var(--color-olive)"></span>Update</span>
		<span class="legend-item"><span class="legend-swatch" style="background: var(--color-loss)"></span>Error</span>
	</div>
	{/if}
</div>

<style>
	.chart {
		padding: var(--space-3);
	}

	.chart h2 {
		margin-bottom: var(--space-3);
	}

	svg {
		width: 100%;
		height: auto;
	}

	.no-data {
		color: var(--text-soft-contrast);
		font-style: italic;
	}

	.legend {
		display: flex;
		gap: var(--space-4);
		margin-top: var(--space-2);
		font-size: var(--text-sm);
	}

	.legend-item {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
	}

	.legend-swatch {
		display: inline-block;
		width: 12px;
		height: 12px;
		border-radius: 2px;
	}
</style>
