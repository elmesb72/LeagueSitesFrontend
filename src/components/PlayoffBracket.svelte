<script lang="ts">
	// The public bracket: a list of rounds, each a list of series, laid out with
	// flexbox so every round centres on the series that feed it, with an SVG
	// overlay drawing data-driven connectors. No per-round CSS.
	import { untrack } from 'svelte';
	import type { Bracket, Series } from '$lib/models/Playoffs';
	import { bracketAnchor, seriesAnchor } from '$lib/playoffs/anchors';
	import { bracketGapPx } from '$lib/playoffs/feeders';
	import { seriesLabel } from '$lib/playoffs/labels';
	import { nextGameOf } from '$lib/playoffs/nextGames';
	import { seriesFormatLabel } from '$lib/utils/bracketBuilder';
	import PlayoffBracketConnectors from './PlayoffBracketConnectors.svelte';
	import PlayoffSeriesSpot from './PlayoffSeriesSpot.svelte';

	let { bracket, now = new Date() }: { bracket: Bracket; now?: Date } = $props();

	let roundsEl = $state<HTMLElement | null>(null);
	/** Bumped when the data changes so the connectors re-measure after the DOM updates. */
	let version = $state(0);
	$effect(() => {
		void bracket;
		untrack(() => version++);
	});

	const gap = $derived(bracketGapPx(bracket));
	const anchor = $derived(bracketAnchor(bracket));

	/** Detail sections exist only for series with both teams known. */
	function hasDetail(series: Series): boolean {
		return series.spot1?.team != null && series.spot2?.team != null;
	}

	/** "Thu 10": weekday and day of the month, assembled by hand so the order is fixed across locales/ICU. */
	function nextMarker(series: Series): string | null {
		const game = nextGameOf(series, now);
		if (!game) return null;
		const date = new Date(game.date);
		return `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${date.getDate()}`;
	}
</script>

<section class="tournament-bracket" id={anchor} aria-labelledby="{anchor}-title">
	<h2 class="tournament-bracket-name" id="{anchor}-title">{bracket.name} Bracket</h2>
	<div class="tournament-bracket-rounds" bind:this={roundsEl} style="--bracket-gap: {gap}px">
		<PlayoffBracketConnectors {bracket} container={roundsEl} {version} />
		<ol class="tournament-round-list">
			{#each bracket.rounds as round, roundIndex (roundIndex)}
				<li class="tournament-round">
					<h3 class="tournament-round-name">
						{round.name}
						{#if round.series[0]}
							<span class="tournament-round-format">
								{seriesFormatLabel(round.series[0].format, round.series[0].hostOrder.length)}
							</span>
						{/if}
					</h3>
					<ol class="tournament-series-list">
						{#each round.series as series (series.number)}
							{@const marker = nextMarker(series)}
							<li
								class="tournament-series"
								data-series={series.number}
								aria-label={seriesLabel(series)}
							>
								{#if hasDetail(series)}
									<a
										class="tournament-series-number"
										href="#{seriesAnchor(bracket, series)}"
										aria-label="Series {series.number} details"
									>
										{series.number}
									</a>
								{:else}
									<span class="tournament-series-number">{series.number}</span>
								{/if}
								<div class="tournament-series-matchup">
									<PlayoffSeriesSpot
										spot={series.spot1}
										winner={series.winner}
										initialSeed={series.spot1?.initialSeed ?? null}
										spotId="{series.number}-0"
									/>
									<PlayoffSeriesSpot
										spot={series.spot2}
										winner={series.winner}
										initialSeed={series.spot2?.initialSeed ?? null}
										spotId="{series.number}-1"
									/>
									{#if marker}
										<span class="tournament-series-next" title="Next game {marker}">{marker}</span>
									{/if}
								</div>
							</li>
						{/each}
					</ol>
				</li>
			{/each}
		</ol>
	</div>
</section>
