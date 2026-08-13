<script lang="ts">
	import '../../../../+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import TournamentPoolForm from '../../../../../../components/TournamentPoolForm.svelte';

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
	<title>{shortName} » Add Pool</title>
</svelte:head>

{#if tournament}
	<div class="row">
		<div class="section executive-section">
			<h1>Add a pool to {tournament.season.name}</h1>
			<TournamentPoolForm
				tournamentId={tournament.id}
				referenceData={tournament.referenceData}
				defaultSeeding={data.defaultSeeding}
			/>
		</div>
	</div>
{/if}
