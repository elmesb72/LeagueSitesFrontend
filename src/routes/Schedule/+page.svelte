<script lang="ts">
	import './+page.css';
	import type { Game } from '$lib/models/Game';
	import type { Location } from '$lib/models/Location';

	let { data } = $props();
	const games = $derived(data.games);
	const locations = $derived(data.locations);
	const canCreateGame = $derived(data.canCreateGame);

	function getDateRange(games: Game[]): string[] {
		if (games.length === 0) {
			if (data.seasonStartDate) {
				// Show a full week from the season start date
				const start = new Date(data.seasonStartDate + 'T12:00:00');
				const dates: string[] = [];
				for (let i = 0; i < 7; i++) {
					const d = new Date(start);
					d.setDate(start.getDate() + i);
					dates.push(d.toISOString().split('T')[0]);
				}
				return dates;
			}
			return [];
		}
		const dates: string[] = [];
		const first = new Date(games[0].date);
		const last = new Date(games[games.length - 1].date);
		first.setHours(12, 0, 0, 0);
		last.setHours(12, 0, 0, 0);
		for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
			dates.push(d.toISOString().split('T')[0]);
		}
		return dates;
	}

	function formatDateLabel(dateStr: string): string {
		const d = new Date(dateStr + 'T12:00:00');
		return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
	}

	function isWeekend(dateStr: string): boolean {
		const day = new Date(dateStr + 'T12:00:00').getDay();
		return day === 0 || day === 6;
	}

	function findGame(games: Game[], dateStr: string, location: Location): Game | undefined {
		return games.find((g) => {
			const gameDate = new Date(g.date).toISOString().split('T')[0];
			return gameDate === dateStr && g.location.id === location.id;
		});
	}

	const dateRange = $derived(getDateRange(games));
	const shortName = $derived(data.siteConfig?.shortName ?? '');
</script>

<svelte:head>
	<title>{shortName} » Schedule ({data.year})</title>
</svelte:head>

<div class="row">
	<div class="section schedule-section">
		<h1>
			{data.year} Schedule
			{#if canCreateGame}
				<a title="Create Game" href="/Game/Create"><i class="fa-regular fa-square-plus header-icon"></i></a>
			{/if}
		</h1>
		{#if games.length === 0 && !(canCreateGame && dateRange.length > 0)}
			<div class="subsection">
				<p>No games have been added yet for this year. Stay tuned!</p>
			</div>
		{/if}
		{#if dateRange.length > 0 && (games.length > 0 || canCreateGame)}
			<table class="league-schedule">
				<thead>
					<tr>
						<th></th>
						{#each locations as location}
							<th colspan="2">{location.name}</th>
						{/each}
					</tr>
					<tr>
						<th>Date</th>
						{#each locations as _}
							<th>Home</th>
							<th>Away</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each dateRange as dateStr}
						<tr class:weekend={isWeekend(dateStr)}>
							<td>{formatDateLabel(dateStr)}</td>
							{#each locations as location}
								{@const game = findGame(games, dateStr, location)}
								{#if game}
									<td class="league-schedule-game league-schedule-game-home">
										<a href="/Game/{game.id}">{game.hostTeam.name}</a>
									</td>
									<td class="league-schedule-game league-schedule-game-away">
										<a href="/Game/{game.id}">{game.visitingTeam.name}</a>
									</td>
								{:else}
									{#if canCreateGame}
										<td colspan="2" class="league-schedule-empty league-schedule-create">
											<a title="Create Game on {dateStr} at {location.name}" href="/Game/Create?date={dateStr}&location={location.id}">
												<i class="fa-regular fa-square-plus header-icon"></i>
											</a>
										</td>
									{:else}
										<td colspan="2" class="league-schedule-empty"></td>
									{/if}
								{/if}
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
