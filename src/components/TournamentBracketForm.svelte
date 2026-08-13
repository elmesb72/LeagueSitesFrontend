<script lang="ts">
	import { goto } from '$app/navigation';
	import type {
		BracketFormat,
		BracketStructure,
		RoundUpsert,
		SeedGroup,
		SpotRef,
		TournamentReferenceData
	} from '$lib/models/Tournament';
	import type { Team } from '$lib/models/Team';
	import {
		SERIES_LENGTHS,
		SUPPORTED_TEAM_COUNTS,
		defaultHostOrder,
		describeSpot,
		generateRounds,
		hostOrderSummary,
		seriesLengthLabel
	} from '$lib/utils/bracketBuilder';
	import TournamentSeedingEditor from './TournamentSeedingEditor.svelte';

	let {
		tournamentId,
		referenceData,
		existing = null,
		defaultSeeding = null
	}: {
		tournamentId: number;
		referenceData: TournamentReferenceData;
		existing?: BracketStructure | null;
		defaultSeeding?: SeedGroup | null;
	} = $props();

	const isEdit = $derived(existing !== null);

	function initialSeeding(): SeedGroup[] {
		if (existing) return existing.seeding.map((rule) => ({ ...rule }));
		if (defaultSeeding) return [{ ...defaultSeeding }];

		const source = referenceData.seedingSources[0];
		return [
			{
				outputStart: 1,
				outputEnd: source?.availableTeams || 1,
				result: source?.result ?? 'Standings',
				sourceType: source?.sourceType ?? 'Season',
				sourceID: source?.sourceID ?? 0,
				rankStart: 1,
				rankEnd: source?.availableTeams || 1
			}
		];
	}

	function initialRounds(): RoundUpsert[] {
		if (!existing) return [];
		return existing.rounds.map((round) => ({
			id: round.id,
			name: round.name,
			series: round.series.map((series) => ({
				id: series.id,
				number: series.number,
				format: series.format,
				hostOrder: [...series.hostOrder],
				matchup: {
					spot1: { ...series.matchup.spot1 },
					spot2: { ...series.matchup.spot2 }
				}
			}))
		}));
	}

	// Captured once, on purpose: this is a form, so later prop changes must not
	// overwrite what the executive has typed.
	function initialValues() {
		return {
			name: existing?.name ?? '',
			format: (existing?.format ?? 'Re-seed') as BracketFormat,
			historical: existing?.historical ?? true,
			seeding: initialSeeding(),
			rounds: initialRounds()
		};
	}
	const initial = initialValues();

	let name = $state(initial.name);
	let format = $state<BracketFormat>(initial.format);
	let historical = $state(initial.historical);
	let seeding = $state<SeedGroup[]>(initial.seeding);
	let rounds = $state<RoundUpsert[]>(initial.rounds);
	let saving = $state(false);
	let error = $state('');

	/** Seed number to team, for showing real names once a bracket is seeded. */
	const seedTeams = $derived(
		new Map<number, Team>((existing?.resolvedSeeds ?? []).map((s) => [s.seed, s.team]))
	);

	const teamCount = $derived(
		seeding.reduce((total, rule) => total + (rule.outputEnd - rule.outputStart + 1), 0)
	);

	const firstSeed = $derived(Math.min(...seeding.map((rule) => rule.outputStart)));

	const canLayOut = $derived(
		SUPPORTED_TEAM_COUNTS.includes(teamCount as (typeof SUPPORTED_TEAM_COUNTS)[number])
	);

	const scheduledGameCount = $derived(
		(existing?.rounds ?? [])
			.flatMap((r) => r.series)
			.flatMap((s) => s.gameSlots)
			.filter((slot) => slot.game !== null).length
	);

	const hasRounds = $derived(rounds.length > 0);

	function buildRounds(): void {
		error = '';
		if (!canLayOut) {
			error = `A bracket needs ${SUPPORTED_TEAM_COUNTS.join(', ')} teams. This one has ${teamCount}.`;
			return;
		}
		const lengths = rounds.length > 0 ? rounds.map((r) => r.series[0]?.hostOrder.length ?? 3) : [];
		rounds = generateRounds(teamCount, format, lengths.length > 0 ? lengths : [3], firstSeed - 1);
	}

	function setRoundLength(roundIndex: number, length: number): void {
		const hostOrder = defaultHostOrder(length);
		rounds[roundIndex].series = rounds[roundIndex].series.map((series) => ({
			...series,
			hostOrder: [...hostOrder]
		}));
	}

	/** Home field is set per round, matching how the league already records it. */
	function toggleHost(roundIndex: number, gameIndex: number): void {
		rounds[roundIndex].series = rounds[roundIndex].series.map((series) => {
			const hostOrder = [...series.hostOrder];
			hostOrder[gameIndex] = hostOrder[gameIndex] === 1 ? 2 : 1;
			return { ...series, hostOrder };
		});
	}

	function spotLabel(spot: SpotRef): string {
		if (spot.type === 'Seed') {
			const team = seedTeams.get(spot.number);
			if (team) return `#${spot.number} ${team.name}`;
		}
		return describeSpot(spot);
	}

	async function save(): Promise<void> {
		error = '';

		if (!name.trim()) {
			error = 'Give the bracket a name.';
			return;
		}
		if (!hasRounds) {
			error = 'Set up the rounds before saving.';
			return;
		}

		saving = true;
		const body = {
			name: name.trim(),
			format,
			historical,
			seeding,
			rounds
		};

		const response = await fetch(
			isEdit ? `/api/TournamentBracket/${existing!.id}` : `/api/Tournament/${tournamentId}/Bracket`,
			{
				method: isEdit ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			}
		);
		saving = false;

		if (response.ok) {
			goto(`/Executive/Edit/Tournament/${tournamentId}`, { invalidateAll: true });
		} else {
			error = (await response.text()) || 'Could not save the bracket.';
		}
	}

	async function remove(): Promise<void> {
		if (!existing) return;
		if (!confirm(`Delete the ${existing.name} bracket? This cannot be undone.`)) return;

		const response = await fetch(`/api/TournamentBracket/${existing.id}`, { method: 'DELETE' });
		if (response.ok) {
			goto(`/Executive/Edit/Tournament/${tournamentId}`, { invalidateAll: true });
		} else {
			error = await response.text();
		}
	}
