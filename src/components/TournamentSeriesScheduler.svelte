<script lang="ts">
	import { goto } from '$app/navigation';
	import type {
		BracketStructure,
		SeriesStructure,
		TournamentLocation
	} from '$lib/models/Tournament';
	import { hostOrderSummary } from '$lib/utils/bracketBuilder';

	let {
		bracket,
		locations
	}: {
		bracket: BracketStructure;
		locations: TournamentLocation[];
	} = $props();

	// One open form at a time, keyed by series and game number.
	let openSlot = $state<string | null>(null);
	let slotDate = $state('');
	let slotTime = $state('20:30');
	let slotLocationId = $state<number>(firstLocationId());
	let busy = $state(false);
	let error = $state('');

	function firstLocationId(): number {
		return locations[0]?.id ?? 0;
	}

	function slotKey(seriesId: number, gameNumber: number): string {
		return `${seriesId}:${gameNumber}`;
	}

	function openForm(seriesId: number, gameNumber: number): void {
		openSlot = slotKey(seriesId, gameNumber);
		error = '';
		slotDate = '';
		slotTime = '20:30';
		slotLocationId = locations[0]?.id ?? 0;
	}

	function matchupText(series: SeriesStructure): string {
		const first = series.spot1.team?.fullName ?? series.spot1.label;
		const second = series.spot2.team?.fullName ?? series.spot2.label;
		return `${first} vs ${second}`;
	}

	function waitingText(series: SeriesStructure): string {
		const pending = [series.spot1, series.spot2]
			.filter((spot) => spot.team === null)
			.map((spot) => spot.label.toLowerCase());
		return `Waiting on ${pending.join(' and ')}.`;
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

	async function schedule(seriesId: number, gameNumber: number): Promise<void> {
		error = '';
		if (!slotDate) {
			error = 'Pick a date for the game.';
			return;
		}
		if (!slotLocationId) {
			error = 'Pick a park for the game.';
			return;
		}

		busy = true;
		const response = await fetch(`/api/Series/${seriesId}/Game`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				gameNumber,
				date: `${slotDate}T${slotTime}:00`,
				locationID: slotLocationId
			})
		});
		busy = false;

		if (response.ok) {
			openSlot = null;
			goto(window.location.pathname, { invalidateAll: true });
		} else {
			error = (await response.text()) || 'Could not schedule the game.';
		}
	}

	async function removeGame(seriesGameId: number, description: string): Promise<void> {
		if (!confirm(`Remove ${description}? It will move to the deleted games bin.`)) return;

		busy = true;
		const response = await fetch(`/api/Series/Game/${seriesGameId}`, { method: 'DELETE' });
		busy = false;

		if (response.ok) {
			goto(window.location.pathname, { invalidateAll: true });
		} else {
			error = await response.text();
		}
	}
</script>

