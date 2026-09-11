<script lang="ts">
	// Left side of the seeding board: every place teams can come from, one group
	// per source, with resolved team names where the data allows it. In bracket
	// mode it also hosts the "Sitting out" target.
	import {
		assignmentId,
		type Assignment,
		type RankEntry,
		type SourceGroup
	} from '$lib/seeding/model';

	let {
		groups,
		mode,
		primaryKey,
		sittingOut,
		selected,
		seatOf,
		isMember,
		onChip,
		onDragStart,
		onSitOutSelected,
		onDropSitOut,
		onRestore,
		onAddAll
	}: {
		groups: SourceGroup[];
		mode: 'bracket' | 'pool';
		primaryKey: string;
		sittingOut: number[];
		selected: Assignment | null;
		/** Seed number the assignment currently holds, or null. */
		seatOf: (a: Assignment) => number | null;
		/** Pool mode: is this rank in the pool? */
		isMember: (a: Assignment) => boolean;
		onChip: (a: Assignment) => void;
		onDragStart: (a: Assignment, event: DragEvent) => void;
		onSitOutSelected: () => void;
		onDropSitOut: (a: Assignment) => void;
		onRestore: (rank: number) => void;
		onAddAll: (group: SourceGroup) => void;
	} = $props();

	let zoneOver = $state(false);

	const selectedIsPrimary = $derived(selected !== null && selected.sourceKey === primaryKey);

	function isSelected(a: Assignment): boolean {
		return selected !== null && selected.sourceKey === a.sourceKey && selected.rank === a.rank;
	}

	function isOut(group: SourceGroup, rank: number): boolean {
		return mode === 'bracket' && group.key === primaryKey && sittingOut.includes(rank);
	}

	function chipLabel(group: SourceGroup, entry: RankEntry): string {
		const a = { sourceKey: group.key, rank: entry.rank };
		const who = entry.team ? entry.team.fullName : 'team not yet known';
		if (mode === 'pool') {
			return `Rank ${entry.rank}, ${who}${isMember(a) ? ', in this pool. Press to remove it.' : '. Press to add it to the pool.'}`;
		}
		const seat = seatOf(a);
		const where = isOut(group, entry.rank)
			? ', sitting out'
			: seat !== null
				? `, seed ${seat}`
				: '';
		return `Rank ${entry.rank}, ${who}${where}. Press to select, then choose a seed.`;
	}

	function teamName(group: SourceGroup, rank: number): string {
		return group.ranks[rank - 1]?.team?.fullName ?? `${group.shortLabel} rank ${rank}`;
	}

	function primaryGroup(): SourceGroup | undefined {
		return groups.find((g) => g.key === primaryKey);
	}

	function handleDrop(event: DragEvent): void {
		event.preventDefault();
		zoneOver = false;
		const id = event.dataTransfer?.getData('text/plain');
		if (!id) return;
		const at = id.lastIndexOf('#');
		if (at < 0) return;
		onDropSitOut({ sourceKey: id.slice(0, at), rank: Number(id.slice(at + 1)) });
	}
</script>

