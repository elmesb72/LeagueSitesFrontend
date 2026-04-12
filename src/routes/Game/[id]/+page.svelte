<script lang="ts">
	import './+page.css';
	import { formatTime } from '$lib/utils/date';

	let { data } = $props();
	const gameData = $derived(data.gameData);
	const game = $derived(gameData?.game);
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	function formatFullDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	const title = $derived(
		game
			? `${shortName} » ${game.visitingTeam.abbreviation}@${game.hostTeam.abbreviation} (${new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`
			: `${shortName} » Game`
	);
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

{#if game}
	<div class="row game-row">
		<div class="inner-row">
			<div class="section game-team">
				<div>
					<img src="/images/teams/{game.visitingTeam.id}-md.webp" alt="{game.visitingTeam.name}"
						onerror={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
				</div>
				<div><a href="/Team/{game.visitingTeam.abbreviation}">{game.visitingTeam.name}</a></div>
			</div>
			<div class="section game-header">
				{#if game.status.name === 'Played'}
					<div class="game-matchup">
						{game.visitingTeam.name} {game.scoreVisitor}, {game.hostTeam.name} {game.scoreHost}
					</div>
				{:else if game.status.name.startsWith('Forfeit')}
					{@const forfeitingTeam = game.status.name === 'Forfeit (Home)' ? game.hostTeam : game.visitingTeam}
					<div class="game-matchup">
						{game.visitingTeam.name} {game.visitingTeam.id === forfeitingTeam.id ? '0' : '7'},
						{game.hostTeam.name} {game.hostTeam.id === forfeitingTeam.id ? '0' : '7'}
					</div>
				{:else}
					<div class="game-matchup">
						{game.visitingTeam.name} @ {game.hostTeam.name}
					</div>
				{/if}
				<div class="game-time">{formatTime(game.date)} • {formatFullDate(game.date)}</div>
				<div class="game-location">
					<a href="/Locations/#{game.location.name}">{game.location.name}</a>
				</div>
			</div>
			<div class="section game-team">
				<div>
					<img src="/images/teams/{game.hostTeam.id}-md.webp" alt="{game.hostTeam.name}"
						onerror={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
				</div>
				<div><a href="/Team/{game.hostTeam.abbreviation}">{game.hostTeam.name}</a></div>
			</div>
		</div>
	</div>

	{#if game.status.name === 'Upcoming'}
		<div class="row">
			<div class="section game-upcoming">
				This game has not yet been played or scored.
			</div>
		</div>
	{:else if game.status.name.startsWith('Forfeit')}
		{@const forfeitingTeam = game.status.name === 'Forfeit (Home)' ? game.hostTeam : game.visitingTeam}
		<div class="row">
			<div class="section game-forfeit">
				This game was considered forfeit by the {forfeitingTeam.name}, resulting in a 7-0 score.
			</div>
		</div>
	{:else if game.status.name === 'Postponed'}
		<div class="row">
			<div class="section game-upcoming">
				This game has been postponed. Keep an eye on your team page for the rescheduled game.
			</div>
		</div>
	{:else if game.status.name === 'Cancelled'}
		<div class="row">
			<div class="section game-upcoming">
				This game has been cancelled and will not be played.
			</div>
		</div>
	{:else if game.status.name === 'Deleted'}
		<div class="row">
			<div class="section game-upcoming">
				This game has been deleted.
			</div>
		</div>
	{/if}

	{#if gameData?.canEdit}
		<div class="row">
			<div class="section game-edit-link">
				<a href="/Game/{game.id}/Edit"><i class="fas fa-edit"></i> Edit this game</a>
			</div>
		</div>
	{/if}
{:else}
	<div class="row">
		<div class="section">
			<h1>Game Not Found</h1>
			<p>The game you're looking for doesn't exist or couldn't be loaded.</p>
		</div>
	</div>
{/if}
