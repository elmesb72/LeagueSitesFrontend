<script lang="ts">
	import './+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
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
	let activeTab = $state<'monitor' | 'config'>('monitor');

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

	// Config tab state
	let configName = $state('');
	let configShortName = $state('');
	let configAboutBlurb = $state('');
	let configNewsMaxAgeDays = $state(30);
	let configNewsMinItems = $state(3);
	let configExecutives = $state<[string, string][]>([]);
	let configSocials = $state<[string, string][]>([]);
	let configLinks = $state<[string, string][]>([]);
	let configInformation = $state<[string, string][]>([]);
	let configHistory = $state<SiteHistoryEntry[]>([]);
	let configSaving = $state(false);
	let configSaved = $state(false);

	function initConfigForm(cfg: SiteConfigEdit) {
		configName = cfg.name;
		configShortName = cfg.shortName;
		configAboutBlurb = cfg.home.aboutBlurb;
		configNewsMaxAgeDays = cfg.home.newsMaxAgeDays;
		configNewsMinItems = cfg.home.newsMinItems;
		configExecutives = Object.entries(cfg.home.executives);
		configSocials = Object.entries(cfg.home.socials);
		configLinks = Object.entries(cfg.home.links);
		configInformation = Object.entries(cfg.home.information);
		configHistory = [...cfg.history];
	}

	function addRow(list: [string, string][], setter: (v: [string, string][]) => void) {
		setter([...list, ['', '']]);
	}

	function removeRow(list: [string, string][], index: number, setter: (v: [string, string][]) => void) {
		setter(list.filter((_, i) => i !== index));
	}

	function addHistoryRow() {
		configHistory = [...configHistory, { year: new Date().getFullYear(), result: '' }];
	}

	function removeHistoryRow(index: number) {
		configHistory = configHistory.filter((_, i) => i !== index);
	}

	async function saveConfig(): Promise<void> {
		if (configSaving) return;
		if (!configName.trim() || !configShortName.trim()) {
			alert('Site name and short name are required.');
			return;
		}

		configSaving = true;
		configSaved = false;

		const home: SiteHomeConfigEdit = {
			aboutBlurb: configAboutBlurb,
			newsMaxAgeDays: configNewsMaxAgeDays,
			newsMinItems: configNewsMinItems,
			executives: Object.fromEntries(configExecutives.filter(([k]) => k.trim())),
			socials: Object.fromEntries(configSocials.filter(([k]) => k.trim())),
			links: Object.fromEntries(configLinks.filter(([k]) => k.trim())),
			information: Object.fromEntries(configInformation.filter(([k]) => k.trim()))
		};

		const body = {
			name: configName.trim(),
			shortName: configShortName.trim(),
			home,
			history: configHistory.filter(h => h.result.trim())
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
					class:active={activeTab === 'monitor'}
					onclick={() => activeTab = 'monitor'}
				>
					Monitor
				</button>
				<button
					class="webmaster-tab"
					class:active={activeTab === 'config'}
					onclick={() => activeTab = 'config'}
				>
					Site Config
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
						<label for="config-blurb">About Blurb (HTML supported)</label>
						<textarea id="config-blurb" bind:value={configAboutBlurb} disabled={configSaving} rows="4"></textarea>
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
					<p class="config-explanation">Displayed on the homepage sidebar.</p>
					{#each configExecutives as [key, value], i}
						<div class="config-kv-row">
							<input type="text" placeholder="Title" bind:value={configExecutives[i][0]} disabled={configSaving} />
							<input type="text" placeholder="Name" bind:value={configExecutives[i][1]} disabled={configSaving} />
							<button type="button" class="config-remove" onclick={() => removeRow(configExecutives, i, v => configExecutives = v)} title="Remove">
								<i class="fa-regular fa-trash-can"></i>
							</button>
						</div>
					{/each}
					<button type="button" class="config-add" onclick={() => addRow(configExecutives, v => configExecutives = v)}>+ Add executive</button>
				</div>
			</div>

			<div class="row">
				<div class="section webmaster-section">
					<h1>Social Links</h1>
					<p class="config-explanation">Empty URLs are hidden from the homepage.</p>
					{#each configSocials as [key, value], i}
						<div class="config-kv-row">
							<input type="text" placeholder="Platform" bind:value={configSocials[i][0]} disabled={configSaving} />
							<input type="text" placeholder="URL" bind:value={configSocials[i][1]} disabled={configSaving} />
							<button type="button" class="config-remove" onclick={() => removeRow(configSocials, i, v => configSocials = v)} title="Remove">
								<i class="fa-regular fa-trash-can"></i>
							</button>
						</div>
					{/each}
					<button type="button" class="config-add" onclick={() => addRow(configSocials, v => configSocials = v)}>+ Add social</button>
				</div>
			</div>

			<div class="row">
				<div class="section webmaster-section">
					<h1>External Links</h1>
					{#each configLinks as [key, value], i}
						<div class="config-kv-row">
							<input type="text" placeholder="Label" bind:value={configLinks[i][0]} disabled={configSaving} />
							<input type="text" placeholder="URL" bind:value={configLinks[i][1]} disabled={configSaving} />
							<button type="button" class="config-remove" onclick={() => removeRow(configLinks, i, v => configLinks = v)} title="Remove">
								<i class="fa-regular fa-trash-can"></i>
							</button>
						</div>
					{/each}
					<button type="button" class="config-add" onclick={() => addRow(configLinks, v => configLinks = v)}>+ Add link</button>
				</div>
			</div>

			<div class="row">
				<div class="section webmaster-section">
					<h1>Information Links</h1>
					<p class="config-explanation">Links to rules, forms, and other documents. Use /files/filename.pdf for files on the server.</p>
					{#each configInformation as [key, value], i}
						<div class="config-kv-row">
							<input type="text" placeholder="Label" bind:value={configInformation[i][0]} disabled={configSaving} />
							<input type="text" placeholder="URL or path" bind:value={configInformation[i][1]} disabled={configSaving} />
							<button type="button" class="config-remove" onclick={() => removeRow(configInformation, i, v => configInformation = v)} title="Remove">
								<i class="fa-regular fa-trash-can"></i>
							</button>
						</div>
					{/each}
					<button type="button" class="config-add" onclick={() => addRow(configInformation, v => configInformation = v)}>+ Add item</button>
				</div>
			</div>

			<div class="row">
				<div class="section webmaster-section">
					<h1>History Overrides</h1>
					<p class="config-explanation">Override or supplement the auto-generated history. Use for years without a DB season (e.g. cancelled years) or pre-database champions.</p>
					{#each configHistory as entry, i}
						<div class="config-kv-row">
							<input type="number" placeholder="Year" bind:value={configHistory[i].year} disabled={configSaving} class="config-input-short" />
							<input type="text" placeholder="Result (e.g. team name or 'No season')" bind:value={configHistory[i].result} disabled={configSaving} />
							<button type="button" class="config-remove" onclick={() => removeHistoryRow(i)} title="Remove">
								<i class="fa-regular fa-trash-can"></i>
							</button>
						</div>
					{/each}
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
