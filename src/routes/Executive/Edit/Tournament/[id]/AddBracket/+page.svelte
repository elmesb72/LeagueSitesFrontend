<script lang="ts">
	import '../../../../+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import TournamentBracketForm from '../../../../../../components/TournamentBracketForm.svelte';

	let { data } = $props();
	const tournament = $derived(data.tournament);
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	onMount(() => {
		if (data.redirect) {
			goto(data.redirect);
		}
	});
</script>

<svelte:head>
	<title>{shortName} » Add Bracket</title>
</svelte:head>

{#if tournament}
	<div class="row">
		<div class="section executive-section">
			<h1>{data.prefill?.title ?? `Add a bracket to ${tournament.season.name}`}</h1>
			{#if data.prefill}
				<p class="bracket-prefill">{data.prefill.note}</p>
			{/if}
			<TournamentBracketForm
				tournamentId={tournament.id}
				referenceData={tournament.referenceData}
				defaultSeeding={data.defaultSeeding}
				suggestedName={data.prefill?.name ?? ''}
				{tournament}
			/>
		</div>
	</div>
{/if}

<style>
	.bracket-prefill {
		margin: var(--space-3) 0 0;
		padding: var(--space-3) var(--space-4);
		border-left: 4px solid var(--surface-heading-primary);
		background: var(--surface-page);
		font-size: var(--text-sm);
	}
</style>
