<script lang="ts">
	import './+page.css';
	import { goto } from '$app/navigation';
	import type { Bracket, Series } from '$lib/models/Playoffs';
	import { comingUp } from '$lib/playoffs/nextGames';
	import PlayoffBracket from '../../components/PlayoffBracket.svelte';
	import PlayoffChampion from '../../components/PlayoffChampion.svelte';
	import PlayoffComingUp from '../../components/PlayoffComingUp.svelte';
	import PlayoffRoundRobin from '../../components/PlayoffRoundRobin.svelte';
	import PlayoffSeriesDetail from '../../components/PlayoffSeriesDetail.svelte';

	let { data } = $props();
	const playoffs = $derived(data.playoffs);
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	/**
	 * Older pages passed only `playoffs`; derive the state when the loader did not.
	 * (Tests still render the page with a bare `{ playoffs }`.)
	 */
	const state = $derived<'ok' | 'empty' | 'notFound' | 'unavailable'>(
		data.state ??
			(playoffs === null
				? data.year
					? 'notFound'
					: 'empty'
				: playoffs.brackets.length > 0 || playoffs.roundRobins.length > 0
					? 'ok'
					: 'empty')
	);

	/** The year being shown: the season's own year, else the one asked for in the URL. */
	const year = $derived<number | null>(playoffs?.season?.year ?? data.year ?? null);
	const years = $derived<number[]>(data.years ?? []);

	// Neighbours in the league's list of seasons (newest first), for the arrows.
	const index = $derived(year === null ? -1 : years.indexOf(year));
	const newer = $derived(index > 0 ? years[index - 1] : null);
	const older = $derived(index >= 0 && index < years.length - 1 ? years[index + 1] : null);

	const upcoming = $derived(playoffs ? comingUp(playoffs) : []);

	function pickYear(event: Event): void {
		const chosen = (event.currentTarget as HTMLSelectElement).value;
		goto(`/Playoffs?year=${chosen}`);
	}

	/** Detail sections exist for series whose teams are both known. */
	function detailed(bracket: Bracket): Series[] {
		return bracket.rounds.flatMap((r) => r.series).filter((s) => s.spot1?.team && s.spot2?.team);
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

		{#if state === 'ok' && playoffs}
			<PlayoffComingUp entries={upcoming} />

			{#if playoffs.brackets.length > 0}
				<div class="tournament">
					{#each playoffs.brackets as bracket (bracket.name)}
						{#if bracket.winner && bracket.historical}
							<PlayoffChampion team={bracket.winner} {year} bracketName={bracket.name} />
						{:else if bracket.winner}
							<p class="playoff-won-by">
								{bracket.name} bracket won by <strong>{bracket.winner.fullName}</strong>.
							</p>
						{/if}
						<PlayoffBracket {bracket} />
					{/each}
				</div>
			{/if}

			{#each playoffs.roundRobins as roundRobin (roundRobin.name)}
				<PlayoffRoundRobin {roundRobin} />
			{/each}

			{#each playoffs.brackets as bracket (bracket.name)}
				{@const series = detailed(bracket)}
				{#if series.length > 0}
					<section class="tournament-items-bracket" aria-label="{bracket.name} bracket series">
						<h2>{bracket.name} Bracket &middot; Series</h2>
						{#each series as s (s.number)}
							<PlayoffSeriesDetail series={s} {bracket} />
						{/each}
					</section>
				{/if}
			{/each}
		{:else}
			<div class="subsection no-playoffs">
				<p>
					{#if state === 'unavailable'}
						The playoffs page is temporarily unavailable. Please try again in a few minutes.
					{:else if state === 'notFound' && year}
						There are no playoffs recorded for {year}.
					{:else}
						The playoffs have not yet started for this season.
					{/if}
				</p>
			</div>
		{/if}
	</div>
</div>
