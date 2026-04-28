<script lang="ts">
	import './+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Datepicker from 'vanillajs-datepicker/Datepicker';
	import 'vanillajs-datepicker/css/datepicker.css';
	import { scheduleImportPreview, type ImportPreview } from '$lib/stores/scheduleImport';

	let { data } = $props();
	const dashboard = $derived(data.dashboard);
	const season = $derived(dashboard?.currentSeason);
	const playoffs = $derived(dashboard?.currentPlayoffs);
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	const progressPct = $derived(
		season && season.gamesScheduled > 0
			? (season.gamesPlayed / season.gamesScheduled) * 100
			: 0
	);

	async function toggleStatus(entity: string, id: number): Promise<void> {
		const response = await fetch(`/api/Executive/Status/${entity}/${id}`, { method: 'PATCH' });
		if (response.ok) {
			goto('/Executive', { invalidateAll: true });
		} else {
			alert(await response.text());
		}
	}

	async function createSeason(): Promise<void> {
		const response = await fetch('/api/Executive/Season', { method: 'POST' });
		if (response.ok) {
			goto('/Executive', { invalidateAll: true });
		} else {
			alert(await response.text());
		}
	}

	// New team form state
	let newTeamLocation = $state('');
	let newTeamName = $state('');
	let newTeamAbbreviation = $state('');
	let creatingTeam = $state(false);

	async function createTeam(): Promise<void> {
		if (!newTeamLocation.trim() || !newTeamName.trim() || !newTeamAbbreviation.trim()) {
			alert('Location, name, and abbreviation are required.');
			return;
		}
		creatingTeam = true;
		const response = await fetch('/api/Teams', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				location: newTeamLocation.trim(),
				name: newTeamName.trim(),
				abbreviation: newTeamAbbreviation.trim(),
				backgroundColor: 'FFFFFF',
				color: '000000'
			})
		});
		creatingTeam = false;
		if (response.ok) {
			newTeamLocation = '';
			newTeamName = '';
			newTeamAbbreviation = '';
			goto('/Executive', { invalidateAll: true });
		} else {
			alert(await response.text());
		}
	}

	async function deleteTeam(id: number, fullName: string): Promise<void> {
		if (!confirm(`Delete ${fullName}? This cannot be undone.`)) return;
		const response = await fetch(`/api/Teams/${id}`, { method: 'DELETE' });
		if (response.ok) {
			goto('/Executive', { invalidateAll: true });
		} else {
			alert(await response.text());
		}
	}

	// New location form state
	let newLocationCity = $state('');
	let newLocationName = $state('');
	let newLocationFormalName = $state('');
	let creatingLocation = $state(false);

	async function createLocation(): Promise<void> {
		if (!newLocationName.trim() || !newLocationCity.trim()) {
			alert('Name and city are required.');
			return;
		}
		creatingLocation = true;
		const response = await fetch('/api/Locations', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: newLocationName.trim(),
				formalName: newLocationFormalName.trim() || null,
				city: newLocationCity.trim(),
				address: null,
				mapsPlaceID: null
			})
		});
		creatingLocation = false;
		if (response.ok) {
			newLocationCity = '';
			newLocationName = '';
			newLocationFormalName = '';
			goto('/Executive', { invalidateAll: true });
		} else {
			alert(await response.text());
		}
	}

	async function deleteLocation(id: number, name: string): Promise<void> {
		if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
		const response = await fetch(`/api/Locations/${id}`, { method: 'DELETE' });
		if (response.ok) {
			goto('/Executive', { invalidateAll: true });
		} else {
			alert(await response.text());
		}
	}

	let startDateEl = $state<HTMLDivElement>(undefined!);
	let startDatePicker: Datepicker | null = null;

	function toggleStartDatePicker(event: MouseEvent): void {
		const target = event.target as HTMLElement;
		if (startDatePicker) {
			if (target.closest('.datepicker')) return;
			startDateEl.removeEventListener('changeDate', handleStartDateChange);
			startDatePicker.destroy();
			startDatePicker = null;
		} else {
			startDatePicker = new Datepicker(startDateEl, {
				todayButton: true,
				todayHighlight: true,
				format: 'yyyy-mm-dd'
			});
			if (season) {
				startDatePicker.setDate(season.season.startDate.split('T')[0]);
			}
			startDateEl.addEventListener('changeDate', handleStartDateChange);
		}
	}

	async function handleStartDateChange(): Promise<void> {
		if (!startDatePicker) return;
		const d = startDatePicker.getDate();
		if (!d) return;
		const formatted = d.toISOString().split('T')[0];
		const current = season?.season.startDate.split('T')[0];
		startDatePicker.destroy();
		startDatePicker = null;
		if (formatted === current) return;
		const response = await fetch('/api/Executive/Season/StartDate', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ startDate: formatted })
		});
		if (response.ok) {
			goto('/Executive', { invalidateAll: true });
		} else {
			alert(await response.text());
		}
	}

	onMount(() => {
		if (data.redirect) {
			goto(data.redirect);
		}
	});

	let importFileInput = $state<HTMLInputElement>(undefined!);
	let importing = $state(false);
	let importError = $state('');

	async function uploadSchedule() {
		const file = importFileInput.files?.[0];
		if (!file) return;

		importing = true;
		importError = '';

		const formData = new FormData();
		formData.append('file', file);

		const response = await fetch('/api/Executive/Schedule/Preview', {
			method: 'POST',
			body: formData
		});

		importing = false;
		if (response.ok) {
			const preview: ImportPreview = await response.json();
			scheduleImportPreview.set(preview);
			goto('/Executive/ImportSchedule');
		} else {
			importError = (await response.text()) || 'Failed to parse spreadsheet.';
			importFileInput.value = '';
		}
	}
