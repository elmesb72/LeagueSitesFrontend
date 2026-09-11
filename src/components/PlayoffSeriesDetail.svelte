<script lang="ts">
	import type { Bracket, Series, SeriesSpot } from '$lib/models/Playoffs';
	import { bracketAnchor, seriesAnchor } from '$lib/playoffs/anchors';
	import { getLoser, getWinner, isDecided, isTied, scoreText } from '$lib/playoffs/gameResult';
	import { leadAfterEachGame } from '$lib/playoffs/seriesLead';
	import { seriesFormatLabel } from '$lib/utils/bracketBuilder';
	import { formatDate, formatTime } from '$lib/utils/date';

	let {
		series,
		bracket = null
	}: {
		series: Series;
		/** When given, the section gets a stable id the bracket links to, and a link back. */
		bracket?: Bracket | null;
	} = $props();

	// initialSeed is null for a team that is not in this bracket's seed list —
	// one that crossed over from another bracket, for instance. Drop the seed
	// prefix rather than printing '#null'. PlayoffSeriesSpot guards the same way.
	function spotLabel(spot: SeriesSpot | null): string {
		if (!spot?.team) return 'TBD';
		return spot.initialSeed !== null ? `#${spot.initialSeed} ${spot.team.name}` : spot.team.name;
	}

	const spot1Label = $derived(spotLabel(series.spot1));
	const spot2Label = $derived(spotLabel(series.spot2));
	const formatLabel = $derived(seriesFormatLabel(series.format, series.hostOrder.length));
	const leads = $derived(leadAfterEachGame(series));
	const id = $derived(bracket ? seriesAnchor(bracket, series) : undefined);
</script>

<article class="tournament-items-series" {id}>
	<div class="tournament-items-series-heading">
		<h3>{spot1Label} vs {spot2Label}</h3>
		{#if bracket}
			<a class="tournament-items-series-back" href="#{bracketAnchor(bracket)}">&uarr; bracket</a>
		{/if}
	</div>
	<p class="tournament-items-series-status-line">
		<!-- "Series tied 1-1" is ambiguous without the length, so the format leads. -->
		<span class="tournament-items-series-format">{formatLabel}</span>
		{#if series.results}
			<span class="tournament-items-series-separator" aria-hidden="true">&middot;</span>
			<span class="tournament-items-series-status">{series.results.statusText}</span>
		{/if}
	</p>
	<div class="tournament-items-games">
		{#each series.games as sg, i (sg.gameNumber)}
			<div class="tournament-items-game">
				<div class="tournament-items-game-number">
					{#if sg.game}
						<a href="/Game/{sg.game.id}">
							<b>Gm {sg.gameNumber}</b><br />
							<span class="tournament-items-game-date">
								{formatDate(sg.game.date)}, {formatTime(sg.game.date)}
							</span>
						</a>
					{:else}
						<b>Gm {sg.gameNumber}</b><br />
						<span class="tournament-items-game-tbd">(Date TBD)</span>
					{/if}
				</div>
				<div class="tournament-items-game-location">
					{#if sg.game?.location}
						<a href="/Locations/#{sg.game.location.name}">{sg.game.location.name}</a>
					{:else}
						<span class="tournament-items-game-tbd">(Location TBD)</span>
					{/if}
				</div>
				<div class="tournament-items-game-team">
					{#if sg.game && isDecided(sg.game)}
						{@const winner = getWinner(sg.game)}
						{@const isHome = winner.id === sg.game.hostTeam.id}
						<a class="tournament-items-game-winner" href="/Team/{winner.abbreviation}">
							{isHome ? '@' : ''}{winner.location}
							{scoreText(sg.game, 'winner')}
						</a>
					{:else if sg.game}
						<a href="/Team/{sg.game.visitingTeam.abbreviation}">
							{sg.game.visitingTeam.location}
							{#if isTied(sg.game)}{sg.game.scoreVisitor}{/if}
						</a>
					{/if}
				</div>
				<div class="tournament-items-game-team">
					{#if sg.game && isDecided(sg.game)}
						{@const loser = getLoser(sg.game)}
						{@const isHome = loser.id === sg.game.hostTeam.id}
						<a class="tournament-items-game-loser" href="/Team/{loser.abbreviation}">
							{isHome ? '@' : ''}{loser.location}
							{scoreText(sg.game, 'loser')}
						</a>
					{:else if sg.game}
						<a href="/Team/{sg.game.hostTeam.abbreviation}">
							@{sg.game.hostTeam.location}
							{#if isTied(sg.game)}{sg.game.scoreHost}{/if}
						</a>
					{/if}
				</div>
				<!-- Series score after this game; the clinching game is emphasised. -->
				<div
					class="tournament-items-game-lead"
					class:tournament-items-game-lead-final={leads[i]?.includes(' win ')}
				>
					{leads[i] ?? ''}
				</div>
			</div>
		{/each}
	</div>
</article>
