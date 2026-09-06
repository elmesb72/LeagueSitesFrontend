<script lang="ts">
	import { flip } from 'svelte/animate';
	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import {
		validateStandingsConfig,
		type StandingsComparatorOption,
		type StandingsConfigEdit
	} from '$lib/models/StandingsConfig';

	let {
		initial,
		comparators,
		disabled = false
	}: {
		initial: StandingsConfigEdit;
		comparators: StandingsComparatorOption[];
		disabled?: boolean;
	} = $props();

	const flipDurationMs = 150;

	// Initial values are captured once on purpose (matching the other admin
	// forms): later prop changes must not overwrite what the webmaster has
	// typed. The parent reads the current state via currentConfig() at save.
	type TiebreakerRow = { id: string; name: string };
	let winsValue = $state(0);
	let tiesValue = $state(0);
	let lossesValue = $state(0);
	let forfeitWinnerScore = $state(0);
	let forfeitLoserScore = $state(0);
	let rows = $state<TiebreakerRow[]>([]);
	// svelte-ignore state_referenced_locally -- deliberate one-time capture
	{
		winsValue = initial.winsValue;
		tiesValue = initial.tiesValue;
		lossesValue = initial.lossesValue;
		forfeitWinnerScore = initial.forfeitWinnerScore;
		forfeitLoserScore = initial.forfeitLoserScore;
		rows = initial.tiebreakers.map((name) => ({ id: name, name }));
	}

	let toAdd = $state('');

	const available = $derived(
		comparators.filter((c) => !rows.some((r) => r.name === c.name))
	);

	const problems = $derived(validateStandingsConfig(buildConfig()));

	function buildConfig(): StandingsConfigEdit {
		return {
			winsValue,
			tiesValue,
			lossesValue,
			forfeitWinnerScore,
			forfeitLoserScore,
			tiebreakers: rows.map((r) => r.name)
		};
	}

	/** The webmaster's current (possibly unsaved) standings rules. */
	export function currentConfig(): StandingsConfigEdit {
		return buildConfig();
	}

	/** Problems that would block a save; empty when the form is valid. */
	export function validationProblems(): string[] {
		return problems;
	}

	/** "HeadToHeadRunDifferential" -> "Head to head run differential" */
	function friendlyName(name: string): string {
		const spaced = name.replace(/([A-Z])/g, ' $1').trim();
		return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
	}

	function description(name: string): string {
		return comparators.find((c) => c.name === name)?.description ?? '';
	}

	function addTiebreaker(): void {
		if (!toAdd || rows.some((r) => r.name === toAdd)) return;
		rows = [...rows, { id: toAdd, name: toAdd }];
		toAdd = '';
	}

	function removeTiebreaker(index: number): void {
		rows = rows.filter((_, i) => i !== index);
	}

	function handleDnd(e: CustomEvent<DndEvent<TiebreakerRow>>): void {
		rows = e.detail.items;
	}
</script>

<div class="standings-rules">
	<div class="config-field-row">
		<div class="config-field">
			<label for="standings-wins">Win points</label>
			<input
				id="standings-wins"
				type="number"
				min="-100"
				max="100"
				bind:value={winsValue}
				{disabled}
				class="config-input-short"
			/>
		</div>
		<div class="config-field">
			<label for="standings-ties">Tie points</label>
			<input
				id="standings-ties"
				type="number"
				min="-100"
				max="100"
				bind:value={tiesValue}
				{disabled}
				class="config-input-short"
			/>
		</div>
		<div class="config-field">
			<label for="standings-losses">Loss points</label>
			<input
				id="standings-losses"
				type="number"
				min="-100"
				max="100"
				bind:value={lossesValue}
				{disabled}
				class="config-input-short"
			/>
		</div>
	</div>

	<div class="config-field-row">
		<div class="config-field">
			<label for="standings-forfeit-winner">Forfeit winner score</label>
			<input
				id="standings-forfeit-winner"
				type="number"
				min="0"
				max="99"
				bind:value={forfeitWinnerScore}
				{disabled}
				class="config-input-short"
			/>
		</div>
		<div class="config-field">
			<label for="standings-forfeit-loser">Forfeit loser score</label>
			<input
				id="standings-forfeit-loser"
				type="number"
				min="0"
				max="99"
				bind:value={forfeitLoserScore}
				{disabled}
				class="config-input-short"
			/>
		</div>
	</div>
	<p class="config-field-hint">
		Forfeited games are recorded at this score for standings purposes.
	</p>

	<h2 class="standings-rules-subhead">Tiebreakers</h2>
	<p class="config-explanation">
		Teams are ranked by the first rule; each following rule breaks any
		remaining ties. Head-to-head rules count only the games between the
		tied teams. If teams are still tied after every rule, they are listed
		alphabetically. Drag rows to reorder.
	</p>

	<div
		class="config-dnd-list"
		use:dndzone={{ items: rows, flipDurationMs, dragDisabled: disabled, dropTargetStyle: {} }}
		onconsider={handleDnd}
		onfinalize={handleDnd}
	>
		{#each rows as row, i (row.id)}
			<div class="config-kv-row" animate:flip={{ duration: flipDurationMs }}>
				<span class="config-drag-handle" aria-hidden="true"><i class="fa-solid fa-grip-vertical"></i></span>
				<span class="standings-rules-order">{i + 1}.</span>
				<span class="standings-rules-name">{friendlyName(row.name)}</span>
				<span class="standings-rules-desc">{description(row.name)}</span>
				<button
					type="button"
					class="config-remove"
					onclick={() => removeTiebreaker(i)}
					{disabled}
					title="Remove"
					aria-label="Remove tiebreaker {i + 1} ({friendlyName(row.name)})"
				>
					<i class="fa-regular fa-trash-can"></i>
				</button>
			</div>
		{/each}
	</div>

	<div class="standings-rules-add">
		<select bind:value={toAdd} aria-label="Tiebreaker to add" {disabled}>
			<option value="">Choose a tiebreaker…</option>
			{#each available as option (option.name)}
				<option value={option.name}>{friendlyName(option.name)} — {option.description}</option>
			{/each}
		</select>
		<button
			type="button"
			class="config-add"
			onclick={addTiebreaker}
			disabled={disabled || !toAdd}
		>
			+ Add tiebreaker
		</button>
	</div>

	{#if problems.length > 0}
		<ul class="standings-rules-problems">
			{#each problems as problem}
				<li>{problem}</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.standings-rules-subhead {
		background: unset;
		color: var(--text-default);
		border: none;
		padding: 0;
		margin: var(--space-4) 0 var(--space-1) 0;
		font-size: var(--text-lg);
	}

	.standings-rules-order {
		font-weight: 700;
		min-width: 24px;
		text-align: right;
	}

	.standings-rules-name {
		font-weight: 700;
		white-space: nowrap;
	}

	.standings-rules-desc {
		color: var(--text-soft-contrast);
		font-size: var(--text-sm);
		flex: 1;
	}

	.standings-rules-add {
		display: flex;
		gap: var(--space-2);
		align-items: center;
		margin-top: var(--space-2);
	}

	.standings-rules-add select {
		max-width: 100%;
	}

	.standings-rules-problems {
		margin-top: var(--space-2);
		color: var(--color-loss);
		font-size: var(--text-sm);
		padding-left: var(--space-4);
	}
</style>
