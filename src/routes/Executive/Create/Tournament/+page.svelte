<script lang="ts">
	// Setting up a mid-season tournament: the same shape as "Set up the playoffs",
	// plus a name and a start date. It becomes its own season, so its games stay
	// out of the league table, and it gets a public page of its own.
	import '../../+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	let name = $state('');
	let startDate = $state(new Date().toISOString().slice(0, 10));
	let creating = $state(false);
	let error = $state('');

	/** The year the season will belong to: the start date's. */
	const year = $derived(startDate ? Number(startDate.slice(0, 4)) : new Date().getFullYear());

	/**
	 * What the season will be called. The year always goes in front, added by the
	 * site — so "Canada Day Cup" becomes "2027 Canada Day Cup", and typing the year
	 * yourself does not double it.
	 */
	const seasonName = $derived.by(() => {
		let trimmed = name.trim();
		const prefix = `${year} `;
		if (trimmed.startsWith(prefix)) trimmed = trimmed.slice(prefix.length).trim();
		return trimmed ? `${year} ${trimmed}` : '';
	});

	async function createTournament(): Promise<void> {
		error = '';
		if (!name.trim()) {
			error = 'Give the tournament a name.';
			return;
		}
		if (!startDate) {
			error = 'Give the tournament a start date.';
			return;
		}

		creating = true;
		const response = await fetch('/api/Executive/Season/Tournament', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: name.trim(), startDate })
		});
		creating = false;

		if (response.ok) {
			const created = (await response.json()) as { seasonID: number; tournamentID: number };
			goto(`/Executive/Edit/Tournament/${created.tournamentID}`, { invalidateAll: true });
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
	<title>{shortName} » Set Up a Tournament</title>
</svelte:head>

<div class="row">
	<div class="section executive-section">
		<h1>Set up a mid-season tournament</h1>
		<p class="executive-explanation">
			A cup or weekend event with its own brackets and pools and its own public page. It is kept
			apart from the regular season: its games do not count in the regular-season standings.
		</p>
		<p class="executive-explanation">
			A typical setup is a Main bracket, then a B-side pool for the teams knocked out early,
			sometimes with its own final. You add each piece in turn and the tournament page suggests the
			next one.
		</p>
		<p class="executive-explanation">Next you will:</p>
		<ol class="tournament-steps">
			<li>Add a bracket and say which teams are in it</li>
			<li>Choose how long the series are and who gets home field</li>
			<li>Schedule the games</li>
		</ol>

		<div class="tournament-fields">
			<label class="tournament-field">
				<span>Name</span>
				<input
					type="text"
					placeholder="Canada Day Cup"
					bind:value={name}
					aria-label="Tournament name"
				/>
			</label>
			<label class="tournament-field">
				<span>Start date</span>
				<input type="date" bind:value={startDate} aria-label="Start date" />
			</label>
		</div>
		<p class="tournament-preview executive-explanation" aria-live="polite">
			{#if seasonName}
				It will appear as <strong>{seasonName}</strong> — the year is added for you, like "{year} Playoffs".
			{:else}
				The year is added for you: "Canada Day Cup" becomes "{year} Canada Day Cup", like "{year} Playoffs".
			{/if}
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
	.tournament-steps {
		padding-left: var(--space-5);
		margin-top: var(--space-2);
	}

	.tournament-steps li {
		padding: 2px 0;
	}

	.tournament-fields {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		margin: var(--space-4) 0;
	}

	.tournament-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-size: var(--text-sm);
	}

	.tournament-field input {
		height: 34px;
		padding: 0 var(--space-2);
		border: var(--game-border);
		border-radius: var(--radius-sm);
		font-family: inherit;
		font-size: var(--text-base);
		min-width: 260px;
	}

	.tournament-preview {
		margin-top: 0;
	}

	.tournament-error {
		color: var(--color-loss);
		margin-top: var(--space-3);
	}

	.tournament-back {
		margin-top: var(--space-4);
	}
</style>
