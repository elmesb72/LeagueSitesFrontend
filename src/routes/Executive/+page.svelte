<script lang="ts">
	import './+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import StandingsRulesEditor from '../../components/StandingsRulesEditor.svelte';
	import Datepicker from 'vanillajs-datepicker/Datepicker';
	import 'vanillajs-datepicker/css/datepicker.css';
	import { scheduleImportPreview, type ImportPreview } from '$lib/stores/scheduleImport';

	let { data } = $props();
	const dashboard = $derived(data.dashboard);
	const season = $derived(dashboard?.currentSeason);
	const playoffs = $derived(dashboard?.currentPlayoffs);
	const standingsRules = $derived(data.standingsRules);
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	// Tabs. The active tab is mirrored into ?tab= so views are shareable and
	// survive refresh; switching replaces the history entry rather than
	// stacking one per click.
	type Tab = 'season' | 'teams' | 'parks' | 'standings' | 'misc';
	const tabLabels: [Tab, string][] = [
		['season', 'Season'],
		['teams', 'Teams'],
		['parks', 'Parks'],
		['standings', 'Standings'],
		['misc', 'Miscellaneous']
	];

	function initialTab(): Tab {
		if (typeof window === 'undefined') return 'season';
		const requested = new URLSearchParams(window.location.search).get('tab');
		return tabLabels.some(([id]) => id === requested) ? (requested as Tab) : 'season';
	}

	let activeTab = $state<Tab>(initialTab());

	function switchTab(tab: Tab): void {
		activeTab = tab;
		const url = new URL(window.location.href);
		if (tab === 'season') url.searchParams.delete('tab');
		else url.searchParams.set('tab', tab);
		history.replaceState(history.state, '', url);
	}

	// Teams and parks accumulate over league history, so inactive rows are
	// collapsed behind an expander to keep the tables one screen tall.
	let showInactiveTeams = $state(false);
	let showInactiveParks = $state(false);

	const activeTeams = $derived(
		[...(dashboard?.teams ?? [])]
			.filter((t) => t.active)
			.sort((a, b) => a.fullName.localeCompare(b.fullName))
	);
	const inactiveTeams = $derived(
		[...(dashboard?.teams ?? [])]
			.filter((t) => !t.active)
			.sort((a, b) => a.fullName.localeCompare(b.fullName))
	);
	const visibleTeams = $derived(showInactiveTeams ? [...activeTeams, ...inactiveTeams] : activeTeams);

	const activeParks = $derived((dashboard?.locations ?? []).filter((l) => l.active));
	const inactiveParks = $derived((dashboard?.locations ?? []).filter((l) => !l.active));
	const visibleParks = $derived(showInactiveParks ? [...activeParks, ...inactiveParks] : activeParks);

	const progressPct = $derived(
		season && season.gamesScheduled > 0
			? (season.gamesPlayed / season.gamesScheduled) * 100
			: 0
	);

	async function toggleStatus(entity: string, id: number): Promise<void> {
		const response = await fetch(`/api/Executive/Status/${entity}/${id}`, { method: 'PATCH' });
		if (response.ok) {
			goto(window.location.pathname + window.location.search, { invalidateAll: true });
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
			goto(window.location.pathname + window.location.search, { invalidateAll: true });
		} else {
			alert(await response.text());
		}
	}

	async function deleteTeam(id: number, fullName: string): Promise<void> {
		if (!confirm(`Delete ${fullName}? This cannot be undone.`)) return;
		const response = await fetch(`/api/Teams/${id}`, { method: 'DELETE' });
		if (response.ok) {
			goto(window.location.pathname + window.location.search, { invalidateAll: true });
		} else {
			alert(await response.text());
		}
	}

	// Standings rules. The editor captures its initial values once and
	// exposes the current state via currentConfig()/validationProblems().
	let standingsEditor = $state<StandingsRulesEditor | null>(null);
	let savingRules = $state(false);
	let rulesSaved = $state(false);

	async function saveStandingsRules(): Promise<void> {
		if (!standingsEditor || savingRules) return;
		const problems = standingsEditor.validationProblems();
		if (problems.length > 0) {
			alert('Standings rules need attention:\n' + problems.join('\n'));
			return;
		}

		savingRules = true;
		rulesSaved = false;
		const response = await fetch('/api/Executive/StandingsRules', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(standingsEditor.currentConfig())
		});
		savingRules = false;
		if (response.ok) {
			rulesSaved = true;
			setTimeout(() => { rulesSaved = false; }, 3000);
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
			goto(window.location.pathname + window.location.search, { invalidateAll: true });
		} else {
			alert(await response.text());
		}
	}

	async function deleteLocation(id: number, name: string): Promise<void> {
		if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
		const response = await fetch(`/api/Locations/${id}`, { method: 'DELETE' });
		if (response.ok) {
			goto(window.location.pathname + window.location.search, { invalidateAll: true });
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
			<div class="executive-tabs">
				{#each tabLabels as [id, label] (id)}
					<button
						type="button"
						class="executive-tab"
						class:active={activeTab === id}
						onclick={() => switchTab(id)}
					>
						{label}
					</button>
				{/each}
			</div>
		</div>
	</div>

	{#if activeTab === 'season'}
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
					{#if season.tournaments && season.tournaments.length > 0}
						<ul>
							{#each season.tournaments as tournament}
								<li><a href="/Executive/Edit/Tournament/{tournament.id}">Manage mid-season tournament</a>
									{#if tournament.brackets.length > 0 || tournament.roundRobins.length > 0}
										<span class="executive-summary">({[...tournament.brackets, ...tournament.roundRobins].map((t) => t.name).join(', ')})</span>
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
					<ul>
						<li><a href="/Executive/Create/Tournament/{season.season.id}">Add mid-season tournament</a></li>
					</ul>

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
					<p class="executive-explanation">Set up the brackets, then schedule each round as the matchups become known.</p>
					<ul>
						{#each playoffs.tournaments as tournament}
							<li><a href="/Executive/Edit/Tournament/{tournament.id}">Manage {playoffs.season.year} playoffs</a>
								{#if tournament.brackets.length > 0 || tournament.roundRobins.length > 0}
									<span class="executive-summary">({[...tournament.brackets, ...tournament.roundRobins].map((t) => t.name).join(', ')})</span>
								{:else}
									<span class="executive-summary">(no brackets yet)</span>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	{:else if activeTab === 'teams'}
		<div class="row">
			<div class="section executive-section executive-league">
				<h1>Teams ({activeTeams.length} active)</h1>
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
						{#each visibleTeams as team (team.id)}
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
				{#if inactiveTeams.length > 0}
					<button
						type="button"
						class="executive-show-inactive"
						onclick={() => (showInactiveTeams = !showInactiveTeams)}
					>
						{showInactiveTeams ? 'Hide' : 'Show'} {inactiveTeams.length} inactive team{inactiveTeams.length === 1 ? '' : 's'}
					</button>
				{/if}
				<form class="executive-create-form" onsubmit={(e) => { e.preventDefault(); createTeam(); }}>
					<h3>Add a team</h3>
					<div class="executive-create-fields">
						<input type="text" placeholder="Location (e.g. Springfield)" bind:value={newTeamLocation} disabled={creatingTeam} />
						<input type="text" placeholder="Name (e.g. Isotopes)" bind:value={newTeamName} disabled={creatingTeam} />
						<input type="text" placeholder="Abbrev." maxlength="5" bind:value={newTeamAbbreviation} disabled={creatingTeam} class="executive-input-short" />
						<button type="submit" class="executive-action" disabled={creatingTeam}>Add team</button>
					</div>
				</form>
			</div>
		</div>
	{:else if activeTab === 'parks'}
		<div class="row">
			<div class="section executive-section executive-league">
				<h1>Parks ({activeParks.length} active)</h1>
				<p class="executive-explanation">Active parks appear on the Locations page and can be selected in drop-down lists. Deactivate parks that are not being used in the current season.</p>
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
						{#each visibleParks as location (location.id)}
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
				{#if inactiveParks.length > 0}
					<button
						type="button"
						class="executive-show-inactive"
						onclick={() => (showInactiveParks = !showInactiveParks)}
					>
						{showInactiveParks ? 'Hide' : 'Show'} {inactiveParks.length} inactive park{inactiveParks.length === 1 ? '' : 's'}
					</button>
				{/if}
				<form class="executive-create-form" onsubmit={(e) => { e.preventDefault(); createLocation(); }}>
					<h3>Add a location</h3>
					<div class="executive-create-fields">
						<input type="text" placeholder="City" bind:value={newLocationCity} disabled={creatingLocation} />
						<input type="text" placeholder="Short name (e.g. Springfield or Shelbyville - 3)" bind:value={newLocationName} disabled={creatingLocation} />
						<input type="text" placeholder="Park" bind:value={newLocationFormalName} disabled={creatingLocation} />
						<button type="submit" class="executive-action" disabled={creatingLocation}>Add location</button>
					</div>
				</form>
			</div>
		</div>
	{:else if activeTab === 'standings'}
		<div class="row">
			<div class="section executive-section executive-league">
				<h1>Standings Rules</h1>
				{#if standingsRules}
					<p class="executive-explanation">
						How teams are ranked. Changes apply everywhere a ranking is shown or
						used — the standings page, homepage, team records, and playoff
						seeding.
					</p>
					<StandingsRulesEditor
						bind:this={standingsEditor}
						initial={standingsRules.standings}
						comparators={standingsRules.comparators}
						disabled={savingRules}
					/>
					<button type="button" class="executive-action" onclick={saveStandingsRules} disabled={savingRules}>
						{savingRules ? 'Saving...' : 'Save standings rules'}
					</button>
					{#if rulesSaved}
						<span class="executive-saved-message">Saved!</span>
					{/if}
				{:else}
					<p>Could not load the standings rules. Refresh the page to try again.</p>
				{/if}
			</div>
		</div>
	{:else if activeTab === 'misc'}
		<div class="row">
			<div class="section executive-section executive-league">
				<h1>Miscellaneous</h1>
				<ul>
					<li><a href="/Executive/Raccoon">Recover deleted games</a></li>
				</ul>
			</div>
		</div>
	{/if}
{/if}
