<script lang="ts">
	import '../../../+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	let creating = $state(false);
	let error = $state('');

	async function createTournament(): Promise<void> {
		creating = true;
		error = '';

		const response = await fetch('/api/Tournament', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ seasonID: data.seasonId })
		});
		creating = false;

		if (response.ok) {
			const created = (await response.json()) as { id: number };
			goto(`/Executive/Edit/Tournament/${created.id}`, { invalidateAll: true });
		} else {
			error = (await response.text()) || 'Could not create the tournament.';
		}
	}

	onMount(() => {
		if (data.redirect) {
			goto(data.redirect);
		}
	});
</script>

<svelte:head>
	<title>{shortName} » Add Tournament</title>
</svelte:head>

<div class="row">
	<div class="section executive-section">
		<h1>Add a mid-season tournament</h1>
		<p class="executive-explanation">
			A mid-season tournament holds its own brackets and pools while staying part of the regular
			season. Use it for a cup or a weekend event.
		</p>

		{#if error}
			<p class="tournament-error">{error}</p>
		{/if}

		<button type="button" class="executive-action" disabled={creating} onclick={createTournament}>
			{creating ? 'Creating...' : 'Create tournament'}
		</button>
		<p class="tournament-back"><a href="/Executive">Back to league administration</a></p>
	</div>
</div>

<style>
	.tournament-error {
		color: var(--color-loss);
		margin-top: var(--space-3);
	}

	.tournament-back {
		margin-top: var(--space-4);
	}
</style>
