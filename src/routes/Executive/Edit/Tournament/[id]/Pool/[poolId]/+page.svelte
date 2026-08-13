<script lang="ts">
	import '../../../../../+page.css';
	import { goto, invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import TournamentPoolForm from '../../../../../../../components/TournamentPoolForm.svelte';

	let { data } = $props();
	const tournament = $derived(data.tournament);
	const pool = $derived(data.pool);
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	let showSettings = $state(false);
	let adding = $state(false);
	let busy = $state(false);
	let error = $state('');

	let newDate = $state('');
	let newTime = $state('20:30');
	let newHostId = $state(0);
	let newVisitorId = $state(0);
	let newLocationId = $state(0);

	/** Teams already in the pool are the likely choices; everything else is a fallback. */
	const poolTeams = $derived(
		pool
			? pool.standings && pool.standings.length > 0
				? pool.standings.map((s) => s.team)
				: pool.resolvedSeeds.map((s) => s.team)
			: []
	);

	const teamChoices = $derived(
		poolTeams.length >= 2 ? poolTeams : (tournament?.referenceData.teams ?? [])
	);

	function startAdding(): void {
		adding = true;
		error = '';
		newDate = '';
		newTime = '20:30';
		newHostId = teamChoices[0]?.id ?? 0;
		newVisitorId = teamChoices[1]?.id ?? 0;
		newLocationId = tournament?.referenceData.locations[0]?.id ?? 0;
	}

	function formatGameDate(value: string): string {
		const day = new Date(value.split('T')[0] + 'T12:00:00').toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
		const time = new Date(value).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit'
		});
		return `${day}, ${time}`;
	}

	async function addGame(): Promise<void> {
		error = '';
		if (!newDate) {
			error = 'Pick a date for the game.';
			return;
		}
		if (newHostId === newVisitorId) {
			error = 'A game needs two different teams.';
			return;
		}

		busy = true;
		const response = await fetch(`/api/TournamentRoundRobin/${pool!.id}/Game`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				date: `${newDate}T${newTime}:00`,
				hostTeamID: newHostId,
				visitingTeamID: newVisitorId,
				locationID: newLocationId
			})
		});
		busy = false;

		if (response.ok) {
			adding = false;
			await invalidateAll();
		} else {
			error = (await response.text()) || 'Could not add the game.';
		}
	}

	async function removeGame(roundRobinGameId: number): Promise<void> {
		if (!confirm('Remove this game? It will move to the deleted games bin.')) return;

		busy = true;
		const response = await fetch(`/api/TournamentRoundRobin/Game/${roundRobinGameId}`, {
			method: 'DELETE'
		});
		busy = false;

		if (response.ok) {
			await invalidateAll();
		} else {
			error = await response.text();
		}
	}

	onMount(() => {
		if (data.redirect) {
			goto(data.redirect);
		}
	});
</script>

<svelte:head>
	<title>{shortName} » {pool?.name ?? 'Pool'}</title>
</svelte:head>

