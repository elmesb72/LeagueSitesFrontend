<script lang="ts">
	// The year's tournaments: the playoffs first, then the mid-season cups.
	import '../Playoffs/+page.css';
	import './+page.css';
	import { goto } from '$app/navigation';
	import {
		dateRangeText,
		progressText,
		shortNameOf,
		tournamentHref
	} from '$lib/tournaments/summaries';

	let { data } = $props();
	const tournaments = $derived(data.tournaments);
	const shortName = $derived(data.siteConfig?.shortName ?? '');
	const year = $derived<number | null>(data.year ?? null);
	const years = $derived<number[]>(data.years ?? []);

	const index = $derived(year === null ? -1 : years.indexOf(year));
	const newer = $derived(index > 0 ? years[index - 1] : null);
	const older = $derived(index >= 0 && index < years.length - 1 ? years[index + 1] : null);

	function pickYear(event: Event): void {
		const chosen = (event.currentTarget as HTMLSelectElement).value;
		goto(`/Tournaments?year=${chosen}`);
	}
</script>

<svelte:head>
	<title>{shortName} » Tournaments{year ? ` (${year})` : ''}</title>
</svelte:head>

<div class="row">
	<div class="section playoff-section">
		<h1>{year ? `${year} ` : ''}Tournaments</h1>

		{#if years.length > 1}
			<nav class="playoff-years" aria-label="Tournament year">
				{#if older}
					<a class="playoff-years-step" href="/Tournaments?year={older}" rel="prev"
						>&lsaquo; {older}</a
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
					<a class="playoff-years-step" href="/Tournaments?year={newer}" rel="next"
						>{newer} &rsaquo;</a
					>
				{:else}
					<span class="playoff-years-step playoff-years-step-off" aria-hidden="true">&nbsp;</span>
				{/if}
			</nav>
		{/if}

		{#if !data.available}
			<div class="subsection no-playoffs">
				<p>The tournaments page is temporarily unavailable. Please try again in a few minutes.</p>
			</div>
		{:else if tournaments.length === 0}
			<div class="subsection no-playoffs">
				<p>No tournaments{year ? ` in ${year}` : ''} yet.</p>
			</div>
		{:else}
			<ul class="tournament-list">
				{#each tournaments as t (t.id)}
					<li class="tournament-card" class:tournament-card-decided={t.decided}>
						<div class="tournament-card-head">
							<a class="tournament-card-name" href={tournamentHref(t.kind, t.id, t.season.year)}>
								{shortNameOf(t)}
							</a>
							<span class="tournament-card-kind"
								>{t.kind === 'playoffs' ? 'Playoffs' : 'Tournament'}</span
							>
						</div>
						<div class="tournament-card-dates">{dateRangeText(t)}</div>
						<div class="tournament-card-progress">{progressText(t)}</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
