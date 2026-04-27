<script lang="ts">
	import type { Game } from '$lib/models/Game';
	import type { StandingsEntry } from '$lib/models/StandingsEntry';
	import TeamLogoSmall from './TeamLogoSmall.svelte';
	import { formatTime } from '$lib/utils/date';

	let { game, canEdit = false, standings }: { game: Game; canEdit?: boolean; standings: StandingsEntry[] } = $props();

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
				<a href="/Game/{game.id}">{formatTime(game.date)} (OVERDUE/UNSCORED)</a>
			{:else}
				<a href="/Game/{game.id}">{formatTime(game.date)}</a>
			{/if}
		{:else if game.status.name === 'Played'}
			<a href="/Game/{game.id}">FINAL</a>
		{:else if game.status.name === 'Postponed'}
			<a href="/Game/{game.id}">POSTPONED</a>
		{:else if game.status.name === 'Forfeit'}
			<a href="/Game/{game.id}">FORFEIT ({getForfeitTeam(game)})</a>
		{/if}
		{#if canEdit}
			<a href="/Game/{game.id}/Edit" title="Edit game" class="scores-game-edit">
				<i class="fa-solid fa-pen-to-square"></i>
			</a>
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
