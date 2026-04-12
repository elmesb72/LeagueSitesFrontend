<script lang="ts">
	import type { SeriesSpot } from '$lib/models/Playoffs';
	import type { Team } from '$lib/models/Team';
	import TeamLogoSmall from './TeamLogoSmall.svelte';

	let {
		spot,
		winner,
		initialSeed
	}: { spot: SeriesSpot | null; winner: Team | null; initialSeed: number | null } = $props();

	const isWinner = $derived(
		spot?.team != null && winner != null && spot.team.id === winner.id
	);
</script>

{#if spot === null}
	<div class="tournament-series-team">
		<span class="tournament-series-team-name">TBD</span>
	</div>
{:else if spot.team !== null}
	<div class="tournament-series-team" class:tournament-series-winner={isWinner}>
		<a href="/Team/{spot.team.abbreviation}">
			<TeamLogoSmall team={spot.team} />
			<span class="tournament-series-team-name">{spot.team.name}</span>
			{#if initialSeed !== null}<sup>{initialSeed}</sup>{/if}
		</a>
	</div>
{:else if spot.source === 'w'}
	<div class="tournament-series-team">
		<span class="tournament-series-team-name">Winner of {spot.seed}</span>
	</div>
{:else if spot.source === 'l'}
	<div class="tournament-series-team">
		<span class="tournament-series-team-name">Loser of {spot.seed}</span>
	</div>
{:else if spot.source === 'r'}
	<div class="tournament-series-team">
		<span class="tournament-series-team-name">#{spot.seed} remaining</span>
	</div>
{/if}
