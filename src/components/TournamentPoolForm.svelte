<script lang="ts">
	import { goto } from '$app/navigation';
	import type {
		RoundRobinStructure,
		SeedGroup,
		TournamentDetail,
		TournamentReferenceData
	} from '$lib/models/Tournament';
	import { seedingProblems } from '$lib/seeding/problems';
	import TournamentSeedingBoard from './TournamentSeedingBoard.svelte';

	let {
		tournamentId,
		referenceData,
		existing = null,
		tournament = null,
		defaultSeeding = null,
		prefillNote = null
	}: {
		tournamentId: number;
		referenceData: TournamentReferenceData;
		existing?: RoundRobinStructure | null;
		/** The whole tournament, so the seeding board can show team names. Optional: without it, ranks show as numbers. */
		tournament?: TournamentDetail | null;
		/** A rule to start a new pool from (the "add a B-side pool for them" link); otherwise a new pool starts empty. */
		defaultSeeding?: SeedGroup | null;
		/** Shown above the form when the pool arrives pre-filled, so the exec knows what was assumed. */
		prefillNote?: string | null;
	} = $props();

	const isEdit = $derived(existing !== null);

	/**
	 * What comes after the pool decides where the champion mark goes:
	 *  - title: the standings decide it; the pool's winner is a champion (History page)
	 *  - final: its top teams go on to a final we set up next; the mark belongs on the final
	 *  - none:  just games; no title comes from the pool
	 */
	type After = 'title' | 'final' | 'none';
	const FINAL_SIZES = [2, 4] as const;

	/** A bracket already seeded from this pool's standings, if the exec built one. */
	const existingFinal = $derived(
		existing && tournament
			? (tournament.brackets.find((b) =>
					b.seeding.some(
						(rule) => rule.sourceType === 'TournamentRoundRobin' && rule.sourceID === existing!.id
					)
				) ?? null)
			: null
	);

	// A new pool starts empty: pools are picked by membership, and "Add all" on a
	// source fills the common cases (everyone knocked out in a round; everyone in
	// the league) in one tap. Starting from the regular-season default would mean
	// removing ten teams to build a four-team consolation pool. A link that knows
	// which teams it means (the tournament page's suggestion) passes them in.
	function initialSeeding(): SeedGroup[] {
		if (existing) return existing.seeding.map((rule) => ({ ...rule }));
		return defaultSeeding ? [{ ...defaultSeeding }] : [];
	}

	function initialAfter(): After | null {
		if (!existing) return null; // a new pool has to say
		if (existing.historical) return 'title';
		const fedFinal =
			tournament?.brackets.some((b) =>
				b.seeding.some(
					(rule) => rule.sourceType === 'TournamentRoundRobin' && rule.sourceID === existing!.id
				)
			) ?? false;
		return fedFinal ? 'final' : 'none';
	}

	// Captured once, on purpose: this is a form, so later prop changes must not
	// overwrite what the executive has typed.
	function initialValues() {
		return {
			name: existing?.name ?? '',
			after: initialAfter(),
			seeding: initialSeeding()
		};
	}
	const initial = initialValues();

	let name = $state(initial.name);
	let after = $state<After | null>(initial.after);
	let finalTop = $state<(typeof FINAL_SIZES)[number]>(2);
	let seeding = $state<SeedGroup[]>(initial.seeding);
	let saving = $state(false);
	let error = $state('');

	const seedingIssues = $derived(seedingProblems(seeding, referenceData.seedingSources, 'pool'));

	/** Saving with "a final" chosen carries straight on to creating it, unless one already exists. */
	const continuesToFinal = $derived(after === 'final' && existingFinal === null);

	const saveLabel = $derived(
		saving
			? 'Saving...'
			: continuesToFinal
				? isEdit
					? 'Save and set up the final'
					: 'Create pool and set up the final'
				: isEdit
					? 'Save changes'
					: 'Create pool'
	);

	async function save(): Promise<void> {
		error = '';
		if (!name.trim()) {
			error = 'Give the pool a name.';
			return;
		}
		if (after === null) {
			error = 'Say what happens after the pool.';
			return;
		}
		if (seedingIssues.length > 0) {
			error = 'Fix the seeding problems above before saving.';
			return;
		}

		saving = true;
		const response = await fetch(
			isEdit
				? `/api/TournamentRoundRobin/${existing!.id}`
				: `/api/Tournament/${tournamentId}/RoundRobin`,
			{
				method: isEdit ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: name.trim(), historical: after === 'title', seeding })
			}
		);
		saving = false;

		if (!response.ok) {
			error = (await response.text()) || 'Could not save the pool.';
			return;
		}

		if (continuesToFinal) {
			const poolId = existing?.id ?? ((await response.json()) as { id: number }).id;
			goto(
				`/Executive/Edit/Tournament/${tournamentId}/AddBracket?afterPool=${poolId}&top=${finalTop}`,
				{ invalidateAll: true }
			);
		} else {
			goto(`/Executive/Edit/Tournament/${tournamentId}`, { invalidateAll: true });
		}
	}

	async function remove(): Promise<void> {
		if (!existing) return;
		if (!confirm(`Delete the ${existing.name} pool? This cannot be undone.`)) return;

		const response = await fetch(`/api/TournamentRoundRobin/${existing.id}`, { method: 'DELETE' });
		if (response.ok) {
			goto(`/Executive/Edit/Tournament/${tournamentId}`, { invalidateAll: true });
		} else {
			error = await response.text();
		}
	}
