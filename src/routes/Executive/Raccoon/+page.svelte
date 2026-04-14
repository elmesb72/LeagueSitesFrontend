<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();
	const games = $derived(data.games);
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	function formatGameDate(dateStr: string): string {
		const datePart = new Date(dateStr.split('T')[0] + 'T12:00:00').toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
		const timePart = new Date(dateStr).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit'
		});
		return `${datePart}, ${timePart}`;
	}

	onMount(() => {
		if (data.redirect) {
			goto(data.redirect);
		}
	});
</script>

<svelte:head>
	<title>{shortName} » Recover Deleted Games</title>
</svelte:head>

<div class="row">
	<div class="section executive-section executive-league">
		<h1>Deleted Games ({games.length})</h1>
		{#if games.length > 0}
			<ul>
				{#each games as game}
					<li>
						<a href="/Game/{game.id}">
							{formatGameDate(game.date)}: {game.visitingTeam.fullName} at {game.hostTeam.fullName} in {game.location.name}
						</a>
					</li>
				{/each}
			</ul>
		{:else}
			<p>No deleted games found.</p>
		{/if}
		<span style="font-size: 48px;">🦝</span>
	</div>
</div>
