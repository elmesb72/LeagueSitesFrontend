<script lang="ts">
	import type { SiteEvent } from '../routes/Webmaster/+page';

	let { events }: { events: SiteEvent[] } = $props();

	const DAYS = 30;

	type Bucket = {
		date: string;
		rate: number | null;
		errors: number;
		total: number;
	};

	const buckets = $derived.by<Bucket[]>(() => {
		const map = new Map<string, { errors: number; total: number }>();
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		for (let i = DAYS - 1; i >= 0; i--) {
			const d = new Date(today);
			d.setDate(today.getDate() - i);
			map.set(d.toISOString().split('T')[0], { errors: 0, total: 0 });
		}

		for (const e of events) {
			const key = e.date.split('T')[0];
			const bucket = map.get(key);
			if (bucket) {
				bucket.total += 1;
				if (e.type === 'Error') bucket.errors += 1;
			}
		}

		return [...map.entries()].map(([date, counts]) => ({
			date,
			rate: counts.total > 0 ? (counts.errors / counts.total) * 100 : null,
			errors: counts.errors,
			total: counts.total
		}));
	});

	const hasAnyData = $derived(buckets.some((b) => b.total > 0));
	const maxRate = $derived(Math.max(1, ...buckets.map((b) => b.rate ?? 0)));

	function formatShortDate(dateStr: string): string {
		const d = new Date(dateStr + 'T12:00:00');
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	// Chart geometry
	const W = 600;
	const H = 200;
	const PAD = { top: 20, right: 20, bottom: 40, left: 50 };
	const innerW = W - PAD.left - PAD.right;
	const innerH = H - PAD.top - PAD.bottom;

	// Build line segments — breaking the line where data is missing (rate === null)
	const linePaths = $derived.by(() => {
		const segments: string[] = [];
		let current: string[] = [];

		buckets.forEach((b, i) => {
			if (b.rate === null) {
				if (current.length > 1) segments.push(current.join(' '));
				current = [];
				return;
			}
			const x = PAD.left + (i / (buckets.length - 1)) * innerW;
			const y = PAD.top + innerH - (b.rate / maxRate) * innerH;
			current.push(`${current.length === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
		});

		if (current.length > 1) segments.push(current.join(' '));
		return segments;
	});
</script>

<div class="chart">
	<h2>Error Rate — Last {DAYS} Days</h2>
	{#if !hasAnyData}
		<p class="no-data">No events in the last {DAYS} days.</p>
	{:else}
		<svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">
			<!-- Y-axis gridlines and labels -->
			{#each [0, 0.5, 1] as pct}
				{@const y = PAD.top + innerH - pct * innerH}
				<line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="var(--color-cream)" stroke-width="1" />
				<text x={PAD.left - 6} y={y + 4} text-anchor="end" class="axis-label">
					{(maxRate * pct).toFixed(1)}%
				</text>
			{/each}

			<!-- Line segments (broken where data is missing) -->
			{#each linePaths as d}
				<path {d} fill="none" stroke="var(--color-loss)" stroke-width="2" />
			{/each}

			<!-- X-axis labels (every 5 days) -->
			{#each buckets as b, i}
				{#if i % 5 === 0 || i === buckets.length - 1}
					{@const x = PAD.left + (i / (buckets.length - 1)) * innerW}
					<text {x} y={H - PAD.bottom + 16} text-anchor="middle" class="axis-label">
						{formatShortDate(b.date)}
					</text>
				{/if}
			{/each}

			<!-- Data points: colored dot for days with data, small gray tick for no-data days -->
			{#each buckets as b, i}
				{@const x = PAD.left + (i / (buckets.length - 1)) * innerW}
				{#if b.rate !== null}
					{@const y = PAD.top + innerH - (b.rate / maxRate) * innerH}
					<circle cx={x} cy={y} r="3" fill="var(--color-loss)">
						<title>{formatShortDate(b.date)}: {b.errors}/{b.total} ({b.rate.toFixed(1)}%)</title>
					</circle>
				{:else}
					{@const y = PAD.top + innerH}
					<circle cx={x} cy={y} r="2" fill="var(--text-soft)" opacity="0.5">
						<title>{formatShortDate(b.date)}: no events</title>
					</circle>
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

	:global(.axis-label) {
		font-size: 10px;
		fill: var(--text-soft-contrast);
	}
</style>
