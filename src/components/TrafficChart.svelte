<script lang="ts">
	import type { TrafficDay } from '../routes/Webmaster/+page';

	let { traffic }: { traffic: TrafficDay[] } = $props();

	function formatShortDate(dateStr: string): string {
		const d = new Date(dateStr + 'T12:00:00');
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	const W = 600;
	const H = 200;
	const PAD = { top: 20, right: 20, bottom: 40, left: 50 };
	const innerW = W - PAD.left - PAD.right;
	const innerH = H - PAD.top - PAD.bottom;

	const maxRequests = $derived(Math.max(1, ...traffic.map((t) => t.totalRequests)));
	const barWidth = $derived(traffic.length > 0 ? (innerW / traffic.length) * 0.7 : 0);
	const barStep = $derived(traffic.length > 0 ? innerW / traffic.length : 0);
</script>

<div class="chart">
	<h2>Page Views — Last {traffic.length} Days</h2>
	{#if traffic.length === 0}
		<p class="no-data">No traffic data recorded yet.</p>
	{:else}
		<svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">
			{#each [0, 0.5, 1] as pct}
				{@const y = PAD.top + innerH - pct * innerH}
				<line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="var(--color-cream)" stroke-width="1" />
				<text x={PAD.left - 6} y={y + 4} text-anchor="end" class="axis-label">
					{Math.round(maxRequests * pct)}
				</text>
			{/each}

			{#each traffic as t, i}
				{@const x = PAD.left + i * barStep + (barStep - barWidth) / 2}
				{@const h = (t.totalRequests / maxRequests) * innerH}
				{@const baseY = PAD.top + innerH}
				<rect x={x} y={baseY - h} width={barWidth} height={h} fill="var(--surface-heading-primary)">
					<title>{formatShortDate(t.date)}: {t.totalRequests} views, {t.uniqueIPs} unique IPs</title>
				</rect>
			{/each}

			{#each traffic as t, i}
				{#if i % 5 === 0 || i === traffic.length - 1}
					{@const x = PAD.left + i * barStep + barStep / 2}
					<text {x} y={H - PAD.bottom + 16} text-anchor="middle" class="axis-label">
						{formatShortDate(t.date)}
					</text>
				{/if}
			{/each}
		</svg>
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
</style>