<div class="seeding-sources">
	<p class="seeding-col-title">Where teams come from</p>

	{#each groups as group (group.key)}
		<section class="seeding-group" aria-label={group.option.label}>
			<h3 class="seeding-group-title">
				{group.option.label}
				{#if mode === 'bracket' && group.key === primaryKey}
					<span class="seeding-group-default">default</span>
				{/if}
			</h3>
			{#if group.note}
				<p class="seeding-group-note">{group.note}</p>
			{/if}
			{#if mode === 'pool'}
				<button type="button" class="seeding-link" onclick={() => onAddAll(group)}>
					Add all {group.ranks.length}
				</button>
			{/if}

			{#each group.ranks as entry (entry.rank)}
				{@const a = { sourceKey: group.key, rank: entry.rank }}
				{@const seat = mode === 'bracket' ? seatOf(a) : null}
				{@const out = isOut(group, entry.rank)}
				{@const member = mode === 'pool' && isMember(a)}
				<div class="seeding-chip-row" class:seeding-chip-row-out={out}>
					<button
						type="button"
						class="seeding-chip"
						class:seeding-chip-selected={isSelected(a)}
						class:seeding-chip-assigned={seat !== null || member}
						draggable="true"
						data-chip={assignmentId(a)}
						aria-pressed={mode === 'bracket' ? isSelected(a) : member}
						aria-label={chipLabel(group, entry)}
						onclick={() => onChip(a)}
						ondragstart={(e) => onDragStart(a, e)}
					>
						<span class="seeding-chip-rank">{entry.rank}</span>
						{#if entry.team}
							<!-- Full names on purpose: an admin list of ten teams can hold "U20" beside "Tavistock U20". -->
							<span class="seeding-chip-name">{entry.team.fullName}</span>
						{:else}
							<span class="seeding-chip-name seeding-chip-unresolved">Rank {entry.rank}</span>
						{/if}
						{#if seat !== null}
							<span class="seeding-chip-tag">&rarr; Seed {seat}</span>
						{/if}
						{#if out}
							<span class="seeding-chip-tag">sitting out</span>
						{/if}
						{#if member}
							<span class="seeding-chip-tag">in pool</span>
						{/if}
					</button>
					{#if out}
						<button
							type="button"
							class="seeding-link"
							aria-label="Bring {teamName(group, entry.rank)} back in"
							onclick={() => onRestore(entry.rank)}
						>
							restore
						</button>
					{/if}
				</div>
				{#if !entry.team && entry.resolvesWhen}
					<p class="seeding-chip-sub">{entry.resolvesWhen}</p>
				{/if}
			{/each}
		</section>
	{/each}

	{#if mode === 'bracket'}
		<!-- Drop target only; the keyboard path is the button inside. -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="seeding-sitout"
			class:seeding-sitout-over={zoneOver}
			data-zone="sitout"
			ondragover={(e) => {
				e.preventDefault();
				zoneOver = true;
			}}
			ondragleave={() => (zoneOver = false)}
			ondrop={handleDrop}
		>
			<p>
				<b>Sitting out</b> &mdash; drop a team here to take it out of the {mode}. Everyone below it
				moves up one seed.
			</p>
			{#if selectedIsPrimary && selected}
				<button type="button" class="seeding-link" onclick={onSitOutSelected}>
					Put {teamName(primaryGroup()!, selected.rank)} on the sitting-out list
				</button>
			{/if}
			{#if sittingOut.length > 0 && primaryGroup()}
				<ul>
					{#each sittingOut as rank (rank)}
						<li>{rank}. {teamName(primaryGroup()!, rank)}</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</div>

<style>
	.seeding-col-title {
		margin: 0 0 var(--space-2);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		color: var(--text-soft-contrast);
	}

	.seeding-group {
		margin-bottom: var(--space-5);
	}

	.seeding-group-title {
		margin: 0 0 var(--space-1);
		font-size: var(--text-sm);
		font-weight: 600;
	}

	.seeding-group-default {
		margin-left: var(--space-2);
		padding: 0 var(--space-2);
		border-radius: var(--radius-sm);
		background: var(--table-header-bg);
		color: var(--table-header-text);
		font-size: var(--text-xs);
		font-weight: 700;
		text-transform: uppercase;
	}

	.seeding-group-note {
		margin: 0 0 var(--space-2);
		font-size: var(--text-xs);
		font-style: italic;
		color: var(--text-soft-contrast);
	}

	.seeding-chip-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-1);
	}

	.seeding-chip {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		min-height: 32px;
		padding: 0 var(--space-2);
		border: var(--game-border);
		border-radius: var(--radius-sm);
		background: var(--surface-section);
		color: var(--text-default);
		font-family: inherit;
		font-size: var(--text-sm);
		text-align: left;
		cursor: grab;
	}

	.seeding-chip:focus-visible {
		outline: 2px solid var(--link-default);
		outline-offset: 1px;
	}

	.seeding-chip-selected {
		box-shadow: 0 0 0 2px var(--link-default) inset;
	}

	.seeding-chip-assigned {
		background: var(--surface-page);
	}

	.seeding-chip-rank {
		min-width: 20px;
		font-weight: 700;
		color: var(--text-soft-contrast);
	}

	.seeding-chip-name {
		flex: 1;
	}

	.seeding-chip-unresolved {
		color: var(--text-soft);
		font-style: italic;
	}

	.seeding-chip-tag {
		font-size: var(--text-xs);
		color: var(--text-soft-contrast);
		white-space: nowrap;
	}

	.seeding-chip-row-out .seeding-chip {
		background: transparent;
		border-style: dashed;
		color: var(--text-soft);
	}

	.seeding-chip-row-out .seeding-chip-name {
		text-decoration: line-through;
	}

	.seeding-chip-sub {
		margin: -2px 0 var(--space-2) 25px;
		font-size: var(--text-xs);
		font-style: italic;
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

	.seeding-sitout {
		margin-top: var(--space-4);
		padding: var(--space-3) var(--space-4);
		border: 2px dashed var(--color-grey-light);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		color: var(--text-soft-contrast);
	}

	.seeding-sitout p {
		margin: 0;
	}

	.seeding-sitout b {
		color: var(--text-default);
		font-weight: 600;
	}

	.seeding-sitout ul {
		margin: var(--space-2) 0 0;
		padding-left: var(--space-5);
	}

	.seeding-sitout-over {
		border-color: var(--link-default);
		background: var(--standings-hover-bg);
	}
</style>
