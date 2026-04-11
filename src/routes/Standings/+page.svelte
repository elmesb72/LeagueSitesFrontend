<script lang="ts">
	import './+page.css';
	import type { StandingsEntry } from '$lib/models/StandingsEntry';
	import TeamLogoSmall from '../../components/TeamLogoSmall.svelte';

	let { data } = $props();
	const season = $derived(data.season);
	const standings = $derived(data.standings);
</script>

<div class="row">
	<div class="section standings-section">
		<h1>{season?.name ?? 'Standings'}</h1>
		{#if standings.length === 0}
			<p>No standings data available.</p>
		{:else}
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
						<th>Home</th>
						<th>Away</th>
						<th><span class="desktop-only">Streak</span><span class="mobile-only">Strk</span></th>
					</tr>
				</thead>
				<tbody>
					{#each standings as entry}
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
							<td>{entry.homeRecord}</td>
							<td>{entry.awayRecord}</td>
							<td>{entry.streak ?? '-'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
