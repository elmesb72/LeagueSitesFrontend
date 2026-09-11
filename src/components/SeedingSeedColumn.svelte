<script lang="ts">
	// Right side of the seeding board. Brackets get one slot per seed, each with a
	// text tag saying how it relates to the default order. Pools get a single
	// unordered "In this pool" bin, because a pool's seed numbers do nothing.
	import type { Team } from '$lib/models/Team';
	import {
		assignmentId,
		parseAssignmentId,
		type Assignment,
		type LineState,
		type SeedSlot,
		type SourceGroup
	} from '$lib/seeding/model';

	let {
		mode,
		slots,
		states,
		teamFor,
		nameOf,
		shortLabelOf,
		selected,
		members,
		groups,
		onSlot,
		onDropSlot,
		onClear,
		onDragStart,
		onRemoveMember,
		onDropMember
	}: {
		mode: 'bracket' | 'pool';
		slots: SeedSlot[];
		states: LineState[];
		/** Team shown in a slot: the server's resolved team for untouched seeds, else the browser's. */
		teamFor: (slot: SeedSlot) => Team | null;
		nameOf: (a: Assignment) => string;
		shortLabelOf: (sourceKey: string) => string;
		selected: Assignment | null;
		members: Assignment[];
		groups: SourceGroup[];
		onSlot: (k: number) => void;
		onDropSlot: (a: Assignment, k: number) => void;
		onClear: (k: number) => void;
		onDragStart: (a: Assignment, event: DragEvent) => void;
		onRemoveMember: (a: Assignment) => void;
		onDropMember: (a: Assignment) => void;
	} = $props();

	let dragOver = $state<number | 'bin' | null>(null);

	const TAGS: Record<LineState, string> = {
		default: 'default',
		shifted: 'moved up',
		override: 'changed',
		other: 'from another source',
		empty: 'empty'
	};

	function tag(slot: SeedSlot, state: LineState): string {
		if (slot.orphan) return 'no matchup uses this seed';
		if (state === 'other' && slot.assignment)
			return `from ${shortLabelOf(slot.assignment.sourceKey)}`;
		return TAGS[state];
	}

	function isSelected(a: Assignment | null): boolean {
		return (
			a !== null &&
			selected !== null &&
			selected.sourceKey === a.sourceKey &&
			selected.rank === a.rank
		);
	}

	function slotLabel(slot: SeedSlot, state: LineState): string {
		const who = slot.assignment ? (teamFor(slot)?.name ?? nameOf(slot.assignment)) : 'empty';
		const action = selected
			? 'Press to place the selected team here.'
			: slot.assignment
				? 'Press to select this team.'
				: '';
		return `Seed ${slot.seed}: ${who}, ${tag(slot, state)}. ${action}`.trim();
	}

	function dropped(event: DragEvent): Assignment | null {
		event.preventDefault();
		dragOver = null;
		const id = event.dataTransfer?.getData('text/plain');
		return id ? parseAssignmentId(id) : null;
	}

	function membersOf(group: SourceGroup): Assignment[] {
		return members.filter((m) => m.sourceKey === group.key).sort((a, b) => a.rank - b.rank);
	}
</script>

