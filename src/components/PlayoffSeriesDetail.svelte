<script lang="ts">
	import type { Series, SeriesSpot } from '$lib/models/Playoffs';
	import type { Team } from '$lib/models/Team';
	import type { Game } from '$lib/models/Game';
	import { formatDate, formatTime } from '$lib/utils/date';

	let { series }: { series: Series } = $props();

	function isForfeit(game: Game): boolean {
		// Backend status names are 'Forfeit (Home)' / 'Forfeit (Away)',
		// naming the team that forfeited.
		return game.status.name.startsWith('Forfeit');
	}

	// A game with a definite winner: a forfeit, or a played game with
	// unequal scores.
	function isDecided(game: Game): boolean {
		if (isForfeit(game)) return true;
		return game.status.name === 'Played' && game.scoreHost !== game.scoreVisitor;
	}

	// A played game that ended level (e.g. called for darkness).
	function isTied(game: Game): boolean {
		return game.status.name === 'Played' && game.scoreHost === game.scoreVisitor;
	}

	function getWinner(game: Game): Team {
		if (isForfeit(game)) {
			return game.status.name === 'Forfeit (Home)' ? game.visitingTeam : game.hostTeam;
		}
		return (game.scoreHost ?? 0) > (game.scoreVisitor ?? 0) ? game.hostTeam : game.visitingTeam;
	}

	function getLoser(game: Game): Team {
		return getWinner(game).id === game.hostTeam.id ? game.visitingTeam : game.hostTeam;
	}

	// Forfeit scores in the database may be null (standings substitute the
	// league's configured forfeit score), so show FW/FL markers instead of
	// inventing numbers.
	function scoreText(game: Game, side: 'winner' | 'loser'): string {
		if (isForfeit(game)) return side === 'winner' ? 'FW' : 'FL';
		const host = game.scoreHost ?? 0;
		const visitor = game.scoreVisitor ?? 0;
		return String(side === 'winner' ? Math.max(host, visitor) : Math.min(host, visitor));
	}

	// initialSeed is null for a team that is not in this bracket's seed list —
	// one that crossed over from another bracket, for instance. Drop the seed
	// prefix rather than printing '#null'. PlayoffSeriesSpot guards the same way.
	function spotLabel(spot: SeriesSpot | null): string {
		if (!spot?.team) return 'TBD';
		return spot.initialSeed !== null ? `#${spot.initialSeed} ${spot.team.name}` : spot.team.name;
	}

	const spot1Label = $derived(spotLabel(series.spot1));
	const spot2Label = $derived(spotLabel(series.spot2));
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
			</div>
		{/each}
	</div>
</div>
