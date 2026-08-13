<script lang="ts">
	import type { SeedGroup, SeedingSourceOption } from '$lib/models/Tournament';

	let {
		seeding = $bindable(),
		sources,
		subject = 'bracket'
	}: {
		seeding: SeedGroup[];
		sources: SeedingSourceOption[];
		subject?: string;
	} = $props();

	// Simple mode covers the common case: one block of teams taken straight from a
	// standings table. Anything else (pools fed by knocked-out teams, brackets built
	// from several sources) needs the full rule list.
	let advanced = $state(seeding.length > 1);

	function sourceKey(option: { result: string; sourceType: string; sourceID: number }): string {
		return `${option.result}|${option.sourceType}|${option.sourceID}`;
	}

	function findSource(key: string): SeedingSourceOption | undefined {
		return sources.find((s) => sourceKey(s) === key);
	}

	function labelFor(rule: SeedGroup): string {
		return findSource(sourceKey(rule))?.label ?? 'Unknown source';
	}

	function availableFor(rule: SeedGroup): number {
		return findSource(sourceKey(rule))?.availableTeams ?? 0;
	}

	function changeSource(index: number, key: string): void {
		const source = findSource(key);
		if (!source) return;
		seeding[index] = {
			...seeding[index],
			result: source.result,
			sourceType: source.sourceType,
			sourceID: source.sourceID
		};
	}

	/** In simple mode the seed numbers follow the ranks, which is how the league records them. */
	function changeSimpleRange(from: number, to: number): void {
		if (!Number.isFinite(from) || !Number.isFinite(to)) return;
		seeding[0] = { ...seeding[0], outputStart: from, outputEnd: to, rankStart: from, rankEnd: to };
	}

	function addRule(): void {
		const lastSeed = Math.max(0, ...seeding.map((s) => s.outputEnd));
		const source = sources[0];
		seeding = [
			...seeding,
			{
				outputStart: lastSeed + 1,
				outputEnd: lastSeed + 1,
				result: source?.result ?? 'Standings',
				sourceType: source?.sourceType ?? 'Season',
				sourceID: source?.sourceID ?? 0,
				rankStart: 1,
				rankEnd: 1
			}
		];
		advanced = true;
	}

	function removeRule(index: number): void {
		seeding = seeding.filter((_, i) => i !== index);
	}

	const teamCount = $derived(
		seeding.reduce((total, rule) => total + (rule.outputEnd - rule.outputStart + 1), 0)
	);

	const problems = $derived(collectProblems(seeding));

	function collectProblems(rules: SeedGroup[]): string[] {
		const found: string[] = [];
		const claimed = new Map<number, number>();

		rules.forEach((rule, index) => {
			const outputCount = rule.outputEnd - rule.outputStart + 1;
			const rankCount = rule.rankEnd - rule.rankStart + 1;

			if (rule.outputEnd < rule.outputStart || rule.rankEnd < rule.rankStart) {
				found.push(`Rule ${index + 1}: the second number must not be lower than the first.`);
				return;
			}
			if (outputCount !== rankCount) {
				found.push(
					`Rule ${index + 1}: takes ${rankCount} team(s) but fills ${outputCount} seed(s).`
				);
			}
			const available = availableFor(rule);
			if (rule.rankEnd > available) {
				found.push(
					`Rule ${index + 1}: ${labelFor(rule)} can only supply ${available} team(s), ` +
						`so rank ${rule.rankEnd} is not available yet.`
				);
			}
			for (let seed = rule.outputStart; seed <= rule.outputEnd; seed++) {
				if (claimed.has(seed)) {
					found.push(`Seed ${seed} is filled by more than one rule.`);
				}
				claimed.set(seed, index);
			}
		});

		return [...new Set(found)];
	}

	export function validationProblems(): string[] {
		return problems;
	}
</script>

