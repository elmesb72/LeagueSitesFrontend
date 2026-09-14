<script lang="ts">
	// "Also in 2027: Canada Day Cup · Playoffs" — the year's other tournaments,
	// under the heading of a tournament page or the standings. Renders nothing
	// when there is nothing else to point at.
	import type { TournamentKind, TournamentLink } from '$lib/models/Playoffs';
	import { tournamentHref } from '$lib/tournaments/summaries';

	let {
		links,
		year,
		excludeTournamentId = null,
		excludeKind = null,
		lead = 'Also in'
	}: {
		links: TournamentLink[];
		year: number | null;
		/** The page's own tournament, left out of its strip. */
		excludeTournamentId?: number | null;
		/** The playoffs page leaves the playoffs out. */
		excludeKind?: TournamentKind | null;
		lead?: string;
	} = $props();

	const shown = $derived(
		links.filter((l) => l.tournamentId !== excludeTournamentId && l.kind !== excludeKind)
	);
</script>

{#if shown.length > 0}
	<p class="tournament-strip">
		<span class="tournament-strip-lead">{lead}{year ? ` ${year}` : ''}:</span>
		{#each shown as link, i (link.tournamentId)}
			{#if i > 0}<span class="tournament-strip-sep" aria-hidden="true">&middot;</span>{/if}
			<a href={tournamentHref(link.kind, link.tournamentId, year)}>{link.shortName}</a>
		{/each}
	</p>
{/if}

<style>
	.tournament-strip {
		margin: 0 0 var(--space-4);
		font-size: var(--text-sm);
		color: var(--text-soft-contrast);
	}

	.tournament-strip-lead {
		margin-right: var(--space-1);
	}

	.tournament-strip-sep {
		margin: 0 var(--space-2);
	}
</style>
