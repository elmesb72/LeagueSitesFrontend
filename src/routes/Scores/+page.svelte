<script lang="ts">
	import './+page.css';
	import ScoresDatePicker from '../../components/ScoresDatePicker.svelte';
	import ScoresGame from '../../components/ScoresGame.svelte';

	let { data } = $props();
	const games = $derived(data.games);
	const standings = $derived(data.standings);
</script>

<div class="row">
	<ScoresDatePicker selectedDate={data.date} gameCounts={data.gameCounts} />
</div>
<div class="row scores-games-row">
	{#if games.length === 0}
		<div class="section">
			<p>No games scheduled for this date.</p>
		</div>
	{:else}
		{#each games as game}
			<div class="section">
				<ScoresGame {game} {standings} />
			</div>
		{/each}
	{/if}
</div>
