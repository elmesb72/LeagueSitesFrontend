<script lang="ts">
	import './+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();
	const dashboard = $derived(data.dashboard);
	const season = $derived(dashboard?.currentSeason);
	const playoffs = $derived(dashboard?.currentPlayoffs);
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	const progressPct = $derived(
		season && season.gamesScheduled > 0
			? (season.gamesPlayed / season.gamesScheduled) * 100
			: 0
	);

	async function toggleStatus(entity: string, id: number): Promise<void> {
		const response = await fetch(`/api/Executive/Status/${entity}/${id}`, { method: 'PATCH' });
		if (response.ok) {
			goto('/Executive', { invalidateAll: true });
		} else {
			alert(await response.text());
		}
	}

	async function createSeason(): Promise<void> {
		const response = await fetch('/api/Executive/Season', { method: 'POST' });
		if (response.ok) {
			goto('/Executive', { invalidateAll: true });
		} else {
			alert(await response.text());
		}
	}

	onMount(() => {
		if (data.redirect) {
			goto(data.redirect);
		}
	});
</script>

<svelte:head>
	<title>{shortName} » League Administration</title>
</svelte:head>

{#if dashboard}
	<div class="row">
		<div class="section executive-section">
			<h1>{new Date().getFullYear()} Season</h1>

			<h2>Regular Season</h2>
			{#if season}
				<div class="season-progress">
					<div>Progress ({season.gamesScheduled} games):&nbsp;</div>
					<div class="season-progress-bar">
						{#if season.gamesScheduled > 0}
							{#if progressPct < 100}
								<div style="flex: 0 0 {progressPct.toFixed(1)}%; background-color: var(--surface-heading-primary);" title="Games played">
									{season.gamesPlayed} GP
								</div>
								<div style="flex: 1 0 0; color: var(--text-inverted); background-color: var(--surface-heading-secondary);" title="Games remaining">
									{season.gamesScheduled - season.gamesPlayed} GR
								</div>
							{:else}
								<div style="flex: 0 0 100%; background-color: var(--surface-heading-primary);" title="Games played">
									{season.gamesPlayed}/{season.gamesPlayed} GP
								</div>
							{/if}
						{:else}
							<div style="flex: 1 0 0; color: var(--text-inverted); background-color: var(--surface-heading-secondary);" title="No games">
								No games scheduled
							</div>
						{/if}
					</div>
				</div>
				<br />
				<ul>
					<li><a href="/Schedule">Edit schedule</a></li>
				</ul>

				<br />
				<h2>Tournaments</h2>
				<ul>
					<li><a href="/Executive/Create/Tournament/{season.season.id}">Add mid-season tournament</a></li>
				</ul>
				{#if season.tournaments && season.tournaments.length > 0}
					{#each season.tournaments as tournament}
						<ul>
							<li>Season Tournament {tournament.id}:
								<ul>
									{#each tournament.brackets as bracket}
										<li><a href="/Executive/Edit/TournamentBracket/{bracket.id}">Update Bracket <i>{bracket.name}</i></a></li>
									{/each}
									{#each tournament.roundRobins as rr}
										<li><a href="/Executive/Edit/TournamentRoundRobin/{rr.id}">Update Round Robin <i>{rr.name}</i></a></li>
									{/each}
								</ul>
							</li>
							<li><a href="/Executive/Create/TournamentBracket/{tournament.id}">Add Bracket</a></li>
							<li><a href="/Executive/Create/TournamentRoundRobin/{tournament.id}">Add Round Robin</a></li>
						</ul>
					{/each}
				{/if}

				{#if !playoffs}
					<ul>
						<li><a href="/Executive/Create/Playoffs/{season.season.id}">Set up year-end playoffs</a></li>
					</ul>
				{/if}
			{:else}
				<p>No regular season has been created for {new Date().getFullYear()} yet. Create one to start scheduling games.</p>
				<button class="executive-action" onclick={createSeason}>Create {new Date().getFullYear()} Regular Season</button>
			{/if}

			{#if playoffs}
				<br />
				<h2>Playoffs</h2>
				{#each playoffs.tournaments as tournament}
					<ul>
						<li>Playoffs Tournament {tournament.id}:
							<ul>
								{#each tournament.brackets as bracket}
									<li><a href="/Executive/Edit/TournamentBracket/{bracket.id}">Update Bracket <i>{bracket.name}</i></a></li>
								{/each}
								{#each tournament.roundRobins as rr}
									<li><a href="/Executive/Edit/TournamentRoundRobin/{rr.id}">Update Round Robin <i>{rr.name}</i></a></li>
								{/each}
							</ul>
						</li>
						<li><a href="/Executive/Create/TournamentBracket/{tournament.id}">Add Bracket</a></li>
						<li><a href="/Executive/Create/TournamentRoundRobin/{tournament.id}">Add Round Robin</a></li>
					</ul>
				{/each}
			{/if}
		</div>
	</div>

	<div class="row">
		<div class="section executive-section executive-league">
			<h1>League Settings</h1>

			<h2>Teams ({dashboard.teams.filter((t) => t.active).length} active)</h2>
			<p class="executive-explanation">Active teams appear in the site header and can be selected in drop-down lists. Deactivate teams that are not playing in the current season.</p>
			<table class="executive-table">
				<thead>
					<tr>
						<th>Active</th>
						<th>Team</th>
					</tr>
				</thead>
				<tbody>
					{#each [...dashboard.teams].sort((a, b) => {
						if (a.active !== b.active) return a.active ? -1 : 1;
						return a.fullName.localeCompare(b.fullName);
					}) as team (team.id)}
						<tr>
							<td class="executive-toggle">
								<input
									type="checkbox"
									checked={team.active}
									onchange={() => toggleStatus('team', team.id)}
									title="{team.active ? 'Deactivate' : 'Activate'} {team.fullName}"
								/>
							</td>
							<td><a href="/Team/{team.abbreviation}">{team.fullName}</a></td>
						</tr>
					{/each}
				</tbody>
			</table>

			<br />
			<h2>Locations ({dashboard.locations.filter((l) => l.active).length} active)</h2>
			<p class="executive-explanation">Active locations appear on the Locations page and can be selected in drop-down lists. Deactivate locations that are not being used in the current season.</p>
			<table class="executive-table">
				<thead>
					<tr>
						<th>Active</th>
						<th>Location</th>
						<th>Park</th>
					</tr>
				</thead>
				<tbody>
					{#each dashboard.locations as location (location.id)}
						<tr>
							<td class="executive-toggle">
								<input
									type="checkbox"
									checked={location.active}
									onchange={() => toggleStatus('park', location.id)}
									title="{location.active ? 'Deactivate' : 'Activate'} {location.name}"
								/>
							</td>
							<td>{location.name}</td>
							<td>{location.formalName ?? ''}</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<br />
			<h2>Miscellaneous</h2>
			<ul>
				<li><a href="/Executive/Raccoon">Recover deleted games</a></li>
			</ul>
		</div>
	</div>
{/if}