{#if error}
	<p class="scheduler-error">{error}</p>
{/if}

{#each bracket.rounds as round (round.id)}
	<h3 class="scheduler-round">{round.name}</h3>

	{#each round.series as series (series.id)}
		<div class="scheduler-series">
			<div class="scheduler-series-header">
				<span class="scheduler-series-number">Series {series.number}</span>
				<span class="scheduler-series-matchup">{matchupText(series)}</span>
				{#if series.resultText}
					<span class="scheduler-series-result">{series.resultText}</span>
				{/if}
			</div>
			<p class="scheduler-series-detail">
				{series.length === 1 ? 'Single game' : `Best of ${series.length}`} &middot;
				{hostOrderSummary(series.hostOrder)}
			</p>

			{#if !series.canSchedule}
				<p class="scheduler-waiting">{waitingText(series)}</p>
			{/if}

			<table class="scheduler-table">
				<thead>
					<tr>
						<th>Game</th>
						<th>Matchup</th>
						<th>When and where</th>
						<th class="scheduler-actions-col"></th>
					</tr>
				</thead>
				<tbody>
					{#each series.gameSlots as slot (slot.gameNumber)}
						<tr>
							<td class="scheduler-game-number">{slot.gameNumber}</td>
							<td>
								{#if slot.hostTeam && slot.visitingTeam}
									{slot.visitingTeam.abbreviation} at {slot.hostTeam.abbreviation}
								{:else}
									<span class="scheduler-muted">Not known yet</span>
								{/if}
							</td>
							<td>
								{#if slot.game}
									<a href="/Game/{slot.game.id}">
										{formatGameDate(slot.game.date)} at {slot.game.location.name}
									</a>
									<span class="scheduler-status">{slot.game.status.name}</span>
								{:else if openSlot === slotKey(series.id, slot.gameNumber)}
									<div class="scheduler-form">
										<input
											type="date"
											bind:value={slotDate}
											aria-label="Date for game {slot.gameNumber}"
										/>
										<input
											type="time"
											bind:value={slotTime}
											aria-label="Start time for game {slot.gameNumber}"
										/>
										<select
											bind:value={slotLocationId}
											aria-label="Park for game {slot.gameNumber}"
										>
											{#each locations as location (location.id)}
												<option value={location.id}>{location.name}</option>
											{/each}
										</select>
										<button
											type="button"
											class="scheduler-save"
											disabled={busy}
											onclick={() => schedule(series.id, slot.gameNumber)}
										>
											Schedule
										</button>
										<button type="button" class="scheduler-link" onclick={() => (openSlot = null)}>
											Cancel
										</button>
									</div>
								{:else}
									<span class="scheduler-muted">Not scheduled</span>
								{/if}
							</td>
							<td class="scheduler-actions-col">
								{#if slot.game && slot.seriesGameID}
									<button
										type="button"
										class="executive-delete"
										title="Remove game {slot.gameNumber} from this series"
										aria-label="Remove game {slot.gameNumber} from series {series.number}"
										disabled={busy}
										onclick={() =>
											removeGame(
												slot.seriesGameID!,
												`game ${slot.gameNumber} of series ${series.number}`
											)}
									>
										<i class="fa-regular fa-trash-can"></i>
									</button>
								{:else if series.canSchedule && openSlot !== slotKey(series.id, slot.gameNumber)}
									<button
										type="button"
										class="scheduler-link"
										onclick={() => openForm(series.id, slot.gameNumber)}
									>
										Schedule
									</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>

			{#if series.unexpectedLinks.length > 0}
				<div class="scheduler-unexpected">
					<p><strong>These games do not fit this series:</strong></p>
					<ul>
						{#each series.unexpectedLinks as link (link.seriesGameID)}
							<li>
								{#if link.game}
									<a href="/Game/{link.game.id}">
										{formatGameDate(link.game.date)}:
										{link.game.visitingTeam.abbreviation} at {link.game.hostTeam.abbreviation}
									</a>
								{:else}
									An empty link
								{/if}
								&mdash; {link.reason}
								<button
									type="button"
									class="scheduler-link"
									disabled={busy}
									onclick={() => removeGame(link.seriesGameID, 'this extra game')}
								>
									Remove
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	{/each}
{/each}

<style>
	.scheduler-round {
		margin-top: var(--space-4);
		font-size: var(--text-base);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-soft-contrast);
	}

	.scheduler-series {
		border: var(--game-border);
		border-radius: var(--radius-md);
		padding: var(--space-3);
		margin-top: var(--space-2);
	}

	.scheduler-series-header {
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.scheduler-series-number {
		font-size: var(--text-sm);
		color: var(--text-soft-contrast);
	}

	.scheduler-series-matchup {
		font-weight: 700;
	}

	.scheduler-series-result {
		font-size: var(--text-sm);
		color: var(--surface-heading-primary);
	}

	.scheduler-series-detail {
		font-size: var(--text-sm);
		color: var(--text-soft-contrast);
		margin-top: 2px;
	}

	.scheduler-waiting {
		margin-top: var(--space-2);
		font-size: var(--text-sm);
		font-style: italic;
		color: var(--text-soft-contrast);
	}

	.scheduler-table {
		width: 100%;
		margin-top: var(--space-3);
		border: var(--standings-border);
	}

	.scheduler-table th {
		background-color: var(--table-header-bg);
		color: var(--table-header-text);
		text-align: left;
		padding: 4px var(--space-2);
		font-size: var(--text-sm);
	}

	.scheduler-table td {
		padding: 4px var(--space-2);
		vertical-align: middle;
	}

	.scheduler-game-number {
		width: 50px;
	}

	.scheduler-muted {
		color: var(--text-soft-contrast);
		font-style: italic;
		font-size: var(--text-sm);
	}

	.scheduler-status {
		font-size: var(--text-sm);
		color: var(--text-soft-contrast);
		margin-left: var(--space-2);
	}

	.scheduler-form {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		align-items: center;
	}

	.scheduler-form input,
	.scheduler-form select {
		height: 30px;
		padding: 0 var(--space-2);
		border: var(--game-border);
		border-radius: var(--radius-sm);
		font-family: inherit;
		font-size: var(--text-sm);
	}

	.scheduler-save {
		height: 30px;
		padding: 0 var(--space-3);
		background-image: linear-gradient(to bottom, #1da7ee, #178ee9);
		border: 1px solid #0073bb;
		border-radius: var(--radius-sm);
		color: white;
		font-weight: 700;
		cursor: pointer;
		font-family: inherit;
	}

	.scheduler-save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.scheduler-actions-col {
		width: 90px;
		text-align: right;
	}

	.scheduler-link {
		background: none;
		border: none;
		padding: 0;
		color: var(--link-default);
		cursor: pointer;
		font-family: inherit;
		font-size: var(--text-sm);
		text-decoration: underline;
	}

	.scheduler-link:hover {
		color: var(--link-hover);
	}

	.scheduler-link:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.scheduler-unexpected {
		margin-top: var(--space-3);
		padding: var(--space-2) var(--space-3);
		border-left: 3px solid var(--color-loss);
		background-color: var(--standings-hover-bg);
		font-size: var(--text-sm);
	}

	.scheduler-unexpected ul {
		padding-left: var(--space-4);
		margin-top: var(--space-2);
	}

	.scheduler-error {
		color: var(--color-loss);
		margin-top: var(--space-3);
	}
</style>
