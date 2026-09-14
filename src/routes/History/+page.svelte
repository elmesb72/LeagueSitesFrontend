<script lang="ts">
	import './+page.css';

	let { data } = $props();
	const years = $derived(data.years);
	const shortName = $derived(data.siteConfig?.shortName ?? '');
</script>

<svelte:head>
	<title>{shortName} » League History</title>
</svelte:head>

<div class="row">
	<div class="section history-section">
		<h1>League History</h1>
		{#if years.length === 0}
			<p>No history data available.</p>
		{:else}
			<table class="history">
				<thead>
					<tr>
						<th>Year</th>
						<th>Champion</th>
						<th>Best Record</th>
					</tr>
				</thead>
				<tbody>
					{#each years as year}
						<tr>
							<td><a href="/Standings?year={year.calendarYear}">{year.calendarYear}</a></td>
							<td>
								{#if year.exceptionYearDescription}
									<span>{year.exceptionYearDescription}</span>
								{:else if year.champion && (year.playoffsComplete || (year.tournaments ?? []).some((t) => t.decided))}
									<a href="/Playoffs?year={year.calendarYear}">{year.champion}</a>
								{:else}
									<span>-</span>
								{/if}
								{#if (year.tournaments ?? []).length > 0}
									<span class="history-tournaments">
										{#each year.tournaments ?? [] as tournament (tournament.id)}
											<a
												class="history-tournament-link"
												href="/Tournaments/{tournament.id}"
												title={tournament.name}
											>
												{tournament.shortName}
											</a>
										{/each}
									</span>
								{/if}
							</td>
							<td>
								{#if year.regularSeasonComplete && year.bestRecord}
									<a href="/Team/{year.bestRecordAbbreviation}?year={year.calendarYear}">
										{year.bestRecord}
										{year.bestRecordResults}
									</a>
								{:else if year.exceptionYearDescription}
									<span>&nbsp;</span>
								{:else}
									<span>-</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
