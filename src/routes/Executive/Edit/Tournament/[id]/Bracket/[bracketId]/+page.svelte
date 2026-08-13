<script lang="ts">
	import '../../../../../+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import TournamentBracketForm from '../../../../../../../components/TournamentBracketForm.svelte';
	import TournamentSeriesScheduler from '../../../../../../../components/TournamentSeriesScheduler.svelte';

	let { data } = $props();
	const tournament = $derived(data.tournament);
	const bracket = $derived(data.bracket);
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	let showSettings = $state(false);

	onMount(() => {
		if (data.redirect) {
			goto(data.redirect);
		}
	});
</script>

<svelte:head>
	<title>{shortName} » {bracket?.name ?? 'Bracket'}</title>
</svelte:head>

{#if tournament && bracket}
	<div class="row">
		<div class="section executive-section">
			<h1>{bracket.name} bracket</h1>
			<p class="executive-explanation">
				<a href="/Executive/Edit/Tournament/{tournament.id}">{tournament.season.name}</a>
				{#if bracket.winner}
					&middot; won by {bracket.winner.fullName}
				{/if}
			</p>

			{#if bracket.resolvedSeeds.length > 0}
				<h2>Seeds</h2>
				<ol class="bracket-seeds">
					{#each bracket.resolvedSeeds as seed (seed.seed)}
						<li>
							<span class="bracket-seed-number">{seed.seed}</span>
							<a href="/Team/{seed.team.abbreviation}">{seed.team.fullName}</a>
						</li>
					{/each}
				</ol>
			{:else}
				<p class="executive-explanation">
					The seeds are not settled yet, so no matchups can be scheduled. They fill in as the games
					that feed this bracket are played.
				</p>
			{/if}

			<h2>Games</h2>
			<TournamentSeriesScheduler {bracket} locations={tournament.referenceData.locations} />

			<h2>Bracket settings</h2>
			{#if showSettings}
				<TournamentBracketForm
					tournamentId={tournament.id}
					referenceData={tournament.referenceData}
					existing={bracket}
				/>
			{:else}
				<p class="executive-explanation">
					Change the name, seeding, series lengths or home field order.
				</p>
				<button type="button" class="executive-action" onclick={() => (showSettings = true)}>
					Edit bracket settings
				</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.bracket-seeds {
		list-style: none;
		padding: 0;
		margin-top: var(--space-2);
		columns: 2;
		max-width: 520px;
	}

	.bracket-seeds li {
		padding: 2px 0;
	}

	.bracket-seed-number {
		display: inline-block;
		min-width: 26px;
		color: var(--text-soft-contrast);
		font-size: var(--text-sm);
	}
</style>
