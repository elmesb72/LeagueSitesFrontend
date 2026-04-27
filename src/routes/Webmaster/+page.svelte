<script lang="ts">
	import './+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { SiteEvent } from './+page';
	import ErrorsOverTimeChart from '../../components/ErrorsOverTimeChart.svelte';
	import EventsPerDayChart from '../../components/EventsPerDayChart.svelte';
	import TopErrorSourcesChart from '../../components/TopErrorSourcesChart.svelte';

	let { data } = $props();
	const shortName = $derived(data.siteConfig?.shortName ?? '');
	const events = $derived(data.events ?? []);
	const status = $derived(data.status);

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
		}
	});
</script>

<svelte:head>
	<title>{shortName} » Site Administration</title>
</svelte:head>

{#if data.authorized}
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
{/if}
