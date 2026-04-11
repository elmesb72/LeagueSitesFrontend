<script lang="ts">
	import type { Game } from '$lib/models/Game';
	import type { StandingsEntry } from '$lib/models/StandingsEntry';
	import TeamLogoSmall from './TeamLogoSmall.svelte';

	let { game, standings }: { game: Game; standings: StandingsEntry[] } = $props();

	function formatTime(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
	}

	function isOverdue(dateStr: string): boolean {
		return new Date(dateStr) < new Date();
	}

	function getRecord(teamId: number): string {
		const entry = standings.find((s) => s.team.id === teamId);
		return entry ? entry.record : '';
	}

	function getForfeitTeam(game: Game): string {
		const visitorForfeit = game.scoreVisitor === null || game.scoreVisitor === 0;
		const hostForfeit = game.scoreHost === null || game.scoreHost === 0;
		if (visitorForfeit && hostForfeit) return 'BOTH';
		if (visitorForfeit) return game.visitingTeam.abbreviation;
		return game.hostTeam.abbreviation;
	}
</script>

<div class="scores-game">
	<div class="scores-game-status">
		{#if game.status.name === 'Upcoming'}
			{#if isOverdue(game.date)}
				<span>{formatTime(game.date)} (OVERDUE/UNSCORED)</span>
			{:else}
				<span>{formatTime(game.date)}</span>
			{/if}
		{:else if game.status.name === 'Played'}
			<span>FINAL</span>
		{:else if game.status.name === 'Postponed'}
			<span>POSTPONED</span>
		{:else if game.status.name === 'Forfeit'}
			<span>FORFEIT ({getForfeitTeam(game)})</span>
		{/if}
	</div>
	<div class="scores-game-matchup">
		<div class="scores-game-team-info">
			<div class="scores-game-visitor">
				<div class="team-logo"><TeamLogoSmall team={game.visitingTeam} /></div>
				<div class="team">
					<a href="/Team/{game.visitingTeam.abbreviation}">{game.visitingTeam.name}</a>
				</div>
				<div class="record">{getRecord(game.visitingTeam.id)}</div>
			</div>
			<div class="scores-game-home">
				<div class="team-logo"><TeamLogoSmall team={game.hostTeam} /></div>
				<div class="team">
					<a href="/Team/{game.hostTeam.abbreviation}">{game.hostTeam.name}</a>
				</div>
				<div class="record">{getRecord(game.hostTeam.id)}</div>
			</div>
		</div>
		{#if game.status.name === 'Played'}
			<div class="scores-game-scoreboard-summary">
				<div class="scores-game-scoreboard-summary-header">
					<div>R</div>
					<div>H</div>
					<div>E</div>
				</div>
				<div class="scores-game-scoreboard-summary-visitor">
					<div>{game.scoreVisitor}</div>
					<div></div>
					<div></div>
				</div>
				<div class="scores-game-scoreboard-summary-home">
					<div>{game.scoreHost}</div>
					<div></div>
					<div></div>
				</div>
			</div>
		{/if}
	</div>
	<div class="scores-game-location">
		<a href="/Locations/#{game.location.name}">{game.location.name}</a>
	</div>
</div>