</script>

<div class="pool-form">
	{#if prefillNote}
		<p class="pool-prefill">{prefillNote}</p>
	{/if}

	<h2>What is this pool called?</h2>
	<input
		type="text"
		class="pool-text-input"
		placeholder="Pool name, like B Side or Consolation"
		bind:value={name}
		aria-label="Pool name"
	/>

	<h2>Who plays in it?</h2>
	<p class="executive-explanation">
		Pools are often filled with teams knocked out of a bracket. Pick the teams; the order does not
		matter for a pool.
	</p>
	<TournamentSeedingBoard
		bind:seeding
		sources={referenceData.seedingSources}
		subject="pool"
		{tournament}
		resolvedSeeds={existing?.resolvedSeeds ?? []}
	/>

	<h2>What happens after the pool?</h2>
	<div class="pool-choices" role="radiogroup" aria-label="What happens after the pool">
		<label class="pool-choice" class:pool-choice-selected={after === 'title'}>
			<input type="radio" name="after" value="title" bind:group={after} />
			<span class="pool-choice-title">The standings decide it</span>
			<span class="pool-choice-detail">
				Whoever finishes first is the champion of this side and goes on the History page.
			</span>
		</label>
		<label class="pool-choice" class:pool-choice-selected={after === 'final'}>
			<input type="radio" name="after" value="final" bind:group={after} />
			<span class="pool-choice-title">The top teams play a final</span>
			<span class="pool-choice-detail">
				{#if existingFinal}
					The top teams go on to
					<a href="/Executive/Edit/Tournament/{tournamentId}/Bracket/{existingFinal.id}">
						{existingFinal.name}
					</a>, which carries the champion mark.
				{:else}
					The top
					<select
						class="pool-choice-select"
						aria-label="How many teams go on to the final"
						bind:value={finalTop}
						disabled={after !== 'final'}
					>
						{#each FINAL_SIZES as size (size)}
							<option value={size}>{size}</option>
						{/each}
					</select>
					by standings go on to a final. You will set the final up next, already seeded from this pool,
					and the champion mark goes on the final.
				{/if}
			</span>
		</label>
		<label class="pool-choice" class:pool-choice-selected={after === 'none'}>
			<input type="radio" name="after" value="none" bind:group={after} />
			<span class="pool-choice-title">Nothing more</span>
			<span class="pool-choice-detail">
				Just games for the teams that are out. No title comes from this pool.
			</span>
		</label>
	</div>

	{#if error}
		<p class="pool-error">{error}</p>
	{/if}

	<div class="pool-actions">
		<button
			type="button"
			class="executive-action"
			disabled={saving || seedingIssues.length > 0}
			title={seedingIssues.length > 0 ? 'Fix the seeding problems first' : undefined}
			onclick={save}
		>
			{saveLabel}
		</button>
		<a class="pool-link" href="/Executive/Edit/Tournament/{tournamentId}">Cancel</a>
		{#if isEdit}
			<button
				type="button"
				class="pool-link pool-link-danger"
				disabled={!existing!.canDelete}
				title={existing!.canDelete
					? 'Delete this pool'
					: 'This pool has scheduled games and cannot be deleted'}
				onclick={remove}
			>
				Delete pool
			</button>
		{/if}
	</div>
</div>

<style>
	.pool-form h2 {
		margin-top: var(--space-5);
	}

	.pool-text-input {
		width: 100%;
		max-width: 360px;
		height: 34px;
		padding: 0 var(--space-2);
		border: var(--game-border);
		border-radius: var(--radius-sm);
		font-family: inherit;
		font-size: var(--text-base);
	}

	.pool-prefill {
		margin: var(--space-3) 0 0;
		padding: var(--space-3) var(--space-4);
		border-left: 4px solid var(--surface-heading-primary);
		background: var(--surface-page);
		font-size: var(--text-sm);
	}

	/* Same shape as the bracket form's "How does it progress?" cards */
	.pool-choices {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		margin-top: var(--space-2);
	}

	.pool-choice {
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

	.pool-choice-selected {
		border-color: var(--surface-heading-primary);
		background-color: var(--standings-hover-bg);
	}

	.pool-choice input[type='radio'] {
		margin-top: 3px;
	}

	.pool-choice-title {
		font-weight: 700;
	}

	.pool-choice-detail {
		grid-column: 2;
		font-size: var(--text-sm);
		color: var(--text-soft-contrast);
	}

	.pool-choice-select {
		height: 24px;
		margin: 0 2px;
		font-family: inherit;
		font-size: var(--text-sm);
	}

	.pool-error {
		margin-top: var(--space-3);
		color: var(--color-loss);
	}

	.pool-actions {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		margin-top: var(--space-4);
		flex-wrap: wrap;
	}

	.pool-link {
		background: none;
		border: none;
		padding: 0;
		color: var(--link-default);
		cursor: pointer;
		font-family: inherit;
		font-size: var(--text-sm);
		text-decoration: underline;
	}

	.pool-link:hover {
		color: var(--link-hover);
	}

	.pool-link-danger {
		color: var(--color-loss);
	}

	.pool-link:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
