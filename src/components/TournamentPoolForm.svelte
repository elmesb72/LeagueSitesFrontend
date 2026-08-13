<script lang="ts">
	import { goto } from '$app/navigation';
	import type {
		RoundRobinStructure,
		SeedGroup,
		TournamentReferenceData
	} from '$lib/models/Tournament';
	import TournamentSeedingEditor from './TournamentSeedingEditor.svelte';

	let {
		tournamentId,
		referenceData,
		existing = null,
		defaultSeeding = null
	}: {
		tournamentId: number;
		referenceData: TournamentReferenceData;
		existing?: RoundRobinStructure | null;
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

	// Captured once, on purpose: this is a form, so later prop changes must not
	// overwrite what the executive has typed.
	function initialValues() {
		return {
			name: existing?.name ?? '',
			historical: existing?.historical ?? false,
			seeding: initialSeeding()
		};
	}
	const initial = initialValues();

	let name = $state(initial.name);
	let historical = $state(initial.historical);
	let seeding = $state<SeedGroup[]>(initial.seeding);
	let saving = $state(false);
	let error = $state('');

	async function save(): Promise<void> {
		error = '';
		if (!name.trim()) {
			error = 'Give the pool a name.';
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
				body: JSON.stringify({ name: name.trim(), historical, seeding })
			}
		);
		saving = false;

		if (response.ok) {
			goto(`/Executive/Edit/Tournament/${tournamentId}`, { invalidateAll: true });
		} else {
			error = (await response.text()) || 'Could not save the pool.';
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
	<h2>What is this pool called?</h2>
	<input
		type="text"
		class="pool-text-input"
		placeholder="Pool name, like A Pool"
		bind:value={name}
		aria-label="Pool name"
	/>
	<label class="pool-check">
		<input type="checkbox" bind:checked={historical} />
		Show the winner of this pool as a champion on the league History page
	</label>

	<h2>Who plays in it?</h2>
	<p class="executive-explanation">
		Pools are often filled with teams knocked out of a bracket, which you can pick as the source
		below.
	</p>
	<TournamentSeedingEditor bind:seeding sources={referenceData.seedingSources} subject="pool" />

	{#if error}
		<p class="pool-error">{error}</p>
	{/if}

	<div class="pool-actions">
		<button type="button" class="executive-action" disabled={saving} onclick={save}>
			{saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create pool'}
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

	.pool-check {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-top: var(--space-3);
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
