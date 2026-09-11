<script lang="ts">
	import type { SeriesSpot } from '$lib/models/Playoffs';
	import type { Team } from '$lib/models/Team';
	import { spotLabel } from '$lib/playoffs/labels';
	import TeamLogoSmall from './TeamLogoSmall.svelte';

	let {
		spot,
		winner,
		initialSeed,
		spotId = null
	}: {
		spot: SeriesSpot | null;
		winner: Team | null;
		initialSeed: number | null;
		/** "{seriesNumber}-{0|1}"; lets the connector overlay find this box. */
		spotId?: string | null;
	} = $props();

	const isWinner = $derived(spot?.team != null && winner != null && spot.team.id === winner.id);
	const label = $derived(spotLabel(spot));
</script>

<!-- Unresolved spots use -placeholder, not -team-name: the name class is
     display:none on mobile, which used to leave these boxes blank. The short
     mobile text is decorative; the full meaning is in the visually hidden span. -->
{#if spot === null}
	<div class="tournament-series-team" data-spot={spotId}>
		<span class="tournament-series-team-placeholder">TBD</span>
	</div>
{:else if spot.team !== null}
	<div class="tournament-series-team" class:tournament-series-winner={isWinner} data-spot={spotId}>
		<a href="/Team/{spot.team.abbreviation}" aria-label="{label}{isWinner ? ', winner' : ''}">
			<TeamLogoSmall team={spot.team} />
			<span class="tournament-series-team-name">{spot.team.name}</span>
			{#if initialSeed !== null}<sup>{initialSeed}</sup>{/if}
			{#if isWinner}<span class="tournament-series-check" aria-hidden="true">&#10003;</span>{/if}
		</a>
	</div>
{:else}
	<div class="tournament-series-team" data-spot={spotId}>
		<span class="tournament-series-team-placeholder">
			<span class="playoff-sr-only">{label}</span>
			{#if spot.source === 'w'}
				<span class="desktop-only" aria-hidden="true">Winner of {spot.seed}</span>
				<span class="mobile-only" aria-hidden="true">W{spot.seed}</span>
			{:else if spot.source === 'l'}
				<span class="desktop-only" aria-hidden="true">Loser of {spot.seed}</span>
				<span class="mobile-only" aria-hidden="true">L{spot.seed}</span>
			{:else if spot.source === 'r'}
				<span class="desktop-only" aria-hidden="true">#{spot.seed} remaining</span>
				<span class="mobile-only" aria-hidden="true">#{spot.seed}</span>
			{:else}
				<span aria-hidden="true">TBD</span>
			{/if}
		</span>
	</div>
{/if}
