<script lang="ts">
	import type { Series } from '$lib/models/Playoffs';
	import type { Team } from '$lib/models/Team';
	import type { Game } from '$lib/models/Game';
	import { formatDate, formatTime } from '$lib/utils/date';

	let { series }: { series: Series } = $props();

	function getWinner(game: Game): Team {
		return (game.scoreHost ?? 0) > (game.scoreVisitor ?? 0) ? game.hostTeam : game.visitingTeam;
	}

	function getLoser(game: Game): Team {
		return (game.scoreHost ?? 0) < (game.scoreVisitor ?? 0) ? game.hostTeam : game.visitingTeam;
	}

	const spot1Label = $derived(
		series.spot1?.team
			? `#${series.spot1.initialSeed} ${series.spot1.team.name}`
			: 'TBD'
	);
	const spot2Label = $derived(
		series.spot2?.team
			? `#${series.spot2.initialSeed} ${series.spot2.team.name}`
			: 'TBD'
	);
</script>

<div class="tournament-items-series">
	<h2>{spot1Label} vs {spot2Label}</h2>
	{#if series.results}
		<h3>{series.results.statusText}</h3>
	{/if}
	<div class="tournament-items-games">
		{#each series.games as sg}
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
					{#if sg.game && sg.game.status.name === 'Played'}
						{@const winner = getWinner(sg.game)}
						{@const isHome = winner.id === sg.game.hostTeam.id}
						<a class="tournament-items-game-winner" href="/Team/{winner.abbreviation}">
							{isHome ? '@' : ''}{winner.location}
							{Math.max(sg.game.scoreHost ?? 0, sg.game.scoreVisitor ?? 0)}
						</a>
					{:else if sg.game}
						<a href="/Team/{sg.game.visitingTeam.abbreviation}">
							{sg.game.visitingTeam.location}
						</a>
					{/if}
				</div>
				<div class="tournament-items-game-team">
					{#if sg.game && sg.game.status.name === 'Played'}
						{@const loser = getLoser(sg.game)}
						{@const isHome = loser.id === sg.game.hostTeam.id}
						<a class="tournament-items-game-loser" href="/Team/{loser.abbreviation}">
							{isHome ? '@' : ''}{loser.location}
							{Math.min(sg.game.scoreHost ?? 0, sg.game.scoreVisitor ?? 0)}
						</a>
					{:else if sg.game}
						<a href="/Team/{sg.game.hostTeam.abbreviation}">
							@{sg.game.hostTeam.location}
						</a>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
