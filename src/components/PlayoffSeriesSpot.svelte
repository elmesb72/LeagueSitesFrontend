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

<!-- Unresolved spots use -placeholder, not -team-name: the name class is
     display:none on mobile, which used to leave these boxes blank. -->
{#if spot === null}
	<div class="tournament-series-team">
		<span class="tournament-series-team-placeholder">TBD</span>
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
		<span class="tournament-series-team-placeholder">
			<span class="desktop-only">Winner of {spot.seed}</span>
			<span class="mobile-only">W{spot.seed}</span>
		</span>
	</div>
{:else if spot.source === 'l'}
	<div class="tournament-series-team">
		<span class="tournament-series-team-placeholder">
			<span class="desktop-only">Loser of {spot.seed}</span>
			<span class="mobile-only">L{spot.seed}</span>
		</span>
	</div>
{:else if spot.source === 'r'}
	<div class="tournament-series-team">
		<span class="tournament-series-team-placeholder">
			<span class="desktop-only">#{spot.seed} remaining</span>
			<span class="mobile-only">#{spot.seed}</span>
		</span>
	</div>
{/if}
