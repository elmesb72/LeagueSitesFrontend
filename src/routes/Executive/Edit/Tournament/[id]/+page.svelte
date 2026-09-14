<script lang="ts">
	import '../../../+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import TournamentFlow from '../../../../../components/TournamentFlow.svelte';

	let { data } = $props();
	const tournament = $derived(data.tournament);
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	function bracketState(bracket: NonNullable<typeof tournament>['brackets'][number]): string {
		const slots = bracket.rounds.flatMap((r) => r.series).flatMap((s) => s.gameSlots);
		const scheduled = slots.filter((s) => s.game !== null).length;
		const played = slots.filter(
			(s) =>
				s.game !== null &&
				(s.game.status.name === 'Played' || s.game.status.name.startsWith('Forfeit'))
		).length;

		if (bracket.winner) return `Won by ${bracket.winner.fullName}`;
		if (scheduled === 0) return 'No games scheduled yet';
		return `${played} of ${scheduled} scheduled game${scheduled === 1 ? '' : 's'} played`;
	}

	function readyToScheduleCount(
		bracket: NonNullable<typeof tournament>['brackets'][number]
	): number {
		return bracket.rounds
			.flatMap((r) => r.series)
			.filter((s) => s.canSchedule)
			.flatMap((s) => s.gameSlots)
			.filter((slot) => slot.game === null).length;
	}

	/** A mid-season tournament is its own season of kind Tournament; the playoffs are not deletable here. */
	const isCup = $derived(tournament?.season.subseason === 'Tournament');

	/** The public page for this tournament: the playoffs by year, a cup by id. */
	const publicHref = $derived(
		tournament
			? isCup
				? `/Tournaments/${tournament.id}`
				: `/Playoffs?year=${tournament.season.year}`
			: '/Playoffs'
	);

	/** Games that are scheduled or played (anything not in the recycle bin) across brackets and pools. */
	const liveGameCount = $derived(
		tournament
			? tournament.brackets
					.flatMap((b) => b.rounds)
					.flatMap((r) => r.series)
					.flatMap((s) => s.gameSlots)
					.map((slot) => slot.game)
					.concat(tournament.roundRobins.flatMap((p) => p.games).map((g) => g.game))
					.filter((g) => g !== null && g.status.name !== 'Deleted').length
			: 0
	);

	let deleting = $state(false);
	let deleteError = $state('');

	async function deleteTournament(): Promise<void> {
		if (!tournament) return;
		const name = tournament.season.name;
		if (
			!confirm(
				`Delete ${name}? This removes the tournament, its brackets and pools, and any of its games in the recycle bin. This cannot be undone.`
			)
		)
			return;

		deleting = true;
		deleteError = '';
		const response = await fetch(`/api/Executive/Season/Tournament/${tournament.season.id}`, {
			method: 'DELETE'
		});
		deleting = false;
		if (response.ok) {
			goto('/Executive', { invalidateAll: true });
		} else {
			deleteError = (await response.text()) || 'Could not delete the tournament.';
		}
	}

	onMount(() => {
		if (data.redirect) {
			goto(data.redirect);
		}
	});
</script>

<svelte:head>
	<title>{shortName} » Manage {tournament?.season.name ?? 'Tournament'}</title>
</svelte:head>

