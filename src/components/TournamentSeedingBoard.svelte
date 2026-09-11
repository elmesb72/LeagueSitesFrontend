<script lang="ts">
	// Visual seeding editor. Sources with resolved team names on the left, the
	// bracket's seeds on the right, connectors between them coloured by how each
	// seed relates to the default order. Pools get a membership bin instead.
	//
	// This is a view over the existing SeedGroup[] rules: every action compiles
	// the board back into `seeding`, and edits made in the Advanced rule table
	// (the old editor, kept below) flow onto the board. No backend change.
	import { untrack } from 'svelte';
	import type {
		SeedAssignment,
		SeedGroup,
		SeedingSourceOption,
		TournamentDetail
	} from '$lib/models/Tournament';
	import type { Team } from '$lib/models/Team';
	import {
		assign,
		changePrimary,
		clearSlot,
		resetDefault,
		restore,
		setSeedCount,
		sitOut,
		type ActionResult
	} from '$lib/seeding/actions';
	import {
		classify,
		compile,
		compilePool,
		decompile,
		decompilePool,
		inferSittingOut,
		sameAssignments,
		sameMembers,
		validateSeedGroups
	} from '$lib/seeding/adapters';
	import {
		assignmentId,
		sameAssignment,
		sourceKey,
		type Assignment,
		type BoardState,
		type SeedSlot,
		type SourceGroup
	} from '$lib/seeding/model';
	import { poolProblems, slotProblems } from '$lib/seeding/problems';
	import {
		SEASON_LOADING,
		buildSourceGroups,
		fetchSeasonRanks,
		type SeasonRanks
	} from '$lib/seeding/resolvers';
	import SeedingConnectors from './SeedingConnectors.svelte';
	import SeedingLegend from './SeedingLegend.svelte';
	import SeedingSeedColumn from './SeedingSeedColumn.svelte';
	import SeedingSourceColumn from './SeedingSourceColumn.svelte';
	import TournamentSeedingEditor from './TournamentSeedingEditor.svelte';

	let {
		seeding = $bindable(),
		sources,
		subject = 'bracket',
		tournament = null,
		resolvedSeeds = [],
		seeds = null,
		ownRoundIds = [],
		fetchFn = fetch
	}: {
		seeding: SeedGroup[];
		sources: SeedingSourceOption[];
		subject?: 'bracket' | 'pool';
		/** For resolving names. The host page already has it; null degrades to rank numbers. */
		tournament?: TournamentDetail | null;
		/** The server's seed → team for the *saved* rules; authoritative for untouched seeds. */
		resolvedSeeds?: SeedAssignment[];
		/** Seed numbers the bracket's matchups use. Null for a new bracket (the board picks). */
		seeds?: number[] | null;
		/** Rounds of the bracket being edited, so it is not offered as its own source. */
		ownRoundIds?: number[];
		fetchFn?: typeof fetch;
	} = $props();

	const SEED_COUNTS = [2, 4, 8, 16];

	const mode = $derived<'bracket' | 'pool'>(subject === 'pool' ? 'pool' : 'bracket');
	const visibleSources = $derived(
		sources.filter((s) => !(s.sourceType === 'BracketRound' && ownRoundIds.includes(s.sourceID)))
	);
	const sourceOrder = $derived(visibleSources.map(sourceKey));
	const regularSeasonID = $derived(
		tournament?.referenceData.regularSeasonID ??
			sources.find((s) => s.sourceType === 'Season')?.sourceID ??
			null
	);

	// ------------------------------------------------------------ resolution
	let seasonRanks = $state<SeasonRanks>(SEASON_LOADING);

	$effect(() => {
		const year = tournament?.season?.year;
		const wantsSeason = visibleSources.some((s) => s.sourceType === 'Season');
		if (!year || !wantsSeason) {
			seasonRanks = { teams: null, error: null, pending: false };
			return;
		}
		let cancelled = false;
		fetchSeasonRanks(year, fetchFn).then((result) => {
			if (!cancelled) seasonRanks = result;
		});
		return () => {
			cancelled = true;
		};
	});

	const groups = $derived(
		buildSourceGroups({
			sources: visibleSources,
			tournament,
			regularSeasonID,
			seasonRanks,
			feedsBracket: mode === 'bracket'
		})
	);

	function capacityOf(key: string): number {
		return visibleSources.find((s) => sourceKey(s) === key)?.availableTeams ?? 0;
	}
	function groupOf(key: string): SourceGroup | undefined {
		return groups.find((g) => g.key === key);
	}
	function teamOf(a: Assignment): Team | null {
		return groupOf(a.sourceKey)?.ranks[a.rank - 1]?.team ?? null;
	}
	function nameOf(a: Assignment): string {
		return (
			teamOf(a)?.fullName ??
			`${groupOf(a.sourceKey)?.shortLabel ?? 'unknown source'} rank ${a.rank}`
		);
	}
	function shortLabelOf(key: string): string {
		return groupOf(key)?.shortLabel ?? 'another source';
	}

	// ----------------------------------------------------------- initial state
	// Captured once, matching the admin forms: later prop changes must not
	// overwrite what the executive has done. Edits arrive through `seeding`.
	function initialPrimary(slots: SeedSlot[]): string {
		const first = slots.find((s) => s.assignment)?.assignment?.sourceKey;
		if (first && sourceOrder.includes(first)) return first;
		const season = visibleSources.find((s) => s.sourceType === 'Season');
		return season ? sourceKey(season) : (sourceOrder[0] ?? '');
	}

	function initialBoard(): BoardState {
		const slots = decompile(seeding, seeds ?? []);
		if (seeds === null) for (const slot of slots) slot.orphan = false;
		const primaryKey = initialPrimary(slots);
		return {
			primaryKey,
			slots,
			sittingOut: inferSittingOut(slots, primaryKey, capacityOf(primaryKey))
		};
	}

	// The next four lines deliberately read props once. `serverTeamBySeed` is the
	// server's view of the *saved* rules and stays fixed for the form's life.
	const loaded = initialBoard();
	const loadedSeeding: SeedGroup[] = seeding.map((rule) => ({ ...rule }));
	const loadedBySeed = new Map(loaded.slots.map((s) => [s.seed, s.assignment]));
	// svelte-ignore state_referenced_locally
	const serverTeamBySeed = new Map(resolvedSeeds.map((r) => [r.seed, r.team]));

	let board = $state<BoardState>(loaded);
	let members = $state<Assignment[]>(decompilePool(seeding));
	let poolDirty = $state(false);
	let selected = $state<Assignment | null>(null);
	let status = $state('');
	let live = $state('');
	/** Bumped on every change so the connectors re-measure. */
	let version = $state(0);
	let gridEl = $state<HTMLElement | null>(null);

	type Snapshot = { board: BoardState; members: Assignment[]; poolDirty: boolean };
	let undoStack = $state<Snapshot[]>([]);

	const states = $derived(classify(board, capacityOf(board.primaryKey)));
	const pairs = $derived(
		board.slots.flatMap((slot, k) =>
			slot.assignment
				? [{ chipId: assignmentId(slot.assignment), slotIndex: k, state: states[k] }]
				: []
		)
	);
	const problems = $derived(
		mode === 'pool'
			? poolProblems(seeding, visibleSources)
			: [...new Set([...validateSeedGroups(seeding), ...slotProblems(board.slots, visibleSources)])]
	);
	const seedCountOptions = $derived(
		[...new Set([...SEED_COUNTS, board.slots.length])].sort((a, b) => a - b)
	);

	/** Problems that would block a save; empty when the seeding is valid. */
	export function validationProblems(): string[] {
		return problems;
	}

	// ------------------------------------------------------------- publishing
	function publish(): void {
		if (mode === 'pool') {
			seeding = poolDirty
				? compilePool(members, sourceOrder)
				: loadedSeeding.map((r) => ({ ...r }));
		} else {
			seeding = compile(board.slots);
		}
	}

	function setStatus(message: string): void {
		status = message;
		live = message;
	}

	function snapshot(): Snapshot {
		return { board: $state.snapshot(board), members: $state.snapshot(members), poolDirty };
	}

	function pushUndo(): void {
		undoStack = [...undoStack.slice(-19), snapshot()];
	}

	function undo(): void {
		const previous = undoStack.at(-1);
		if (!previous) return;
		undoStack = undoStack.slice(0, -1);
		board = previous.board;
		members = previous.members;
		poolDirty = previous.poolDirty;
		selected = null;
		publish();
		setStatus('Undone.');
		version++;
	}

	function apply(result: ActionResult): void {
		if (result.state === board || result.message === '') return;
		pushUndo();
		board = result.state;
		selected = null;
		publish();
		setStatus(result.message);
		version++;
	}

	// Edits made in the Advanced rule table (or by the host form) arrive here.
	// The rules are copied field by field *outside* untrack so that in-place
	// edits to a rule (which is how the table edits) are tracked too.
	$effect(() => {
		const external: SeedGroup[] = seeding.map((rule) => ({ ...rule }));
		untrack(() => {
			if (mode === 'pool') {
				const ext = decompilePool(external);
				if (!sameMembers(ext, members)) {
					members = ext;
					version++;
				}
				return;
			}
			const wanted = seeds ?? board.slots.map((s) => s.seed);
			const ext = decompile(external, wanted);
			if (seeds === null) for (const slot of ext) slot.orphan = false;
			if (!sameAssignments(ext, board.slots)) {
				const primaryKey = board.primaryKey;
				board = {
					primaryKey,
					slots: ext,
					sittingOut: inferSittingOut(ext, primaryKey, capacityOf(primaryKey))
				};
				version++;
			}
		});
	});

	// ----------------------------------------------------------- interactions
	function seatOf(a: Assignment): number | null {
		return board.slots.find((s) => sameAssignment(s.assignment, a))?.seed ?? null;
	}

	function isMember(a: Assignment): boolean {
		return members.some((m) => sameAssignment(m, a));
	}

	/** The server's team for a seed whose rule has not changed since load; else the browser's. */
	function teamForSlot(slot: SeedSlot): Team | null {
		if (!slot.assignment) return null;
		const untouched = sameAssignment(slot.assignment, loadedBySeed.get(slot.seed) ?? null);
		if (untouched && serverTeamBySeed.has(slot.seed)) return serverTeamBySeed.get(slot.seed)!;
		return teamOf(slot.assignment);
	}

	function onChip(a: Assignment): void {
		if (mode === 'pool') {
			toggleMember(a);
			return;
		}
		selected = sameAssignment(selected, a) ? null : { ...a };
	}

	function onSlot(k: number): void {
		if (selected) {
			apply(assign(board, selected, k, nameOf));
			return;
		}
		const occupant = board.slots[k].assignment;
		selected = occupant ? { ...occupant } : null;
	}

	function onDragStart(a: Assignment, event: DragEvent): void {
		event.dataTransfer?.setData('text/plain', assignmentId(a));
		if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
		selected = null;
	}

	function onDropSitOut(a: Assignment): void {
		if (a.sourceKey !== board.primaryKey) {
			setStatus('Only teams from the default source can sit out.');
			return;
		}
		apply(sitOut(board, a.rank, capacityOf(board.primaryKey), nameOf));
	}

	function onSitOutSelected(): void {
		if (selected) onDropSitOut(selected);
	}

	function onPrimaryChange(event: Event): void {
		const key = (event.currentTarget as HTMLSelectElement).value;
		apply(changePrimary(board, key, capacityOf(key), groupOf(key)?.option.label ?? key));
	}

	function onSeedCountChange(event: Event): void {
		const n = Number((event.currentTarget as HTMLSelectElement).value);
		apply(setSeedCount(board, n, capacityOf(board.primaryKey)));
	}

	function toggleMember(a: Assignment): void {
		const has = isMember(a);
		pushUndo();
		members = has ? members.filter((m) => !sameAssignment(m, a)) : [...members, { ...a }];
		poolDirty = true;
		publish();
		setStatus(has ? `${nameOf(a)} removed from the pool.` : `${nameOf(a)} added to the pool.`);
		version++;
	}

	function onAddAll(group: SourceGroup): void {
		const missing = group.ranks
			.map((r) => ({ sourceKey: group.key, rank: r.rank }))
			.filter((a) => !isMember(a));
		if (missing.length === 0) return;
		pushUndo();
		members = [...members, ...missing];
		poolDirty = true;
		publish();
		setStatus(
			`Added ${missing.length} team${missing.length === 1 ? '' : 's'} from ${group.option.label}.`
		);
		version++;
	}

	function onKeydown(event: KeyboardEvent): void {
		const target = event.target as HTMLElement | null;
		const inField = target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName);
		if (event.key === 'Escape' && selected) {
			selected = null;
			event.preventDefault();
		} else if (
			(event.ctrlKey || event.metaKey) &&
			!event.shiftKey &&
			event.key.toLowerCase() === 'z' &&
			!inField
		) {
			if (undoStack.length > 0) {
				event.preventDefault();
				undo();
			}
		}
	}

	const hint = $derived(
		mode === 'pool'
			? 'Tap a team to add or remove it, or drag it into the pool.'
			: 'Drag a team onto a seed, or tap a team and then a seed. Dropping onto an occupied seed swaps the two.'
	);
	const statusText = $derived(
		selected
			? `Selected: ${nameOf(selected)}. Tap a seed to place it, tap "Sitting out" to exclude it, or press Escape.`
			: status || hint
	);
