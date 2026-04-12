<script lang="ts">
	import './+page.css';
	import PlayoffBracket from '../../components/PlayoffBracket.svelte';
	import PlayoffSeriesDetail from '../../components/PlayoffSeriesDetail.svelte';
	import PlayoffRoundRobin from '../../components/PlayoffRoundRobin.svelte';

	let { data } = $props();
	const playoffs = $derived(data.playoffs);
	const shortName = $derived(data.siteConfig?.shortName ?? '');
</script>

<svelte:head>
	<title>{shortName} » Playoffs{playoffs?.season?.year ? ` (${playoffs.season.year})` : ''}</title>
</svelte:head>

<div class="row">
	<div class="section playoff-section">
		<h1>{playoffs?.season?.year ?? ''} Playoffs</h1>
		{#if playoffs && playoffs.brackets.length > 0}
			<div class="tournament">
				{#each playoffs.brackets as bracket}
					<PlayoffBracket {bracket} />
				{/each}
			</div>

			{#each playoffs.roundRobins as roundRobin}
				<PlayoffRoundRobin {roundRobin} />
			{/each}

			{#each playoffs.brackets as bracket}
				{#each bracket.rounds as round}
					{#each round.series as series}
						{#if series.spot1?.team && series.spot2?.team}
							<PlayoffSeriesDetail {series} />
						{/if}
					{/each}
				{/each}
			{/each}
		{:else}
			<div class="subsection no-playoffs">
				<p>The playoffs have not yet started for this season.</p>
			</div>
		{/if}
	</div>
</div>
