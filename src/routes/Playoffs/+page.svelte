<script lang="ts">
	import './+page.css';
	import { goto } from '$app/navigation';
	import TournamentStrip from '../../components/TournamentStrip.svelte';
	import TournamentView from '../../components/TournamentView.svelte';
	import { toLinks } from '$lib/tournaments/summaries';

	let { data } = $props();
	/** The year's mid-season tournaments, for the strip under the year picker. */
	const others = $derived(toLinks(data.others ?? []));
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
	/** Set only for executives: the admin page for the playoffs being shown. */
	const editUrl = $derived<string | null>(data.editUrl ?? null);

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
		<h1 class="playoff-title">
			{year ? `${year} ` : ''}Playoffs{#if editUrl}<a
					class="playoff-edit-link"
					href={editUrl}
					title="Edit the {year ?? ''} playoffs"
					aria-label="Edit the {year ?? ''} playoffs"
					><i class="fa-solid fa-pen-to-square" aria-hidden="true"></i></a
				>{/if}
		</h1>

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

		<TournamentStrip links={others} {year} excludeKind="playoffs" />

		{#if state === 'ok' && playoffs}
			<TournamentView tournament={playoffs} {year} />
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