</script>

<!-- Keyboard shortcuts (Escape, Ctrl/Cmd+Z) for the whole region; every control inside is a real button. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="seeding-board" onkeydown={onKeydown}>
	{#if mode === 'bracket'}
		<div class="seeding-controls">
			<label>
				Fill seeds by default from
				<select
					value={board.primaryKey}
					onchange={onPrimaryChange}
					aria-label="Fill seeds by default from"
				>
					{#each groups as group (group.key)}
						<option value={group.key}>{group.option.label}</option>
					{/each}
				</select>
			</label>
			{#if seeds === null}
				<label>
					Seeds
					<select
						value={String(board.slots.length)}
						onchange={onSeedCountChange}
						aria-label="Number of seeds"
					>
						{#each seedCountOptions as n (n)}
							<option value={String(n)}>{n}</option>
						{/each}
					</select>
				</label>
			{/if}
			<button
				type="button"
				class="seeding-button"
				onclick={() => apply(resetDefault(board, capacityOf(board.primaryKey)))}
			>
				Reset to default
			</button>
		</div>
		<SeedingLegend />
	{/if}

	<div class="seeding-grid" class:seeding-grid-pool={mode === 'pool'} bind:this={gridEl}>
		{#if mode === 'bracket'}
			<div class="seeding-connectors-wrap">
				<SeedingConnectors container={gridEl} {pairs} {version} />
			</div>
		{/if}
		<SeedingSourceColumn
			{groups}
			{mode}
			primaryKey={board.primaryKey}
			sittingOut={board.sittingOut}
			{selected}
			{seatOf}
			{isMember}
			{onChip}
			{onDragStart}
			{onSitOutSelected}
			{onDropSitOut}
			onRestore={(rank) => apply(restore(board, rank, nameOf))}
			{onAddAll}
		/>
		<div class="seeding-gutter"></div>
		<SeedingSeedColumn
			{mode}
			slots={board.slots}
			{states}
			teamFor={teamForSlot}
			{nameOf}
			{shortLabelOf}
			{selected}
			{members}
			{groups}
			{onSlot}
			onDropSlot={(a, k) => apply(assign(board, a, k, nameOf))}
			onClear={(k) => apply(clearSlot(board, k, nameOf))}
			{onDragStart}
			onRemoveMember={(a) => isMember(a) && toggleMember(a)}
			onDropMember={(a) => !isMember(a) && toggleMember(a)}
		/>
	</div>

	<div class="seeding-status" role="status">
		<span>{statusText}</span>
		{#if undoStack.length > 0}
			<button type="button" class="seeding-link" onclick={undo}>Undo</button>
		{/if}
	</div>

	{#if problems.length > 0}
		<ul class="seeding-problems">
			{#each problems as problem (problem)}
				<li>{problem}</li>
			{/each}
		</ul>
	{/if}

	<details class="seeding-advanced">
		<summary>Advanced: edit as rules</summary>
		<TournamentSeedingEditor bind:seeding {sources} {subject} />
	</details>

	<div class="seeding-sr-only" aria-live="polite">{live}</div>
</div>

<style>
	.seeding-board {
		margin-top: var(--space-2);
	}

	.seeding-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3) var(--space-5);
		margin-bottom: var(--space-3);
		font-size: var(--text-sm);
	}

	.seeding-controls label {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.seeding-controls select,
	.seeding-button {
		height: 32px;
		padding: 0 var(--space-3);
		border: var(--game-border);
		border-radius: var(--radius-sm);
		background: var(--surface-section);
		color: var(--text-default);
		font-family: inherit;
		font-size: var(--text-sm);
		max-width: 100%;
	}

	.seeding-button {
		cursor: pointer;
	}

	.seeding-grid {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1fr) 110px minmax(0, 1fr);
	}

	.seeding-grid-pool {
		grid-template-columns: minmax(0, 1fr) var(--space-6) minmax(0, 1fr);
	}

	.seeding-connectors-wrap {
		display: contents;
	}

	.seeding-status {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-3);
		min-height: 20px;
		margin: var(--space-3) 0;
		font-size: var(--text-sm);
		color: var(--text-soft-contrast);
	}

	.seeding-link {
		background: none;
		border: none;
		padding: 0;
		font-family: inherit;
		font-size: var(--text-sm);
		color: var(--link-default);
		text-decoration: underline;
		cursor: pointer;
	}

	.seeding-link:hover {
		color: var(--link-hover);
	}

	.seeding-problems {
		margin: var(--space-2) 0 0;
		padding-left: var(--space-5);
		font-size: var(--text-sm);
		color: var(--color-loss);
	}

	.seeding-advanced {
		margin-top: var(--space-4);
		font-size: var(--text-sm);
	}

	.seeding-advanced summary {
		cursor: pointer;
		font-weight: 600;
	}

	.seeding-sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	@media (max-width: 768px) {
		.seeding-grid,
		.seeding-grid-pool {
			grid-template-columns: 1fr;
			row-gap: var(--space-5);
		}

		.seeding-gutter,
		.seeding-connectors-wrap {
			display: none;
		}
	}
</style>