<div class="seeding-editor">
	{#if !advanced && seeding.length === 1}
		<div class="seeding-simple">
			<label class="seeding-field">
				<span>Take the teams from</span>
				<select
					value={sourceKey(seeding[0])}
					onchange={(e) => changeSource(0, (e.currentTarget as HTMLSelectElement).value)}
				>
					{#each sources as source (sourceKey(source))}
						<option value={sourceKey(source)}>{source.label}</option>
					{/each}
				</select>
			</label>

			<div class="seeding-field">
				<span>Ranked</span>
				<input
					type="number"
					min="1"
					class="seeding-number"
					value={seeding[0].rankStart}
					aria-label="First rank to include"
					onchange={(e) =>
						changeSimpleRange(
							(e.currentTarget as HTMLInputElement).valueAsNumber,
							seeding[0].rankEnd
						)}
				/>
				<span>through</span>
				<input
					type="number"
					min="1"
					class="seeding-number"
					value={seeding[0].rankEnd}
					aria-label="Last rank to include"
					onchange={(e) =>
						changeSimpleRange(
							seeding[0].rankStart,
							(e.currentTarget as HTMLInputElement).valueAsNumber
						)}
				/>
			</div>

			<p class="seeding-summary">
				{teamCount} team{teamCount === 1 ? '' : 's'} will enter this {subject}, seeded
				{seeding[0].outputStart} to {seeding[0].outputEnd}.
			</p>
		</div>
	{:else}
		<table class="seeding-table">
			<thead>
				<tr>
					<th>Seeds</th>
					<th>Come from</th>
					<th>Ranked</th>
					<th class="seeding-actions-col"></th>
				</tr>
			</thead>
			<tbody>
				{#each seeding as rule, index (index)}
					<tr>
						<td class="seeding-range">
							<input
								type="number"
								min="1"
								class="seeding-number"
								bind:value={rule.outputStart}
								aria-label="First seed filled by rule {index + 1}"
							/>
							<span>to</span>
							<input
								type="number"
								min="1"
								class="seeding-number"
								bind:value={rule.outputEnd}
								aria-label="Last seed filled by rule {index + 1}"
							/>
						</td>
						<td>
							<select
								value={sourceKey(rule)}
								aria-label="Source for rule {index + 1}"
								onchange={(e) => changeSource(index, (e.currentTarget as HTMLSelectElement).value)}
							>
								{#each sources as source (sourceKey(source))}
									<option value={sourceKey(source)}>{source.label}</option>
								{/each}
							</select>
							<span class="seeding-available">{availableFor(rule)} available</span>
						</td>
						<td class="seeding-range">
							<input
								type="number"
								min="1"
								class="seeding-number"
								bind:value={rule.rankStart}
								aria-label="First rank for rule {index + 1}"
							/>
							<span>to</span>
							<input
								type="number"
								min="1"
								class="seeding-number"
								bind:value={rule.rankEnd}
								aria-label="Last rank for rule {index + 1}"
							/>
						</td>
						<td class="seeding-actions-col">
							<button
								type="button"
								class="executive-delete"
								aria-label="Remove seeding rule {index + 1}"
								title="Remove this rule"
								disabled={seeding.length === 1}
								onclick={() => removeRule(index)}
							>
								<i class="fa-regular fa-trash-can"></i>
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<p class="seeding-summary">
			{teamCount} team{teamCount === 1 ? '' : 's'} will enter this {subject}.
		</p>
	{/if}

	<div class="seeding-controls">
		<button type="button" class="seeding-link" onclick={() => (advanced = !advanced)}>
			{advanced ? 'Use simple seeding' : 'More seeding options'}
		</button>
		{#if advanced}
			<button type="button" class="seeding-link" onclick={addRule}>Add another rule</button>
		{/if}
	</div>

	{#if problems.length > 0}
		<ul class="seeding-problems">
			{#each problems as problem}
				<li>{problem}</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.seeding-editor {
		margin-top: var(--space-2);
	}

	.seeding-simple {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.seeding-field {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.seeding-number {
		width: 68px;
		height: 32px;
		padding: 0 var(--space-2);
		border: var(--game-border);
		border-radius: var(--radius-sm);
		font-family: inherit;
		font-size: var(--text-sm);
	}

	.seeding-editor select {
		height: 32px;
		padding: 0 var(--space-2);
		border: var(--game-border);
		border-radius: var(--radius-sm);
		font-family: inherit;
		font-size: var(--text-sm);
		max-width: 100%;
	}

	.seeding-summary {
		color: var(--text-soft-contrast);
		font-size: var(--text-sm);
		font-style: italic;
	}

	.seeding-table {
		width: 100%;
		border: var(--standings-border);
	}

	.seeding-table th {
		background-color: var(--table-header-bg);
		color: var(--table-header-text);
		text-align: left;
		padding: 6px var(--space-2);
		font-size: var(--text-sm);
	}

	.seeding-table td {
		padding: 4px var(--space-2);
		vertical-align: middle;
	}

	.seeding-range {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		white-space: nowrap;
	}

	.seeding-available {
		display: block;
		font-size: var(--text-xs, 11px);
		color: var(--text-soft-contrast);
	}

	.seeding-actions-col {
		width: 40px;
		text-align: right;
	}

	.seeding-controls {
		display: flex;
		gap: var(--space-4);
		margin-top: var(--space-2);
	}

	.seeding-link {
		background: none;
		border: none;
		padding: 0;
		color: var(--link-default);
		cursor: pointer;
		font-family: inherit;
		font-size: var(--text-sm);
		text-decoration: underline;
	}

	.seeding-link:hover {
		color: var(--link-hover);
	}

	.seeding-problems {
		margin-top: var(--space-2);
		color: var(--color-loss);
		font-size: var(--text-sm);
		padding-left: var(--space-4);
	}
</style>
