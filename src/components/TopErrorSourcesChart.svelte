<script lang="ts">
	import type { SiteEvent } from '../routes/Webmaster/+page';

	let { events }: { events: SiteEvent[] } = $props();

	const TOP_N = 10;

	const topSources = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const e of events) {
			if (e.type !== 'Error') continue;
			counts.set(e.resource, (counts.get(e.resource) ?? 0) + 1);
		}
		return [...counts.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, TOP_N)
			.map(([resource, count]) => ({ resource, count }));
	});

	const maxCount = $derived(Math.max(1, ...topSources.map((s) => s.count)));
</script>

<div class="chart">
	<h2>Top Error Sources</h2>
	{#if topSources.length === 0}
		<p class="no-data">No error events in the last 30 days.</p>
	{:else}
		<div class="bars">
			{#each topSources as source}
				<div class="bar-row">
					<div class="bar-label"><code>{source.resource}</code></div>
					<div class="bar-track">
						<div class="bar-fill" style="width: {(source.count / maxCount) * 100}%"></div>
					</div>
					<div class="bar-count">{source.count}</div>
				</div>
			{/each}
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

	.bars {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.bar-row {
		display: grid;
		grid-template-columns: minmax(140px, 220px) 1fr 40px;
		gap: var(--space-3);
		align-items: center;
	}

	.bar-label code {
		font-family: monospace;
		font-size: var(--text-sm);
		color: var(--text-soft-contrast);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		display: block;
	}

	.bar-track {
		height: 20px;
		background-color: var(--color-cream);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		background-color: var(--color-loss);
		transition: width 0.3s ease;
	}

	.bar-count {
		font-weight: 700;
		font-size: var(--text-sm);
		text-align: right;
	}

	.no-data {
		color: var(--text-soft-contrast);
		font-style: italic;
	}

	@media (max-width: 768px) {
		.bar-row {
			grid-template-columns: 1fr 60px;
			grid-template-rows: auto auto;
			gap: var(--space-1);
		}

		.bar-label {
			grid-column: 1 / -1;
		}

		.bar-track {
			grid-column: 1;
		}

		.bar-count {
			grid-column: 2;
			grid-row: 2;
		}
	}
</style>
