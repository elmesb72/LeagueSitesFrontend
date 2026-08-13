<script lang="ts">
	import '../../../+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();
	const shortName = $derived(data.siteConfig?.shortName ?? '');
	const year = new Date().getFullYear();

	let starting = $state(false);
	let error = $state('');

	async function startPlayoffs(): Promise<void> {
		starting = true;
		error = '';

		const response = await fetch('/api/Executive/Season/Playoffs', { method: 'POST' });
		starting = false;

		if (response.ok) {
			const created = (await response.json()) as { seasonID: number; tournamentID: number };
			goto(`/Executive/Edit/Tournament/${created.tournamentID}`, { invalidateAll: true });
		} else {
			error = (await response.text()) || 'Could not start the playoffs.';
		}
	}

	onMount(() => {
		if (data.redirect) {
			goto(data.redirect);
		}
	});
</script>

<svelte:head>
	<title>{shortName} » Set Up Playoffs</title>
</svelte:head>

<div class="row">
	<div class="section executive-section">
		<h1>Set up the {year} playoffs</h1>
		<p class="executive-explanation">
			This creates the {year} playoffs as its own part of the season, separate from the regular season
			schedule. Nothing appears on the public Playoffs page until you add a bracket.
		</p>
		<p class="executive-explanation">Next you will:</p>
		<ol class="playoffs-steps">
			<li>Add a bracket and say which teams are in it</li>
			<li>Choose how long the series are and who gets home field</li>
			<li>Schedule the first round once the standings are final</li>
		</ol>

		{#if error}
			<p class="playoffs-error">{error}</p>
		{/if}

		<button type="button" class="executive-action" disabled={starting} onclick={startPlayoffs}>
			{starting ? 'Starting...' : `Start the ${year} playoffs`}
		</button>
		<p class="playoffs-back"><a href="/Executive">Back to league administration</a></p>
	</div>
</div>

<style>
	.playoffs-steps {
		padding-left: var(--space-5);
		margin-top: var(--space-2);
	}

	.playoffs-steps li {
		padding: 2px 0;
	}

	.playoffs-error {
		color: var(--color-loss);
		margin-top: var(--space-3);
	}

	.playoffs-back {
		margin-top: var(--space-4);
	}
</style>