{#if tournament}
	<div class="row">
		<div class="section executive-section">
			<h1>{tournament.season.name}</h1>
			<p class="executive-explanation">
				Brackets and pools decide who plays whom. Once a matchup is known you can schedule its games
				here, and scores go in on the game pages as usual.
			</p>

			<TournamentFlow detail={tournament} />

			<h2>Brackets</h2>
			{#if tournament.brackets.length === 0}
				<p>No brackets yet. Add one to set up the playoff rounds.</p>
			{:else}
				<table class="executive-table">
					<thead>
						<tr>
							<th>Bracket</th>
							<th>Rounds</th>
							<th>State</th>
							<th>To schedule</th>
						</tr>
					</thead>
					<tbody>
						{#each tournament.brackets as bracket (bracket.id)}
							<tr>
								<td>
									<a href="/Executive/Edit/Tournament/{tournament.id}/Bracket/{bracket.id}">
										{bracket.name}
									</a>
									{#if bracket.historical}
										<span class="tournament-tag" title="Winner appears on the History page">
											champion
										</span>
									{/if}
								</td>
								<td>{bracket.rounds.map((r) => r.name).join(' → ')}</td>
								<td>{bracketState(bracket)}</td>
								<td>
									{#if readyToScheduleCount(bracket) > 0}
										<a href="/Executive/Edit/Tournament/{tournament.id}/Bracket/{bracket.id}">
											{readyToScheduleCount(bracket)} game{readyToScheduleCount(bracket) === 1
												? ''
												: 's'} ready
										</a>
									{:else}
										<span class="tournament-muted">Nothing waiting</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
			<ul>
				<li><a href="/Executive/Edit/Tournament/{tournament.id}/AddBracket">Add a bracket</a></li>
			</ul>

			<h2>Round robin pools</h2>
			{#if tournament.roundRobins.length === 0}
				<p>
					No pools. Pools are useful for consolation play, where a group of teams all play each
					other instead of a knockout series. Want a final after the pool? Add a bracket and seed it
					from the pool's standings.
				</p>
			{:else}
				<table class="executive-table">
					<thead>
						<tr>
							<th>Pool</th>
							<th>Teams</th>
							<th>Games</th>
						</tr>
					</thead>
					<tbody>
						{#each tournament.roundRobins as pool (pool.id)}
							<tr>
								<td>
									<a href="/Executive/Edit/Tournament/{tournament.id}/Pool/{pool.id}">
										{pool.name}
									</a>
									{#if pool.historical}
										<span class="tournament-tag" title="Winner appears on the History page">
											champion
										</span>
									{/if}
								</td>
								<td>
									{#if pool.standings && pool.standings.length > 0}
										{pool.standings.map((s) => s.team.abbreviation).join(', ')}
									{:else if pool.resolvedSeeds.length > 0}
										{pool.resolvedSeeds.map((s) => s.team.abbreviation).join(', ')}
									{:else}
										<span class="tournament-muted">Not known yet</span>
									{/if}
								</td>
								<td>{pool.games.length}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
			<ul>
				<li><a href="/Executive/Edit/Tournament/{tournament.id}/AddPool">Add a pool</a></li>
			</ul>

			<h2>Elsewhere</h2>
			<ul>
				<li>
					<a href={publicHref}>See what the public page shows</a>
				</li>
				<li><a href="/Executive">Back to league administration</a></li>
			</ul>

			{#if isCup}
				<h2>Remove this tournament</h2>
				{#if liveGameCount > 0}
					<p class="executive-explanation">
						{#if liveGameCount === 1}
							1 game is scheduled in this tournament. Remove it from its series or pool first, then
							the tournament can be deleted.
						{:else}
							{liveGameCount} games are scheduled in this tournament. Remove them from their series and
							pools first, then the tournament can be deleted.
						{/if}
					</p>
				{:else}
					<p class="executive-explanation">
						Deletes the tournament, its brackets and pools, and any of its games in the recycle bin.
						This cannot be undone.
					</p>
				{/if}
				{#if deleteError}
					<p class="tournament-error">{deleteError}</p>
				{/if}
				<button
					type="button"
					class="tournament-delete"
					disabled={liveGameCount > 0 || deleting}
					title={liveGameCount > 0 ? 'Remove the scheduled games first' : 'Delete this tournament'}
					onclick={deleteTournament}
				>
					{deleting ? 'Deleting...' : 'Delete this tournament'}
				</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.tournament-tag {
		display: inline-block;
		margin-left: var(--space-2);
		padding: 1px 6px;
		border-radius: var(--radius-sm);
		background-color: var(--surface-heading-secondary);
		color: var(--text-inverted);
		font-size: var(--text-xs, 11px);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.tournament-delete {
		background: none;
		border: 1px solid var(--color-loss);
		border-radius: var(--radius-sm);
		padding: var(--space-2) var(--space-4);
		color: var(--color-loss);
		font-family: inherit;
		font-size: var(--text-sm);
		cursor: pointer;
	}

	.tournament-delete:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.tournament-error {
		margin-top: var(--space-3);
		color: var(--color-loss);
	}

	.tournament-muted {
		color: var(--text-soft-contrast);
		font-style: italic;
		font-size: var(--text-sm);
	}
</style>
