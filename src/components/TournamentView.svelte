<script lang="ts">
	// The body of a public tournament page — the playoffs and a mid-season cup
	// render exactly this: coming-up strip, champion banner or "won by" line per
	// bracket, the brackets, the pools, and the series details grouped per bracket.
	import type { Bracket, PlayoffsData, Series } from '$lib/models/Playoffs';
	import { comingUp } from '$lib/playoffs/nextGames';
	import PlayoffBracket from './PlayoffBracket.svelte';
	import PlayoffChampion from './PlayoffChampion.svelte';
	import PlayoffComingUp from './PlayoffComingUp.svelte';
	import PlayoffRoundRobin from './PlayoffRoundRobin.svelte';
	import PlayoffSeriesDetail from './PlayoffSeriesDetail.svelte';

	let {
		tournament,
		year,
		championHeading = null
	}: {
		tournament: PlayoffsData;
		year: number | null;
		/** Kicker for the champion banner; defaults to "{year} {bracket} Bracket Champions". */
		championHeading?: ((bracket: Bracket) => string) | null;
	} = $props();

	const upcoming = $derived(comingUp(tournament));

	/** Detail sections exist for series whose teams are both known. */
	function detailed(bracket: Bracket): Series[] {
		return bracket.rounds.flatMap((r) => r.series).filter((s) => s.spot1?.team && s.spot2?.team);
	}
</script>

<PlayoffComingUp entries={upcoming} />

{#if tournament.brackets.length > 0}
	<!-- Brackets and pools are keyed by position: the backend requires names, not unique ones. -->
	<div class="tournament">
		{#each tournament.brackets as bracket, i (i)}
			{#if bracket.winner && bracket.historical}
				<PlayoffChampion
					team={bracket.winner}
					{year}
					bracketName={bracket.name}
					heading={championHeading ? championHeading(bracket) : null}
				/>
			{:else if bracket.winner}
				<p class="playoff-won-by">
					{bracket.name} bracket won by <strong>{bracket.winner.fullName}</strong>.
				</p>
			{/if}
			<PlayoffBracket {bracket} />
		{/each}
	</div>
{/if}

{#each tournament.roundRobins as roundRobin, i (i)}
	<PlayoffRoundRobin {roundRobin} />
{/each}

{#each tournament.brackets as bracket, i (i)}
	{@const series = detailed(bracket)}
	{#if series.length > 0}
		<section class="tournament-items-bracket" aria-label="{bracket.name} bracket series">
			<h2>{bracket.name} Bracket &middot; Series</h2>
			{#each series as s (s.number)}
				<PlayoffSeriesDetail series={s} {bracket} />
			{/each}
		</section>
	{/if}
{/each}
