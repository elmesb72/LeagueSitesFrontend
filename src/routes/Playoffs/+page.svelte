<script lang="ts">
	import './+page.css';
	import { goto } from '$app/navigation';
	import PlayoffBracket from '../../components/PlayoffBracket.svelte';
	import PlayoffSeriesDetail from '../../components/PlayoffSeriesDetail.svelte';
	import PlayoffRoundRobin from '../../components/PlayoffRoundRobin.svelte';

	let { data } = $props();
	const playoffs = $derived(data.playoffs);
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	/** The year being shown: the season's own year, else the one asked for in the URL. */
	const year = $derived<number | null>(playoffs?.season?.year ?? data.year ?? null);
	const years = $derived<number[]>(data.years ?? []);

	// Neighbours in the league's list of seasons (newest first), for the arrows.
	const index = $derived(year === null ? -1 : years.indexOf(year));
	const newer = $derived(index > 0 ? years[index - 1] : null);
	const older = $derived(index >= 0 && index < years.length - 1 ? years[index + 1] : null);

	function pickYear(event: Event): void {
		const chosen = (event.currentTarget as HTMLSelectElement).value;
		goto(`/Playoffs?year=${chosen}`);
	}
</script>

<svelte:head>
	<title>{shortName} » Playoffs{year ? ` (${year})` : ''}</title>
</svelte:head>

<div class="row">
	<div class="section playoff-section">
		<h1>{year ? `${year} ` : ''}Playoffs</h1>

		{#if years.length > 1}
			<nav class="playoff-years" aria-label="Playoff year">
				{#if older}
					<a class="playoff-years-step" href="/Playoffs?year={older}" rel="prev">&lsaquo; {older}</a
					>
				{:else}
					<span class="playoff-years-step playoff-years-step-off" aria-hidden="true">&nbsp;</span>
				{/if}
				<select
					class="playoff-years-select"
					aria-label="Choose a year"
					value={String(year ?? '')}
					onchange={pickYear}
				>
					{#if year !== null && !years.includes(year)}
						<option value={String(year)}>{year}</option>
					{/if}
					{#each years as y (y)}
						<option value={String(y)}>{y}</option>
					{/each}
				</select>
				{#if newer}
					<a class="playoff-years-step" href="/Playoffs?year={newer}" rel="next">{newer} &rsaquo;</a
					>
				{:else}
					<span class="playoff-years-step playoff-years-step-off" aria-hidden="true">&nbsp;</span>
				{/if}
			</nav>
		{/if}

		{#if playoffs && (playoffs.brackets.length > 0 || playoffs.roundRobins.length > 0)}
			{#if playoffs.brackets.length > 0}
				<div class="tournament">
					{#each playoffs.brackets as bracket}
						<PlayoffBracket {bracket} />
					{/each}
				</div>
			{/if}

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
				<p>
					{#if playoffs === null && year}
						There are no playoffs recorded for {year}.
					{:else}
						The playoffs have not yet started for this season.
					{/if}
				</p>
			</div>
		{/if}
	</div>
</div>