{#if tournament && pool}
	<div class="row">
		<div class="section executive-section">
			<h1>{pool.name}</h1>
			<p class="executive-explanation">
				<a href="/Executive/Edit/Tournament/{tournament.id}">{tournament.season.name}</a>
			</p>

			{#if pool.standings && pool.standings.length > 0}
				<h2>Standings</h2>
				<table class="executive-table">
					<thead>
						<tr>
							<th>Team</th>
							<th>Record</th>
							<th>Points</th>
							<th>Run diff.</th>
						</tr>
					</thead>
					<tbody>
						{#each pool.standings as entry (entry.team.id)}
							<tr>
								<td><a href="/Team/{entry.team.abbreviation}">{entry.team.fullName}</a></td>
								<td>{entry.record}</td>
								<td>{entry.points}</td>
								<td>{entry.runDifferential}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else if pool.resolvedSeeds.length > 0}
				<h2>Teams</h2>
				<ul>
					{#each pool.resolvedSeeds as seed (seed.seed)}
						<li><a href="/Team/{seed.team.abbreviation}">{seed.team.fullName}</a></li>
					{/each}
				</ul>
			{:else}
				<p class="executive-explanation">
					The teams for this pool are not settled yet. They fill in as the games that feed it are
					played.
				</p>
			{/if}

			<h2>Games</h2>
			{#if error}
				<p class="pool-page-error">{error}</p>
			{/if}

			{#if pool.games.length > 0}
				<table class="executive-table">
					<thead>
						<tr>
							<th>When and where</th>
							<th>Matchup</th>
							<th>Score</th>
							<th class="executive-actions-col"></th>
						</tr>
					</thead>
					<tbody>
						{#each pool.games as slot (slot.roundRobinGameID)}
							<tr>
								<td>
									{#if slot.game}
										<a href="/Game/{slot.game.id}">
											{formatGameDate(slot.game.date)} at {slot.game.location.name}
										</a>
									{:else}
										<span class="pool-page-muted">Empty link</span>
									{/if}
								</td>
								<td>
									{#if slot.game}
										{slot.game.visitingTeam.abbreviation} at {slot.game.hostTeam.abbreviation}
									{/if}
								</td>
								<td>
									{#if slot.game && slot.game.scoreHost !== null && slot.game.scoreVisitor !== null}
										{slot.game.scoreVisitor}&ndash;{slot.game.scoreHost}
									{:else if slot.game}
										<span class="pool-page-muted">{slot.game.status.name}</span>
									{/if}
								</td>
								<td class="executive-actions-col">
									<button
										type="button"
										class="executive-delete"
										title="Remove this game from the pool"
										aria-label="Remove game from pool"
										disabled={busy}
										onclick={() => removeGame(slot.roundRobinGameID)}
									>
										<i class="fa-regular fa-trash-can"></i>
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<p>No games in this pool yet.</p>
			{/if}

			{#if adding}
				<div class="pool-page-form">
					<input type="date" bind:value={newDate} aria-label="Game date" />
					<input type="time" bind:value={newTime} aria-label="Start time" />
					<select bind:value={newVisitorId} aria-label="Visiting team">
						{#each teamChoices as team (team.id)}
							<option value={team.id}>{team.fullName}</option>
						{/each}
					</select>
					<span>at</span>
					<select bind:value={newHostId} aria-label="Host team">
						{#each teamChoices as team (team.id)}
							<option value={team.id}>{team.fullName}</option>
						{/each}
					</select>
					<select bind:value={newLocationId} aria-label="Park">
						{#each tournament.referenceData.locations as location (location.id)}
							<option value={location.id}>{location.name}</option>
						{/each}
					</select>
					<button type="button" class="executive-action" disabled={busy} onclick={addGame}>
						Add game
					</button>
					<button type="button" class="pool-page-link" onclick={() => (adding = false)}>
						Cancel
					</button>
				</div>
			{:else}
				<button type="button" class="executive-action" onclick={startAdding}>Add a game</button>
			{/if}

			<h2>Pool settings</h2>
			{#if showSettings}
				<TournamentPoolForm
					tournamentId={tournament.id}
					referenceData={tournament.referenceData}
					existing={pool}
				/>
			{:else}
				<button type="button" class="executive-action" onclick={() => (showSettings = true)}>
					Edit pool settings
				</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.pool-page-form {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		align-items: center;
		margin-top: var(--space-3);
	}

	.pool-page-form input,
	.pool-page-form select {
		height: 32px;
		padding: 0 var(--space-2);
		border: var(--game-border);
		border-radius: var(--radius-sm);
		font-family: inherit;
		font-size: var(--text-sm);
	}

	.pool-page-form .executive-action {
		margin-top: 0;
		height: 32px;
	}

	.pool-page-link {
		background: none;
		border: none;
		padding: 0;
		color: var(--link-default);
		cursor: pointer;
		font-family: inherit;
		font-size: var(--text-sm);
		text-decoration: underline;
	}

	.pool-page-muted {
		color: var(--text-soft-contrast);
		font-style: italic;
		font-size: var(--text-sm);
	}

	.pool-page-error {
		color: var(--color-loss);
		margin-top: var(--space-3);
	}
</style>
