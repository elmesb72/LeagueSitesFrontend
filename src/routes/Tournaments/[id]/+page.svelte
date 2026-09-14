<script lang="ts">
	// A mid-season tournament's public page: the same view as the playoffs, headed
	// by the tournament's own name.
	import '../../Playoffs/+page.css';
	import TournamentStrip from '../../../components/TournamentStrip.svelte';
	import TournamentView from '../../../components/TournamentView.svelte';
	import { championHeadingFor, toLinks } from '$lib/tournaments/summaries';

	let { data } = $props();
	const tournament = $derived(data.tournament);
	const state = $derived(data.state);
	const shortName = $derived(data.siteConfig?.shortName ?? '');
	const year = $derived<number | null>(tournament?.season?.year ?? null);
	const title = $derived(tournament?.name ?? 'Tournament');
	const editUrl = $derived<string | null>(data.editUrl ?? null);
	const others = $derived(toLinks(data.others ?? []));
</script>

<svelte:head>
	<title>{shortName} » {title}</title>
</svelte:head>

<div class="row">
	<div class="section playoff-section">
		<h1 class="playoff-title">
			{title}{#if editUrl}<a
					class="playoff-edit-link"
					href={editUrl}
					title="Edit the {title}"
					aria-label="Edit the {title}"
					><i class="fa-solid fa-pen-to-square" aria-hidden="true"></i></a
				>{/if}
		</h1>

		<TournamentStrip links={others} {year} excludeTournamentId={tournament?.id ?? null} />

		{#if state === 'ok' && tournament}
			<TournamentView {tournament} {year} championHeading={championHeadingFor(tournament)} />
		{:else}
			<div class="subsection no-playoffs">
				<p>
					{#if state === 'unavailable'}
						This tournament page is temporarily unavailable. Please try again in a few minutes.
					{:else if state === 'notFound'}
						There is no tournament here. It may have been removed.
					{:else}
						{title} has not started yet. Check back once the brackets are set.
					{/if}
				</p>
			</div>
		{/if}
	</div>
</div>
