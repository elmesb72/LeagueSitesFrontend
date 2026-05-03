<script lang="ts">
	import './+page.css';
	import { goto } from '$app/navigation';
	import { onMount, untrack } from 'svelte';
	import { flip } from 'svelte/animate';
	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import EasyMDE from 'easymde';
	import 'easymde/dist/easymde.min.css';
	import type { SiteEvent, SiteConfigEdit, SiteHomeConfigEdit, SiteHistoryEntry } from './+page';
	import ErrorsOverTimeChart from '../../components/ErrorsOverTimeChart.svelte';
	import EventsPerDayChart from '../../components/EventsPerDayChart.svelte';
	import TopErrorSourcesChart from '../../components/TopErrorSourcesChart.svelte';
	import TrafficChart from '../../components/TrafficChart.svelte';

	let { data } = $props();
	const shortName = $derived(data.siteConfig?.shortName ?? '');
	const events = $derived(data.events ?? []);
	const status = $derived(data.status);

	// Tab state
	let activeTab = $state<'monitor' | 'config'>('config');

	// Monitor tab filters
	let typeFilter = $state('');
	let resourceFilter = $state('');
	let userFilter = $state('');
	let expandedId = $state<number | null>(null);

	const filteredEvents = $derived(events.filter((e: SiteEvent) => {
		if (typeFilter && e.type !== typeFilter) return false;
		if (resourceFilter && !e.resource.toLowerCase().includes(resourceFilter.toLowerCase())) return false;
		if (userFilter) {
			const u = userFilter.toLowerCase();
			const name = (e.userName ?? '').toLowerCase();
			const id = String(e.userID);
			if (!name.includes(u) && !id.includes(u)) return false;
		}
		return true;
	}));

	// Drag-and-drop config
	const flipDurationMs = 150;

	// Config tab row types — svelte-dnd-action requires each item to carry a
	// stable, unique `id`. We keep ids purely client-side and strip them
	// before saving.
	type KvRow = { id: string; key: string; value: string };
	type HistoryRow = { id: string; year: number; result: string };

	let rowIdCounter = 0;
	function nextRowId(): string {
		rowIdCounter += 1;
		return `row-${rowIdCounter}`;
	}

	function toKvRows(entries: [string, string][]): KvRow[] {
		return entries.map(([key, value]) => ({ id: nextRowId(), key, value }));
	}

	function toHistoryRows(entries: SiteHistoryEntry[]): HistoryRow[] {
		return entries.map((h) => ({ id: nextRowId(), year: h.year, result: h.result }));
	}

	function kvRowsToRecord(rows: KvRow[]): Record<string, string> {
		return Object.fromEntries(rows.filter((r) => r.key.trim()).map((r) => [r.key, r.value]));
	}

	// Config tab state
	let configName = $state('');
	let configShortName = $state('');
	let configAboutBlurb = $state('');
	let configNewsMaxAgeDays = $state(30);
	let configNewsMinItems = $state(3);
	let configExecutives = $state<KvRow[]>([]);
	let configSocials = $state<KvRow[]>([]);
	let configLinks = $state<KvRow[]>([]);
	let configInformation = $state<KvRow[]>([]);
	let configHistory = $state<HistoryRow[]>([]);
	let configFilesOnDisk = $state<Set<string>>(new Set());
	let configSaving = $state(false);
	let configSaved = $state(false);

	// About Blurb Markdown editor. The editor is created in onMount once
	// config data has loaded. When the user switches tabs the textarea is
	// torn out of the DOM, so we also react to activeTab to rebuild it.
	let aboutEditorEl: HTMLTextAreaElement | null = $state(null);
	let aboutEditor: EasyMDE | null = null;
	let configLoaded = $state(false);

	function createAboutEditor(): void {
		if (!aboutEditorEl || aboutEditor) return;
		// Read the current blurb without subscribing, so editor edits don't
		// feed back into a re-render loop.
		const initial = untrack(() => configAboutBlurb);
		aboutEditor = new EasyMDE({
			element: aboutEditorEl,
			initialValue: initial,
			toolbar: [
				'bold', 'italic', 'strikethrough', '|',
				'quote', 'unordered-list', 'ordered-list', '|',
				'link', 'image', '|',
				'undo', 'redo', '|',
				'guide'
			]
		});
	}

	function destroyAboutEditor(): void {
		if (!aboutEditor) return;
		// Persist the in-progress value back to the reactive state so it
		// survives tab switches and is picked up by saveConfig.
		configAboutBlurb = aboutEditor.value();
		aboutEditor.toTextArea();
		aboutEditor.cleanup();
		aboutEditor = null;
	}

	$effect(() => {
		// Wait until initConfigForm has populated configAboutBlurb before
		// creating the editor, so it picks up the real initial value.
		if (!configLoaded) return;
		if (aboutEditorEl) {
			createAboutEditor();
		} else {
			destroyAboutEditor();
		}
	});

	function initConfigForm(cfg: SiteConfigEdit) {
		configName = cfg.name;
		configShortName = cfg.shortName;
		configAboutBlurb = cfg.home.aboutBlurb;
		configNewsMaxAgeDays = cfg.home.newsMaxAgeDays;
		configNewsMinItems = cfg.home.newsMinItems;
		configExecutives = toKvRows(Object.entries(cfg.home.executives));
		configSocials = toKvRows(Object.entries(cfg.home.socials));
		configLinks = toKvRows(Object.entries(cfg.home.links));
		configInformation = toKvRows(Object.entries(cfg.home.information));
		configHistory = toHistoryRows(cfg.history);
		configFilesOnDisk = new Set(cfg.files);

		// Append ghost rows for any files on disk not already linked in
		// Information Links. These surface orphans so they can be labeled
		// or deleted.
		const linkedFiles = new Set(
			configInformation
				.map((r) => r.value)
				.filter((url) => url.startsWith('/files/'))
				.map((url) => url.slice('/files/'.length))
		);
		for (const filename of cfg.files) {
			if (!linkedFiles.has(filename)) {
				configInformation = [...configInformation, { id: nextRowId(), key: '', value: '/files/' + filename }];
			}
		}
	}

	function prettifyFilename(filename: string): string {
		// Strip extension, replace _/- with spaces, title-case words.
		const withoutExt = filename.replace(/\.[^.]+$/, '');
		return withoutExt
			.replace(/[_-]+/g, ' ')
			.replace(/\b\w/g, (c) => c.toUpperCase())
			.trim();
	}

	async function uploadInfoFile(fileInput: HTMLInputElement, rowIndex: number | null): Promise<void> {
		const file = fileInput.files?.[0];
		if (!file) return;

		const formData = new FormData();
		formData.append('file', file);

		const response = await fetch('/api/Site/Files', {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			alert(await response.text());
			fileInput.value = '';
			return;
		}

		const result = (await response.json()) as { filename: string; path: string };
		configFilesOnDisk = new Set([...configFilesOnDisk, result.filename]);

		if (rowIndex !== null) {
			// Replace an existing empty row with the uploaded file
			const existing = configInformation[rowIndex];
			const label = existing.key || prettifyFilename(result.filename);
			configInformation[rowIndex] = { ...existing, key: label, value: result.path };
			configInformation = [...configInformation];
		} else {
			// Append a fresh row
			configInformation = [
				...configInformation,
				{ id: nextRowId(), key: prettifyFilename(result.filename), value: result.path }
			];
		}

		fileInput.value = '';
	}

	async function deleteInfoFile(index: number): Promise<void> {
		const url = configInformation[index].value;
		if (!url.startsWith('/files/')) {
			// Not a file-backed row; just remove it locally
			configInformation = configInformation.filter((_, i) => i !== index);
			return;
		}

		const filename = url.slice('/files/'.length);
		const fileMissing = !configFilesOnDisk.has(filename);

		if (fileMissing) {
			// File is already gone — just remove the stale entry
			configInformation = configInformation.filter((_, i) => i !== index);
			return;
		}

		if (!confirm(`Delete file '${filename}'? This cannot be undone.`)) return;

		const response = await fetch(`/api/Site/Files/${encodeURIComponent(filename)}`, {
			method: 'DELETE'
		});

		if (!response.ok && response.status !== 404) {
			alert(await response.text());
			return;
		}

		configFilesOnDisk = new Set([...configFilesOnDisk].filter(f => f !== filename));
		configInformation = configInformation.filter((_, i) => i !== index);
	}

	function addKvRow(list: KvRow[], setter: (v: KvRow[]) => void) {
		setter([...list, { id: nextRowId(), key: '', value: '' }]);
	}

	function removeKvRow(list: KvRow[], index: number, setter: (v: KvRow[]) => void) {
		setter(list.filter((_, i) => i !== index));
	}

	function addHistoryRow() {
		configHistory = [
			...configHistory,
			{ id: nextRowId(), year: new Date().getFullYear(), result: '' }
		];
	}

	function removeHistoryRow(index: number) {
		configHistory = configHistory.filter((_, i) => i !== index);
	}

	// dnd-action event helpers. The library hands us a reordered array
	// (including a transient placeholder during drag) via e.detail.items.
	// We write it back to state on both `consider` (while dragging) and
	// `finalize` (on drop).
	function handleKvDnd(e: CustomEvent<DndEvent<KvRow>>, setter: (v: KvRow[]) => void) {
		setter(e.detail.items);
	}

	function handleHistoryDnd(e: CustomEvent<DndEvent<HistoryRow>>) {
		configHistory = e.detail.items;
	}

	async function saveConfig(): Promise<void> {
		if (configSaving) return;
		if (!configName.trim() || !configShortName.trim()) {
			alert('Site name and short name are required.');
			return;
		}

		configSaving = true;
		configSaved = false;

		const aboutBlurb = aboutEditor?.value() ?? configAboutBlurb;

		const home: SiteHomeConfigEdit = {
			aboutBlurb,
			newsMaxAgeDays: configNewsMaxAgeDays,
			newsMinItems: configNewsMinItems,
			executives: kvRowsToRecord(configExecutives),
			socials: kvRowsToRecord(configSocials),
			links: kvRowsToRecord(configLinks),
			information: kvRowsToRecord(configInformation)
		};

		const body = {
			name: configName.trim(),
			shortName: configShortName.trim(),
			home,
			history: configHistory
				.filter((h) => h.result.trim())
				.map(({ year, result }) => ({ year, result }))
		};

		const response = await fetch('/api/Site/Config', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		configSaving = false;
		if (response.ok) {
			configSaved = true;
			setTimeout(() => { configSaved = false; }, 3000);
		} else {
			alert(await response.text());
		}
	}

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleString('en-US', {
			year: 'numeric', month: 'short', day: 'numeric',
			hour: 'numeric', minute: '2-digit', second: '2-digit'
		});
	}

	function toggleDetails(id: number) {
		expandedId = expandedId === id ? null : id;
	}

	onMount(() => {
		if (data.redirect) {
			goto(data.redirect);
			return;
		}
		if (data.configEdit) {
			initConfigForm(data.configEdit);
			configLoaded = true;
		}
	});
</script>

<svelte:head>
	<title>{shortName} » Site Administration</title>
</svelte:head>

{#if data.authorized}
	<div class="row">
		<div class="section webmaster-section">
			<div class="webmaster-tabs">
				<button
					class="webmaster-tab"
					class:active={activeTab === 'config'}
					onclick={() => activeTab = 'config'}
				>
					Site Config
				</button>
				<button
					class="webmaster-tab"
					class:active={activeTab === 'monitor'}
					onclick={() => activeTab = 'monitor'}
				>
					Monitor
				</button>
			</div>
		</div>
	</div>

	{#if activeTab === 'monitor'}
		<!-- ===== MONITOR TAB ===== -->
		<div class="row">
			<div class="section webmaster-section">
				<h1>Site Status</h1>
				{#if !status}
					<p>Could not retrieve site status.</p>
				{:else}
					<div class="status-summary">
						{#if status.failedEndpoints?.length > 0}
							<div class="status-failures">
								<strong>Failed endpoints in last smoke test:</strong>
								<ul>
									{#each status.failedEndpoints as fe}
										<li>{fe}</li>
									{/each}
								</ul>
							</div>
						{:else}
							<p class="status-ok-line">All smoke test endpoints passed.</p>
						{/if}
						{#if status.lastDeploy}
							<p class="status-deploy">Last deploy: {formatDate(status.lastDeploy)}</p>
						{/if}
					</div>
				{/if}
				<div class="status-actions">
					<a href="/api/Database/Export" class="config-save" download>Export League DB</a>
				</div>
			</div>
		</div>

		<div class="row">
			<div class="section webmaster-section">
				<h1>Traffic</h1>
				<TrafficChart traffic={data.traffic ?? []} />
			</div>
		</div>

		<div class="row">
			<div class="section webmaster-section">
				<h1>Event Analytics</h1>
				<EventsPerDayChart {events} />
				<ErrorsOverTimeChart {events} />
				<TopErrorSourcesChart {events} />
			</div>
		</div>

		<div class="row">
			<div class="section webmaster-section">
				<h1>Event Log</h1>
				<div class="webmaster-filters">
					<label>
						Type
						<select bind:value={typeFilter}>
							<option value="">All</option>
							<option value="Information">Information</option>
							<option value="Update">Update</option>
							<option value="Error">Error</option>
						</select>
					</label>
					<label>
						Resource
						<input type="text" bind:value={resourceFilter} placeholder="e.g. /api/Game" />
					</label>
					<label>
						User
						<input type="text" bind:value={userFilter} placeholder="name or ID" />
					</label>
				</div>
				<p class="webmaster-summary">
					Showing {filteredEvents.length.toLocaleString()} of {events.length.toLocaleString()} loaded events
					{#if data.eventsTruncated}
						(truncated — total in DB: {data.eventsTotal.toLocaleString()})
					{/if}
				</p>
				{#if filteredEvents.length === 0}
					<p>No events match the current filters.</p>
				{:else}
					<table class="webmaster-events">
						<thead>
							<tr>
								<th>Date</th>
								<th>Type</th>
								<th>User</th>
								<th>Resource</th>
								<th>Summary</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredEvents as event (event.id)}
								<tr class="event-row event-{event.type.toLowerCase()}" onclick={() => toggleDetails(event.id)}>
									<td>{formatDate(event.date)}</td>
									<td><span class="event-type-badge">{event.type}</span></td>
									<td>{event.userName ?? (event.userID === -1 ? 'Unauthenticated' : `#${event.userID}`)}</td>
									<td><code>{event.resource}</code></td>
									<td>{event.summary}</td>
								</tr>
								{#if expandedId === event.id}
									<tr class="event-details-row">
										<td colspan="5">
											<pre>{event.description}</pre>
										</td>
									</tr>
								{/if}
							{/each}
						</tbody>
					</table>
				{/if}
			</div>
		</div>

	{:else if activeTab === 'config'}
		<!-- ===== CONFIG TAB ===== -->
		{#if !data.configEdit}
			<div class="row">
				<div class="section webmaster-section">
					<p>Could not load site configuration.</p>
				</div>
			</div>
		{:else}
			<div class="row">
				<div class="section webmaster-section">
					<h1>Site Identity</h1>
					<div class="config-field">
						<label for="config-name">Site Name</label>
						<input id="config-name" type="text" bind:value={configName} disabled={configSaving} />
					</div>
					<div class="config-field">
						<label for="config-shortname">Short Name</label>
						<input id="config-shortname" type="text" bind:value={configShortName} disabled={configSaving} class="config-input-short" />
					</div>
				</div>
			</div>

			<div class="row">
				<div class="section webmaster-section">
					<h1>Homepage Content</h1>
					<div class="config-field">
						<label for="config-blurb">About Blurb (Markdown)</label>
						<textarea id="config-blurb" bind:this={aboutEditorEl}></textarea>
					</div>
					<div class="config-field-row">
						<div class="config-field">
							<label for="config-newsdays">News max age (days)</label>
							<input id="config-newsdays" type="number" min="1" bind:value={configNewsMaxAgeDays} disabled={configSaving} class="config-input-short" />
						</div>
						<div class="config-field">
							<label for="config-newsmin">Minimum news items</label>
							<input id="config-newsmin" type="number" min="0" bind:value={configNewsMinItems} disabled={configSaving} class="config-input-short" />
						</div>
					</div>
				</div>
			</div>

			<div class="row">
				<div class="section webmaster-section">
					<h1>Executives</h1>
					<p class="config-explanation">Displayed on the homepage sidebar. Drag rows to reorder.</p>
					<div
						class="config-dnd-list"
						use:dndzone={{ items: configExecutives, flipDurationMs, dragDisabled: configSaving, dropTargetStyle: {} }}
						onconsider={(e) => handleKvDnd(e, (v) => (configExecutives = v))}
						onfinalize={(e) => handleKvDnd(e, (v) => (configExecutives = v))}
					>
						{#each configExecutives as row, i (row.id)}
							<div class="config-kv-row" animate:flip={{ duration: flipDurationMs }}>
								<span class="config-drag-handle" aria-hidden="true"><i class="fa-solid fa-grip-vertical"></i></span>
								<input type="text" placeholder="Title" bind:value={configExecutives[i].key} disabled={configSaving} />
								<input type="text" placeholder="Name" bind:value={configExecutives[i].value} disabled={configSaving} />
								<button type="button" class="config-remove" onclick={() => removeKvRow(configExecutives, i, (v) => (configExecutives = v))} title="Remove">
									<i class="fa-regular fa-trash-can"></i>
								</button>
							</div>
						{/each}
					</div>
					<button type="button" class="config-add" onclick={() => addKvRow(configExecutives, (v) => (configExecutives = v))}>+ Add executive</button>
				</div>
			</div>

			<div class="row">
				<div class="section webmaster-section">
					<h1>Social Links</h1>
					<p class="config-explanation">Empty URLs are hidden from the homepage. Drag rows to reorder.</p>
					<div
						class="config-dnd-list"
						use:dndzone={{ items: configSocials, flipDurationMs, dragDisabled: configSaving, dropTargetStyle: {} }}
						onconsider={(e) => handleKvDnd(e, (v) => (configSocials = v))}
						onfinalize={(e) => handleKvDnd(e, (v) => (configSocials = v))}
					>
						{#each configSocials as row, i (row.id)}
							<div class="config-kv-row" animate:flip={{ duration: flipDurationMs }}>
								<span class="config-drag-handle" aria-hidden="true"><i class="fa-solid fa-grip-vertical"></i></span>
								<input type="text" placeholder="Platform" bind:value={configSocials[i].key} disabled={configSaving} />
								<input type="text" placeholder="URL" bind:value={configSocials[i].value} disabled={configSaving} />
								<button type="button" class="config-remove" onclick={() => removeKvRow(configSocials, i, (v) => (configSocials = v))} title="Remove">
									<i class="fa-regular fa-trash-can"></i>
								</button>
							</div>
						{/each}
					</div>
					<button type="button" class="config-add" onclick={() => addKvRow(configSocials, (v) => (configSocials = v))}>+ Add social</button>
				</div>
			</div>

			<div class="row">
				<div class="section webmaster-section">
					<h1>External Links</h1>
					<p class="config-explanation">Drag rows to reorder.</p>
					<div
						class="config-dnd-list"
						use:dndzone={{ items: configLinks, flipDurationMs, dragDisabled: configSaving, dropTargetStyle: {} }}
						onconsider={(e) => handleKvDnd(e, (v) => (configLinks = v))}
						onfinalize={(e) => handleKvDnd(e, (v) => (configLinks = v))}
					>
						{#each configLinks as row, i (row.id)}
							<div class="config-kv-row" animate:flip={{ duration: flipDurationMs }}>
								<span class="config-drag-handle" aria-hidden="true"><i class="fa-solid fa-grip-vertical"></i></span>
								<input type="text" placeholder="Label" bind:value={configLinks[i].key} disabled={configSaving} />
								<input type="text" placeholder="URL" bind:value={configLinks[i].value} disabled={configSaving} />
								<button type="button" class="config-remove" onclick={() => removeKvRow(configLinks, i, (v) => (configLinks = v))} title="Remove">
									<i class="fa-regular fa-trash-can"></i>
								</button>
							</div>
						{/each}
					</div>
					<button type="button" class="config-add" onclick={() => addKvRow(configLinks, (v) => (configLinks = v))}>+ Add link</button>
				</div>
			</div>

			<div class="row">
				<div class="section webmaster-section">
					<h1>Information Links</h1>
					<p class="config-explanation">Links to rules, forms, and other documents. Upload a file or enter an external URL. Uploaded files are available at /files/&lt;name&gt;. Drag rows to reorder.</p>
					<div
						class="config-dnd-list"
						use:dndzone={{ items: configInformation, flipDurationMs, dragDisabled: configSaving, dropTargetStyle: {} }}
						onconsider={(e) => handleKvDnd(e, (v) => (configInformation = v))}
						onfinalize={(e) => handleKvDnd(e, (v) => (configInformation = v))}
					>
						{#each configInformation as row, i (row.id)}
							{@const isFileRow = row.value.startsWith('/files/')}
							{@const filename = isFileRow ? row.value.slice('/files/'.length) : ''}
							{@const fileMissing = isFileRow && !configFilesOnDisk.has(filename)}
							<div class="config-kv-row" class:config-row-missing={fileMissing} animate:flip={{ duration: flipDurationMs }}>
								<span class="config-drag-handle" aria-hidden="true"><i class="fa-solid fa-grip-vertical"></i></span>
								<input
									type="text"
									placeholder={isFileRow ? 'Label (blank = unlinked)' : 'Label'}
									bind:value={configInformation[i].key}
									disabled={configSaving}
								/>
								{#if isFileRow}
									{#if fileMissing}
										<span class="config-file-pill config-file-missing" title="File not found on server">
											<i class="fa-solid fa-triangle-exclamation"></i>
											{filename} (missing)
										</span>
									{:else}
										<a class="config-file-pill" href={row.value} target="_blank" rel="noopener" title="Open in new tab">
											<i class="fa-regular fa-file"></i>
											{filename}
										</a>
									{/if}
									<button
										type="button"
										class="config-remove"
										onclick={() => deleteInfoFile(i)}
										title={fileMissing ? 'Remove entry' : 'Delete file'}
										disabled={configSaving}
									>
										<i class="fa-regular fa-trash-can"></i>
									</button>
								{:else}
									<input
										type="text"
										placeholder="URL or path"
										bind:value={configInformation[i].value}
										disabled={configSaving}
									/>
									<button
										type="button"
										class="config-remove"
										onclick={() => removeKvRow(configInformation, i, (v) => (configInformation = v))}
										title="Remove"
										disabled={configSaving}
									>
										<i class="fa-regular fa-trash-can"></i>
									</button>
								{/if}
							</div>
						{/each}
					</div>
					<div class="config-info-add-row">
						<button type="button" class="config-add" onclick={() => addKvRow(configInformation, (v) => (configInformation = v))} disabled={configSaving}>
							+ Add external link
						</button>
						<label class="config-add config-upload-label" class:disabled={configSaving}>
							<i class="fa-regular fa-file-arrow-up"></i> Upload file
							<input
								type="file"
								disabled={configSaving}
								onchange={(e) => uploadInfoFile(e.currentTarget as HTMLInputElement, null)}
							/>
						</label>
					</div>
				</div>
			</div>

			<div class="row">
				<div class="section webmaster-section">
					<h1>History Overrides</h1>
					<p class="config-explanation">Override or supplement the auto-generated history. Use for years without a DB season (e.g. cancelled years) or pre-database champions. Drag rows to reorder.</p>
					<div
						class="config-dnd-list"
						use:dndzone={{ items: configHistory, flipDurationMs, dragDisabled: configSaving, dropTargetStyle: {} }}
						onconsider={handleHistoryDnd}
						onfinalize={handleHistoryDnd}
					>
						{#each configHistory as entry, i (entry.id)}
							<div class="config-kv-row" animate:flip={{ duration: flipDurationMs }}>
								<span class="config-drag-handle" aria-hidden="true"><i class="fa-solid fa-grip-vertical"></i></span>
								<input type="number" placeholder="Year" bind:value={configHistory[i].year} disabled={configSaving} class="config-input-short" />
								<input type="text" placeholder="Result (e.g. team name or 'No season')" bind:value={configHistory[i].result} disabled={configSaving} />
								<button type="button" class="config-remove" onclick={() => removeHistoryRow(i)} title="Remove">
									<i class="fa-regular fa-trash-can"></i>
								</button>
							</div>
						{/each}
					</div>
					<button type="button" class="config-add" onclick={addHistoryRow}>+ Add year</button>
				</div>
			</div>

			<div class="row">
				<div class="section webmaster-section config-actions">
					<button class="config-save" onclick={saveConfig} disabled={configSaving}>
						{configSaving ? 'Saving...' : 'Save Configuration'}
					</button>
					{#if configSaved}
						<span class="config-saved-message">Saved!</span>
					{/if}
				</div>
			</div>
		{/if}
	{/if}
{/if}
