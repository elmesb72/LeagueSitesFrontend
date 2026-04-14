<script lang="ts">
	import './+page.css';
	import type { Game } from '$lib/models/Game';
	import type { Location } from '$lib/models/Location';
	import { toDateKey, formatDateLabel, getDayOfWeek, addDays } from '$lib/utils/date';

	let { data } = $props();
	const games = $derived(data.games);
	const locations = $derived(data.locations);
	const canCreateGame = $derived(data.canCreateGame);

	function getDateRange(games: Game[]): string[] {
		if (games.length === 0) {
			if (data.seasonStartDate) {
				const start = data.seasonStartDate;
				return Array.from({ length: 7 }, (_, i) => addDays(start, i));
			}
			return [];
		}
		const dates: string[] = [];
		const first = toDateKey(games[0].date);
		const last = toDateKey(games[games.length - 1].date);
		for (let d = first; d <= last; d = addDays(d, 1)) {
			dates.push(d);
		}
		return dates;
	}

	function isWeekend(dateStr: string): boolean {
		const day = getDayOfWeek(dateStr);
		return day === 0 || day === 6;
	}

	function findGame(games: Game[], dateStr: string, location: Location): Game | undefined {
		return games.find((g) => toDateKey(g.date) === dateStr && g.location.id === location.id);
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