{#if mode === 'bracket'}
	<div class="seeding-seeds">
		<p class="seeding-col-title">Bracket seeds</p>
		{#each slots as slot, k (slot.seed)}
			{@const state = states[k]}
			{@const team = slot.assignment ? teamFor(slot) : null}
			<!-- Drop target only; the keyboard path is the button inside. -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="seeding-slot seeding-slot-{state}"
				class:seeding-slot-orphan={slot.orphan}
				class:seeding-slot-over={dragOver === k}
				data-slot={k}
				ondragover={(e) => {
					e.preventDefault();
					dragOver = k;
				}}
				ondragleave={() => (dragOver = null)}
				ondrop={(e) => {
					const a = dropped(e);
					if (a) onDropSlot(a, k);
				}}
			>
				<button
					type="button"
					class="seeding-slot-target"
					class:seeding-slot-selected={isSelected(slot.assignment)}
					draggable={slot.assignment !== null}
					data-slot-chip={slot.assignment ? assignmentId(slot.assignment) : undefined}
					aria-label={slotLabel(slot, state)}
					onclick={() => onSlot(k)}
					ondragstart={(e) => slot.assignment && onDragStart(slot.assignment, e)}
				>
					<span class="seeding-slot-seed">{slot.seed}</span>
					{#if !slot.assignment}
						<span class="seeding-slot-who seeding-slot-placeholder">Drop a team here</span>
					{:else if team}
						<span class="seeding-slot-who">{team.name}</span>
					{:else}
						<span class="seeding-slot-who seeding-slot-unresolved">
							{nameOf(slot.assignment)}
							<span class="seeding-slot-warn">&middot; not yet known</span>
						</span>
					{/if}
					<span class="seeding-slot-tag">{tag(slot, state)}</span>
				</button>
				{#if slot.assignment}
					<button
						type="button"
						class="seeding-slot-clear"
						aria-label="Clear seed {slot.seed}"
						title="Clear this seed"
						onclick={() => onClear(k)}
					>
						&times;
					</button>
				{/if}
			</div>
		{/each}
	</div>
{:else}
	<!-- Drop target only; the chips on the left are the keyboard path. -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="seeding-bin"
		class:seeding-slot-over={dragOver === 'bin'}
		data-zone="pool"
		ondragover={(e) => {
			e.preventDefault();
			dragOver = 'bin';
		}}
		ondragleave={() => (dragOver = null)}
		ondrop={(e) => {
			const a = dropped(e);
			if (a) onDropMember(a);
		}}
	>
		<p class="seeding-col-title">In this pool ({members.length})</p>
		{#if members.length === 0}
			<p class="seeding-bin-empty">Tap teams on the left to add them, or drag them here.</p>
		{/if}
		{#each groups as group (group.key)}
			{@const inGroup = membersOf(group)}
			{#if inGroup.length > 0}
				<p class="seeding-bin-group">{group.option.label}</p>
				<ul class="seeding-bin-list">
					{#each inGroup as m (m.rank)}
						<li class="seeding-bin-item">
							<span class="seeding-slot-seed">{m.rank}</span>
							<span class="seeding-slot-who">{nameOf(m)}</span>
							<button
								type="button"
								class="seeding-slot-clear"
								aria-label="Remove {nameOf(m)} from the pool"
								onclick={() => onRemoveMember(m)}
							>
								&times;
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		{/each}
	</div>
{/if}

<style>
	.seeding-col-title {
		margin: 0 0 var(--space-2);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		color: var(--text-soft-contrast);
	}

	.seeding-slot {
		display: flex;
		align-items: stretch;
		margin-bottom: var(--space-2);
		border: var(--game-border);
		border-left: 4px solid var(--text-soft);
		border-radius: var(--radius-sm);
		background: var(--surface-section);
	}

	.seeding-slot-shifted {
		border-left-color: var(--color-olive);
	}

	.seeding-slot-override {
		border-left-color: var(--color-copper);
	}

	.seeding-slot-other {
		border-left-color: var(--color-tan);
	}

	.seeding-slot-empty {
		border-style: dashed;
		border-left-color: var(--color-grey-light);
	}

	.seeding-slot-orphan {
		opacity: 0.7;
	}

	.seeding-slot-over,
	.seeding-bin.seeding-slot-over {
		border-color: var(--link-default);
		background: var(--standings-hover-bg);
	}

	.seeding-slot-target {
		flex: 1;
		display: grid;
		grid-template-columns: 28px 1fr auto;
		align-items: center;
		gap: var(--space-2);
		min-height: 40px;
		padding: var(--space-1) var(--space-2);
		border: none;
		background: none;
		color: var(--text-default);
		font-family: inherit;
		font-size: var(--text-sm);
		text-align: left;
		cursor: pointer;
	}

	.seeding-slot-target:focus-visible {
		outline: 2px solid var(--link-default);
		outline-offset: 1px;
	}

	.seeding-slot-selected {
		box-shadow: 0 0 0 2px var(--link-default) inset;
	}

	.seeding-slot-seed {
		font-weight: 700;
		color: var(--text-soft-contrast);
	}

	.seeding-slot-placeholder {
		color: var(--text-soft);
		font-style: italic;
	}

	.seeding-slot-unresolved {
		color: var(--text-soft-contrast);
		font-style: italic;
	}

	.seeding-slot-warn {
		color: var(--color-copper);
	}

	.seeding-slot-tag {
		font-size: var(--text-xs);
		color: var(--text-soft-contrast);
		white-space: nowrap;
	}

	.seeding-slot-clear {
		border: none;
		background: none;
		padding: 0 var(--space-3);
		color: var(--text-soft);
		font-size: var(--text-lg);
		line-height: 1;
		cursor: pointer;
	}

	.seeding-slot-clear:hover {
		color: var(--color-loss);
	}

	.seeding-bin {
		min-height: 120px;
		padding: var(--space-3) var(--space-4);
		border: 2px dashed var(--color-grey-light);
		border-radius: var(--radius-md);
	}

	.seeding-bin-empty {
		margin: 0;
		font-size: var(--text-sm);
		font-style: italic;
		color: var(--text-soft);
	}

	.seeding-bin-group {
		margin: var(--space-3) 0 var(--space-1);
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--text-soft-contrast);
	}

	.seeding-bin-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.seeding-bin-item {
		display: grid;
		grid-template-columns: 28px 1fr auto;
		align-items: center;
		gap: var(--space-2);
		min-height: 32px;
		margin-bottom: var(--space-1);
		padding: 0 var(--space-2);
		border: var(--game-border);
		border-radius: var(--radius-sm);
		background: var(--surface-section);
		font-size: var(--text-sm);
	}
</style>
