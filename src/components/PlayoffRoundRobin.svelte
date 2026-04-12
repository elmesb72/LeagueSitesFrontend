<script lang="ts">
	import type { RoundRobin } from '$lib/models/Playoffs';
	import type { Game } from '$lib/models/Game';
	import HomepageGame from './HomepageGame.svelte';
	import TeamLogoSmall from './TeamLogoSmall.svelte';
	import { formatDateLabel, groupByDate } from '$lib/utils/date';

	let { roundRobin }: { roundRobin: RoundRobin } = $props();

	const gamesByDate = $derived(
		groupByDate(roundRobin.games.map((g) => g.game), (g) => g.date)
	);
</script>

{#if roundRobin.standings && roundRobin.standings.length > 0}
	<div class="round-robin">
		<h2>{roundRobin.name} Round Robin Standings</h2>
		<table class="standings">
			<thead>
				<tr>
					<th>Team</th>
					<th>GP</th>
					<th>W</th>
					<th>L</th>
					<th>T</th>
					<th>Pts</th>
					<th>RF</th>
					<th>RA</th>
					<th>Diff</th>
				</tr>
			</thead>
			<tbody>
				{#each roundRobin.standings as entry}
					<tr>
						<td>
							<a href="/Team/{entry.team.abbreviation}" class="standings-link">
								<TeamLogoSmall team={entry.team} />{entry.team.fullName}
							</a>
						</td>
						<td>{entry.gamesPlayed}</td>
						<td>{entry.wins}</td>
						<td>{entry.losses}</td>
						<td>{entry.ties}</td>
						<td>{entry.points}</td>
						<td>{entry.runsScored}</td>
						<td>{entry.runsAllowed}</td>
						{#if entry.runDifferential > 0}
							<td class="green">+{entry.runDifferential}</td>
						{:else if entry.runDifferential === 0}
							<td>0</td>
						{:else}
							<td class="red">{entry.runDifferential}</td>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

{#if roundRobin.games.length > 0}
	<div class="round-robin-games">
		<h2>{roundRobin.name} Games</h2>
		{#each [...gamesByDate] as [dateStr, games]}
			<h2 class="round-robin-game-date">{formatDateLabel(dateStr)}</h2>
			{#each games as game}
				<HomepageGame {game} />
			{/each}
		{/each}
	</div>
{/if}