</script>

<div class="bracket-form">
	<h2>What is this bracket called?</h2>
	<p class="executive-explanation">
		Use the name the league uses, like Main, Consolation or B Division.
	</p>
	<input
		type="text"
		class="bracket-text-input"
		placeholder="Bracket name"
		bind:value={name}
		aria-label="Bracket name"
	/>
	<label class="bracket-check">
		<input type="checkbox" bind:checked={historical} />
		Show the winner of this bracket as a champion on the league History page
	</label>

	<h2>Who plays in it?</h2>
	<TournamentSeedingEditor bind:seeding sources={referenceData.seedingSources} subject="bracket" />

	<h2>How does it progress?</h2>
	<div class="bracket-choices">
		<label class="bracket-choice" class:bracket-choice-selected={format === 'Re-seed'}>
			<input type="radio" name="format" value="Re-seed" bind:group={format} />
			<span class="bracket-choice-title">Re-seed after every round</span>
			<span class="bracket-choice-detail">
				The best team still alive always plays the worst team still alive. Most leagues do this.
			</span>
		</label>
		<label class="bracket-choice" class:bracket-choice-selected={format === 'Fixed'}>
			<input type="radio" name="format" value="Fixed" bind:group={format} />
			<span class="bracket-choice-title">Fixed bracket</span>
			<span class="bracket-choice-detail">
				Winners advance along fixed lines, so matchups are known from the start.
			</span>
		</label>
	</div>

	<h2>Rounds and series</h2>
	{#if !hasRounds}
		<p class="executive-explanation">
			{#if canLayOut}
				{teamCount} teams gives {Math.log2(teamCount)} round{Math.log2(teamCount) === 1 ? '' : 's'}.
				Build them and then adjust the series lengths.
			{:else}
				A bracket needs {SUPPORTED_TEAM_COUNTS.join(', ')} teams to lay out automatically. This one currently
				has {teamCount}.
			{/if}
		</p>
		<button type="button" class="executive-action" disabled={!canLayOut} onclick={buildRounds}>
			Build the rounds
		</button>
	{:else}
		<p class="executive-explanation">
			Set how long each round's series are and who gets home field. Every series in a round uses the
			same pattern.
		</p>

		{#each rounds as round, roundIndex (roundIndex)}
			<div class="bracket-round">
				<div class="bracket-round-header">
					<input
						type="text"
						class="bracket-round-name"
						bind:value={round.name}
						aria-label="Name of round {roundIndex + 1}"
					/>
					<span class="bracket-round-count">
						{round.series.length} series
					</span>
				</div>

				<div class="bracket-round-controls">
					<label class="bracket-field">
						<span>Series length</span>
						<select
							value={round.series[0]?.hostOrder.length ?? 3}
							onchange={(e) =>
								setRoundLength(roundIndex, Number((e.currentTarget as HTMLSelectElement).value))}
						>
							{#each SERIES_LENGTHS as length}
								<option value={length}>{seriesLengthLabel(length)}</option>
							{/each}
						</select>
					</label>

					<div class="bracket-hosts">
						<span>Home field</span>
						<div class="bracket-host-buttons">
							{#each round.series[0]?.hostOrder ?? [] as host, gameIndex}
								<button
									type="button"
									class="bracket-host"
									class:bracket-host-higher={host === 1}
									onclick={() => toggleHost(roundIndex, gameIndex)}
									title="Game {gameIndex + 1}: {host === 1
										? 'higher seed hosts'
										: 'lower seed hosts'}. Click to switch."
								>
									<span class="bracket-host-game">G{gameIndex + 1}</span>
									<span class="bracket-host-who">{host === 1 ? 'Higher' : 'Lower'}</span>
								</button>
							{/each}
						</div>
						<span class="bracket-host-summary">
							{hostOrderSummary(round.series[0]?.hostOrder ?? [])}
						</span>
					</div>
				</div>

				<ul class="bracket-series-list">
					{#each round.series as series (series.number)}
						<li>
							<span class="bracket-series-number">Series {series.number}</span>
							{spotLabel(series.matchup.spot1)} vs {spotLabel(series.matchup.spot2)}
						</li>
					{/each}
				</ul>
			</div>
		{/each}

		<div class="bracket-rebuild">
			{#if scheduledGameCount > 0}
				<p class="executive-explanation">
					This bracket has {scheduledGameCount} scheduled game{scheduledGameCount === 1 ? '' : 's'},
					so the rounds cannot be rebuilt. Remove those games first if the format needs to change.
				</p>
			{:else}
				<button type="button" class="bracket-link" onclick={buildRounds}>
					Rebuild the rounds from these settings
				</button>
			{/if}
		</div>
	{/if}

	{#if error}
		<p class="bracket-error">{error}</p>
	{/if}

	<div class="bracket-actions">
		<button type="button" class="executive-action" disabled={saving || !hasRounds} onclick={save}>
			{saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create bracket'}
		</button>
		<a class="bracket-link" href="/Executive/Edit/Tournament/{tournamentId}">Cancel</a>
		{#if isEdit}
			<button
				type="button"
				class="bracket-link bracket-link-danger"
				disabled={!existing!.canDelete}
				title={existing!.canDelete
					? 'Delete this bracket'
					: 'This bracket has scheduled games and cannot be deleted'}
				onclick={remove}
			>
				Delete bracket
			</button>
		{/if}
	</div>
</div>

<style>
	.bracket-form h2 {
		margin-top: var(--space-5);
	}

	.bracket-text-input {
		width: 100%;
		max-width: 360px;
		height: 34px;
		padding: 0 var(--space-2);
		border: var(--game-border);
		border-radius: var(--radius-sm);
		font-family: inherit;
		font-size: var(--text-base);
	}

	.bracket-check {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-top: var(--space-3);
		font-size: var(--text-sm);
	}

	.bracket-choices {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		margin-top: var(--space-2);
	}

	.bracket-choice {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--space-2);
		align-items: start;
		flex: 1 1 260px;
		padding: var(--space-3);
		border: var(--game-border);
		border-radius: var(--radius-md);
		cursor: pointer;
	}

	.bracket-choice-selected {
		border-color: var(--surface-heading-primary);
		background-color: var(--standings-hover-bg);
	}

	.bracket-choice input {
		margin-top: 3px;
	}

	.bracket-choice-title {
		font-weight: 700;
	}

	.bracket-choice-detail {
		grid-column: 2;
		font-size: var(--text-sm);
		color: var(--text-soft-contrast);
	}

	.bracket-round {
		border: var(--game-border);
		border-radius: var(--radius-md);
		padding: var(--space-3);
		margin-top: var(--space-3);
	}

	.bracket-round-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.bracket-round-name {
		height: 32px;
		padding: 0 var(--space-2);
		border: var(--game-border);
		border-radius: var(--radius-sm);
		font-family: inherit;
		font-size: var(--text-base);
		font-weight: 700;
		flex: 1 1 180px;
		max-width: 260px;
	}

	.bracket-round-count {
		font-size: var(--text-sm);
		color: var(--text-soft-contrast);
	}

	.bracket-round-controls {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
		margin-top: var(--space-3);
	}

	.bracket-field,
	.bracket-hosts {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.bracket-field select {
		height: 32px;
		padding: 0 var(--space-2);
		border: var(--game-border);
		border-radius: var(--radius-sm);
		font-family: inherit;
		font-size: var(--text-sm);
	}

	.bracket-host-buttons {
		display: flex;
		gap: 4px;
	}

	.bracket-host {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 58px;
		padding: 4px var(--space-2);
		border: var(--game-border);
		border-radius: var(--radius-sm);
		background: none;
		cursor: pointer;
		font-family: inherit;
	}

	.bracket-host-higher {
		background-color: var(--surface-heading-primary);
		color: var(--text-inverted);
		border-color: var(--surface-heading-primary);
	}

	.bracket-host-game {
		font-size: var(--text-xs, 11px);
		text-transform: uppercase;
	}

	.bracket-host-who {
		font-size: var(--text-sm);
		font-weight: 700;
	}

	.bracket-host-summary {
		font-size: var(--text-sm);
		color: var(--text-soft-contrast);
		font-style: italic;
	}

	.bracket-series-list {
		margin-top: var(--space-3);
		padding-left: var(--space-4);
		font-size: var(--text-sm);
	}

	.bracket-series-number {
		display: inline-block;
		min-width: 84px;
		color: var(--text-soft-contrast);
	}

	.bracket-rebuild {
		margin-top: var(--space-3);
	}

	.bracket-error {
		margin-top: var(--space-3);
		color: var(--color-loss);
	}

	.bracket-actions {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		margin-top: var(--space-4);
		flex-wrap: wrap;
	}

	.bracket-link {
		background: none;
		border: none;
		padding: 0;
		color: var(--link-default);
		cursor: pointer;
		font-family: inherit;
		font-size: var(--text-sm);
		text-decoration: underline;
	}

	.bracket-link:hover {
		color: var(--link-hover);
	}

	.bracket-link-danger {
		color: var(--color-loss);
	}

	.bracket-link:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