</script>

<svelte:head>
	<title>{shortName} » League Administration</title>
</svelte:head>

{#if dashboard}
	<div class="row">
		<div class="section executive-section">
			<h1>{new Date().getFullYear()} Season</h1>

			<h2>Regular Season</h2>
			{#if season}
				<div class="executive-start-date">
					<span>Season start date:</span>
					<div class="executive-datepicker" bind:this={startDateEl}>
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<span class="executive-datepicker-value" onclick={toggleStartDatePicker}>
							{season.season.startDate.split('T')[0]} <i class="fa-regular fa-calendar"></i>
						</span>
					</div>
				</div>

				<div class="executive-import" class:disabled={season.gamesScheduled > 0}>
					<span>Import schedule:</span>
					<label class="executive-import-button" class:disabled={importing || season.gamesScheduled > 0}>
						<i class="fa-regular fa-file-excel"></i> Choose spreadsheet
						<input
							type="file"
							accept=".xlsx"
							bind:this={importFileInput}
							disabled={importing || season.gamesScheduled > 0}
							onchange={uploadSchedule}
						/>
					</label>
					{#if importing}
						<span class="executive-import-status">Parsing...</span>
					{/if}
					{#if importError}
						<span class="executive-import-error">{importError}</span>
					{/if}
				</div>

				<div class="season-progress">
					<div>Progress ({season.gamesScheduled} games):&nbsp;</div>
					<div class="season-progress-bar">
						{#if season.gamesScheduled > 0}
							{#if progressPct < 100}
								<div style="flex: 0 0 {progressPct.toFixed(1)}%; background-color: var(--surface-heading-primary);" title="Games played">
									{season.gamesPlayed} GP
								</div>
								<div style="flex: 1 0 0; color: var(--text-inverted); background-color: var(--surface-heading-secondary);" title="Games remaining">
									{season.gamesScheduled - season.gamesPlayed} GR
								</div>
							{:else}
								<div style="flex: 0 0 100%; background-color: var(--surface-heading-primary);" title="Games played">
									{season.gamesPlayed}/{season.gamesPlayed} GP
								</div>
							{/if}
						{:else}
							<div style="flex: 1 0 0; color: var(--text-inverted); background-color: var(--surface-heading-secondary);" title="No games">
								No games scheduled
							</div>
						{/if}
					</div>
				</div>

				<ul>
					<li><a href="/Schedule">Edit schedule</a></li>
				</ul>

				<h2>Tournaments</h2>
				<ul>
					<li><a href="/Executive/Create/Tournament/{season.season.id}">Add mid-season tournament</a></li>
				</ul>
				{#if season.tournaments && season.tournaments.length > 0}
					{#each season.tournaments as tournament}
						<ul>
							<li>Season Tournament {tournament.id}:
								<ul>
									{#each tournament.brackets as bracket}
										<li><a href="/Executive/Edit/TournamentBracket/{bracket.id}">Update Bracket <i>{bracket.name}</i></a></li>
									{/each}
									{#each tournament.roundRobins as rr}
										<li><a href="/Executive/Edit/TournamentRoundRobin/{rr.id}">Update Round Robin <i>{rr.name}</i></a></li>
									{/each}
								</ul>
							</li>
							<li><a href="/Executive/Create/TournamentBracket/{tournament.id}">Add Bracket</a></li>
							<li><a href="/Executive/Create/TournamentRoundRobin/{tournament.id}">Add Round Robin</a></li>
						</ul>
					{/each}
				{/if}

				{#if !playoffs}
					<ul>
						<li><a href="/Executive/Create/Playoffs/{season.season.id}">Set up year-end playoffs</a></li>
					</ul>
				{/if}
			{:else}
				<p>No regular season has been created for {new Date().getFullYear()} yet. Create one to start scheduling games.</p>
				<button class="executive-action" onclick={createSeason}>Create {new Date().getFullYear()} Regular Season</button>
			{/if}

			{#if playoffs}
				<h2>Playoffs</h2>
				{#each playoffs.tournaments as tournament}
					<ul>
						<li>Playoffs Tournament {tournament.id}:
							<ul>
								{#each tournament.brackets as bracket}
									<li><a href="/Executive/Edit/TournamentBracket/{bracket.id}">Update Bracket <i>{bracket.name}</i></a></li>
								{/each}
								{#each tournament.roundRobins as rr}
									<li><a href="/Executive/Edit/TournamentRoundRobin/{rr.id}">Update Round Robin <i>{rr.name}</i></a></li>
								{/each}
							</ul>
						</li>
						<li><a href="/Executive/Create/TournamentBracket/{tournament.id}">Add Bracket</a></li>
						<li><a href="/Executive/Create/TournamentRoundRobin/{tournament.id}">Add Round Robin</a></li>
					</ul>
				{/each}
			{/if}
		</div>
	</div>

	<div class="row">
		<div class="section executive-section executive-league">
			<h1>League Settings</h1>

			<h2>Teams ({dashboard.teams.filter((t) => t.active).length} active)</h2>
			<p class="executive-explanation">Active teams appear in the site header and can be selected in drop-down lists. Deactivate teams that are not playing in the current season.</p>
			<table class="executive-table">
				<thead>
					<tr>
						<th>Active</th>
						<th>Team</th>
						<th class="executive-actions-col"></th>
					</tr>
				</thead>
				<tbody>
					{#each [...dashboard.teams].sort((a, b) => {
						if (a.active !== b.active) return a.active ? -1 : 1;
						return a.fullName.localeCompare(b.fullName);
					}) as team (team.id)}
						<tr>
							<td class="executive-toggle">
								<input
									type="checkbox"
									checked={team.active}
									onchange={() => toggleStatus('team', team.id)}
									title="{team.active ? 'Deactivate' : 'Activate'} {team.fullName}"
								/>
							</td>
							<td><a href="/Team/{team.abbreviation}">{team.fullName}</a></td>
							<td class="executive-actions-col">
								<button
									type="button"
									class="executive-delete"
									title={team.canDelete ? `Delete ${team.fullName}` : `${team.fullName} has associated records and cannot be deleted`}
									aria-label="Delete {team.fullName}"
									disabled={!team.canDelete}
									onclick={() => deleteTeam(team.id, team.fullName)}
								>
									<i class="fa-regular fa-trash-can"></i>
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<form class="executive-create-form" onsubmit={(e) => { e.preventDefault(); createTeam(); }}>
				<h3>Add a team</h3>
				<div class="executive-create-fields">
					<input type="text" placeholder="Location (e.g. Springfield)" bind:value={newTeamLocation} disabled={creatingTeam} />
					<input type="text" placeholder="Name (e.g. Isotopes)" bind:value={newTeamName} disabled={creatingTeam} />
					<input type="text" placeholder="Abbrev." maxlength="5" bind:value={newTeamAbbreviation} disabled={creatingTeam} class="executive-input-short" />
					<button type="submit" class="executive-action" disabled={creatingTeam}>Add team</button>
				</div>
			</form>

			<h2>Locations ({dashboard.locations.filter((l) => l.active).length} active)</h2>
			<p class="executive-explanation">Active locations appear on the Locations page and can be selected in drop-down lists. Deactivate locations that are not being used in the current season.</p>
			<table class="executive-table">
				<thead>
					<tr>
						<th>Active</th>
						<th>Location</th>
						<th>Park</th>
						<th class="executive-actions-col"></th>
					</tr>
				</thead>
				<tbody>
					{#each dashboard.locations as location (location.id)}
						<tr>
							<td class="executive-toggle">
								<input
									type="checkbox"
									checked={location.active}
									onchange={() => toggleStatus('park', location.id)}
									title="{location.active ? 'Deactivate' : 'Activate'} {location.name}"
								/>
							</td>
							<td>{location.name}</td>
							<td>{location.formalName ?? ''}</td>
							<td class="executive-actions-col">
								<button
									type="button"
									class="executive-delete"
									title={location.canDelete ? `Delete ${location.name}` : `${location.name} has associated records and cannot be deleted`}
									aria-label="Delete {location.name}"
									disabled={!location.canDelete}
									onclick={() => deleteLocation(location.id, location.name)}
								>
									<i class="fa-regular fa-trash-can"></i>
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<form class="executive-create-form" onsubmit={(e) => { e.preventDefault(); createLocation(); }}>
				<h3>Add a location</h3>
				<div class="executive-create-fields">
					<input type="text" placeholder="City" bind:value={newLocationCity} disabled={creatingLocation} />
					<input type="text" placeholder="Location (e.g. St. Agatha or New Hamburg - 3)" bind:value={newLocationName} disabled={creatingLocation} />
					<input type="text" placeholder="Park" bind:value={newLocationFormalName} disabled={creatingLocation} />
					<button type="submit" class="executive-action" disabled={creatingLocation}>Add location</button>
				</div>
			</form>

			<h2>Miscellaneous</h2>
			<ul>
				<li><a href="/Executive/Raccoon">Recover deleted games</a></li>
			</ul>
		</div>
	</div>
{/if}
