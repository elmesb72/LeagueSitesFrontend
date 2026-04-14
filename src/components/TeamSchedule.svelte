<script lang="ts">
	import type { Game } from '$lib/models/Game';
	import type { Team } from '$lib/models/Team';
	import { formatDate, formatTime } from '$lib/utils/date';

	let { games, focusTeam }: { games: Game[]; focusTeam: Team } = $props();

	function getResult(game: Game): string {
		if (game.status.name === 'Played') {
			const isHost = game.hostTeam.id === focusTeam.id;
			const teamScore = isHost ? (game.scoreHost ?? 0) : (game.scoreVisitor ?? 0);
			const oppScore = isHost ? (game.scoreVisitor ?? 0) : (game.scoreHost ?? 0);
			if (teamScore > oppScore) return `W, ${teamScore}-${oppScore}`;
			if (teamScore < oppScore) return `L, ${oppScore}-${teamScore}`;
			return `T, ${teamScore}-${oppScore}`;
		}
		if (game.status.name === 'Forfeit') {
			const isHost = game.hostTeam.id === focusTeam.id;
			const teamScore = isHost ? (game.scoreHost ?? 0) : (game.scoreVisitor ?? 0);
			const won = teamScore > 0;
			return won ? 'FW, 7-0' : 'FL, 7-0';
		}
		return '';
	}
</script>

<div class="schedule">
	<table>
		<thead>
			<tr>
				<th>Date</th>
				<th>Time</th>
				<th>Location</th>
				<th>Home</th>
				<th>Visitor</th>
				<th>Result</th>
			</tr>
		</thead>
		<tbody>
			{#each games as game}
				<tr>
					<td><a href="/Game/{game.id}">{formatDate(game.date)}</a></td>
					<td><a href="/Game/{game.id}">{formatTime(game.date)}</a></td>
					<td><a href="/Locations/#{game.location.name}">{game.location.name}</a></td>
					<td class:soft={game.hostTeam.id === focusTeam.id}>
						{#if game.hostTeam.id === focusTeam.id}
							<span>{game.hostTeam.name}</span>
						{:else}
							<a href="/Team/{game.hostTeam.abbreviation}">{game.hostTeam.name}</a>
						{/if}
					</td>
					<td class:soft={game.visitingTeam.id === focusTeam.id}>
						{#if game.visitingTeam.id === focusTeam.id}
							<span>{game.visitingTeam.name}</span>
						{:else}
							<a href="/Team/{game.visitingTeam.abbreviation}">{game.visitingTeam.name}</a>
						{/if}
					</td>
					<td class="schedule-result">
						{#if getResult(game)}
							<a href="/Game/{game.id}">{getResult(game)}</a>
						{:else if game.status.name !== 'Upcoming'}
							<a href="/Game/{game.id}"><small>{game.status.name}</small></a>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
