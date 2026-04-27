<script lang="ts">
	import './+page.css';
	import ScoresDatePicker from '../../components/ScoresDatePicker.svelte';
	import ScoresGame from '../../components/ScoresGame.svelte';

	let { data } = $props();
	const games = $derived(data.games);
	const standings = $derived(data.standings);
	const shortName = $derived(data.siteConfig?.shortName ?? '');
</script>

<svelte:head>
	<title>{shortName} » Scores</title>
</svelte:head>

<div class="row">
	<div class="section scores-date-picker-section">
		<ScoresDatePicker selectedDate={data.date} gameCounts={data.gameCounts} />
	</div>
</div>
{#if games.length > 0}
	<div class="row scores-games-row">
		{#each games as entry}
			<div class="section">
				<ScoresGame game={entry.game} canEdit={entry.canEdit} {standings} />
			</div>
		{/each}
	</div>
{/if}
