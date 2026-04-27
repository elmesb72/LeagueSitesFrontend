<script lang="ts">
	import './+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { scheduleImportPreview } from '$lib/stores/scheduleImport';

	let { data } = $props();
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	let committing = $state(false);
	let errorMessage = $state('');

	const preview = $derived($scheduleImportPreview);

	const allTeamNames = $derived(
		preview
			? Array.from(
					new Set(
						Object.keys(preview.matchupMatrix).concat(
							Object.values(preview.matchupMatrix).flatMap((v) => Object.keys(v))
						)
					)
				).sort()
			: []
	);

	async function confirmImport() {
		if (!preview) return;
		if (preview.invalidRows > 0) {
			if (!confirm(`${preview.invalidRows} rows have warnings and will be skipped. Continue?`)) return;
		}

		committing = true;
		const games = preview.games
			.filter((g) => g.warnings.length === 0 && g.date && g.hostTeamID && g.visitingTeamID && g.locationID)
			.map((g) => ({
				date: g.date,
				hostTeamID: g.hostTeamID,
				visitingTeamID: g.visitingTeamID,
				locationID: g.locationID
			}));

		const response = await fetch('/api/Executive/Schedule/Import', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ seasonID: preview.seasonID, games })
		});

		committing = false;
		if (response.ok) {
			const result = await response.json();
			scheduleImportPreview.set(null);
			alert(`Imported ${result.count} games.`);
			goto('/Schedule');
		} else {
			errorMessage = (await response.text()) || 'Import failed.';
		}
	}

	function cancel() {
		scheduleImportPreview.set(null);
		goto('/Executive');
	}

	onMount(() => {
		if (data.redirect) {
			goto(data.redirect);
			return;
		}
		// If user navigated here directly without a preview, send them back
		if (!$scheduleImportPreview) {
			goto('/Executive');
		}
	});
</script>

<svelte:head>
	<title>{shortName} » Import Schedule</title>
</svelte:head>

{#if data.authorized && preview}
	<div class="row">
		<div class="section import-section">
			<h1>Import Schedule Preview</h1>

			<div class="import-summary">
				<div><strong>Total rows:</strong> {preview.totalRows}</div>
				<div><strong>Valid:</strong> <span class="valid">{preview.validRows}</span></div>
				<div><strong>With warnings:</strong> <span class="invalid">{preview.invalidRows}</span></div>
			</div>

			{#if preview.globalWarnings.length > 0}
				<div class="import-global-warnings">
					<h2>Warnings</h2>
					<ul>
						{#each preview.globalWarnings as w}<li>{w}</li>{/each}
					</ul>
				</div>
			{/if}

			{#if allTeamNames.length > 0}
				<h2>Host × Visitor Matrix</h2>
				<p class="import-instructions">Each cell shows the number of games where the row team hosts the column team.</p>
				<div class="matrix-wrapper">
					<table class="matrix">
						<thead>
							<tr>
								<th></th>
								{#each allTeamNames as t}<th>{t}</th>{/each}
								<th>Total</th>
							</tr>
						</thead>
						<tbody>
							{#each allTeamNames as host}
								{@const total = Object.values(preview.matchupMatrix[host] ?? {}).reduce((a, b) => a + b, 0)}
								<tr>
									<th>{host}</th>
									{#each allTeamNames as visitor}
										{@const count = preview.matchupMatrix[host]?.[visitor] ?? 0}
										<td class:zero={count === 0} class:diagonal={host === visitor}>
											{count === 0 ? '' : count}
										</td>
									{/each}
									<td class="total">{total}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}

			{#if preview.validRows > 0}
				<h2>Games</h2>
				<div class="import-games-wrapper">
					<table class="import-games">
						<thead>
							<tr>
								<th>Row</th>
								<th>Date/Time</th>
								<th>Host</th>
								<th>Visitor</th>
								<th>Location</th>
								<th>Warnings</th>
							</tr>
						</thead>
						<tbody>
							{#each preview.games as g}
								<tr class:invalid={g.warnings.length > 0}>
									<td>{g.rowNumber}</td>
									<td>{g.date ? new Date(g.date).toLocaleString() : `${g.dateRaw} ${g.timeRaw}`}</td>
									<td>{g.hostTeamName ?? `(${g.hostRaw})`}</td>
									<td>{g.visitingTeamName ?? `(${g.visitorRaw})`}</td>
									<td>{g.locationName ?? `(${g.locationRaw})`}</td>
									<td>
										{#if g.warnings.length > 0}
											<ul class="warning-list">
												{#each g.warnings as w}<li>{w}</li>{/each}
											</ul>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}

			{#if errorMessage}
				<p class="import-error">{errorMessage}</p>
			{/if}

			<div class="import-actions">
				<button class="executive-action" onclick={confirmImport} disabled={committing || preview.validRows === 0}>
					{committing ? 'Importing...' : `Confirm Import (${preview.validRows} games)`}
				</button>
				<button class="import-cancel" onclick={cancel}>Cancel</button>
			</div>
		</div>
	</div>
{/if}
