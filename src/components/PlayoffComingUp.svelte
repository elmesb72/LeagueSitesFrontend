<script lang="ts">
	// "Coming up": the next scheduled game of every live series, soonest first.
	import type { ComingUpEntry } from '$lib/playoffs/nextGames';
	import { seriesAnchor } from '$lib/playoffs/anchors';
	import { formatDate, formatTime } from '$lib/utils/date';

	let { entries }: { entries: ComingUpEntry[] } = $props();
</script>

{#if entries.length > 0}
	<section class="playoff-coming-up" aria-labelledby="playoff-coming-up-title">
		<h2 class="playoff-coming-up-title" id="playoff-coming-up-title">Coming up</h2>
		<ol class="playoff-coming-up-list">
			{#each entries as entry (seriesAnchor(entry.bracket, entry.series))}
				<li>
					<a class="playoff-coming-up-series" href="#{seriesAnchor(entry.bracket, entry.series)}">
						{entry.round.name}, series {entry.series.number}
					</a>
					<span class="playoff-coming-up-matchup">
						{entry.game.visitingTeam.name} at {entry.game.hostTeam.name}
					</span>
					<a href="/Game/{entry.game.id}"
						>{formatDate(entry.game.date)}, {formatTime(entry.game.date)}</a
					>
					{#if entry.game.location}
						<span class="playoff-coming-up-park">{entry.game.location.name}</span>
					{/if}
				</li>
			{/each}
		</ol>
	</section>
{/if}
