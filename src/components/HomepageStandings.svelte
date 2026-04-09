<script lang="ts">
	import type { StandingsEntry } from '$lib/models/StandingsEntry';
	import TeamLogoSmall from './TeamLogoSmall.svelte';

	let { standings }: { standings: StandingsEntry[] } = $props();
</script>

<div class="home-standings">
	<h1><a href="/Standings">Standings</a></h1>
	<table class="home-standings-table">
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
		{#each standings as entry}
			<tr>
				<td>
					<a href="/Team/{entry.team.abbreviation}" class="home-standings-link">
						<TeamLogoSmall team={entry.team} />{entry.team.abbreviation}
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
