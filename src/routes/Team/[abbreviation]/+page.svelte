<script lang="ts">
	import './+page.css';
	import { goto } from '$app/navigation';
	import TeamHeader from '../../../components/TeamHeader.svelte';
	import TeamSchedule from '../../../components/TeamSchedule.svelte';
	import TeamRoster from '../../../components/TeamRoster.svelte';

	let { data } = $props();
	const teamPage = $derived(data.teamPage);
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	// Edit form state
	let editLocation = $state('');
	let editName = $state('');
	let editAbbreviation = $state('');
	let editBgColor = $state('#FFFFFF');
	let editTextColor = $state('#000000');
	let saving = $state(false);
	let showEditForm = $state(false);

	function initEditForm(): void {
		if (!teamPage) return;
		editLocation = teamPage.team.location;
		editName = teamPage.team.name;
		editAbbreviation = teamPage.team.abbreviation;
		editBgColor = `#${teamPage.team.backgroundColor}`;
		editTextColor = `#${teamPage.team.color}`;
		showEditForm = true;
	}

	async function saveTeam(): Promise<void> {
		if (!teamPage || saving) return;
		saving = true;

		const response = await fetch(`/api/Teams/${teamPage.team.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				location: editLocation,
				name: editName,
				abbreviation: editAbbreviation,
				backgroundColor: editBgColor.replace('#', ''),
				color: editTextColor.replace('#', '')
			})
		});

		saving = false;
		if (response.ok) {
			goto(`/Team/${editAbbreviation}`, { invalidateAll: true });
		} else {
			alert(await response.text());
		}
	}
</script>

<svelte:head>
	<title>{shortName} » {teamPage ? `${teamPage.team.location} ${teamPage.team.name}` : 'Team Not Found'}</title>
</svelte:head>

{#if teamPage}
	<div class="row">
		<TeamHeader team={teamPage.team} record={teamPage.record} managers={teamPage.managers} />
	</div>
	<div class="row team-main">
		<div class="section team-schedule">
			<h1>Schedule</h1>
			<div class="subsection">
				{#if teamPage.games.length > 0}
					<TeamSchedule games={teamPage.games} focusTeam={teamPage.team} />
				{:else}
					<p>No games scheduled yet.</p>
				{/if}
			</div>
		</div>
		<div class="section team-roster">
			<TeamRoster roster={teamPage.roster} canAdd={teamPage.canAddPlayer} canEditEntries={teamPage.canAddPlayer} />

			{#if teamPage.isTeamMember && teamPage.inactiveRoster}
				<div class="subsection team-roster-inactive">
					<h1>Inactive Roster</h1>
					<TeamRoster roster={teamPage.inactiveRoster.substitutes} title="Substitutes" canAdd={teamPage.canAddPlayer} canEditEntries={teamPage.canAddPlayer} />
					{#if teamPage.inactiveRoster.formerPlayers.length > 0}
						<TeamRoster roster={teamPage.inactiveRoster.formerPlayers} title="Former Players" canEditEntries={teamPage.canAddPlayer} />
					{/if}
					<TeamRoster roster={teamPage.inactiveRoster.nonPlayerUsers} title="Non-Player Users" canAdd={teamPage.canAddPlayer} canEditEntries={teamPage.canAddPlayer} />
				</div>
			{/if}
		</div>
	</div>

	{#if teamPage.isTeamMember}
		<div class="row team-stats">
			<div class="section" style="width: 100%">
				<h1>Stats</h1>
				<h2>Batting</h2>
				<div class="subsection">
					<i title="Coming Soon" class="fas fa-laptop-code"></i> Coming Soon
				</div>
				<h2>Pitching</h2>
				<div class="subsection">
					<i title="Coming Soon" class="fas fa-laptop-code"></i> Coming Soon
				</div>
			</div>
		</div>
	{/if}

	{#if teamPage.canEditTeam}
		{#if !showEditForm}
			<div class="row">
				<div class="section" style="width: 100%">
					<button class="team-edit-toggle" onclick={initEditForm}>
						<i class="fas fa-edit"></i> Edit Team Info
					</button>
				</div>
			</div>
		{:else}
			<div class="row team-edit">
				<div class="section" style="width: 100%">
					<h1>Edit Team Info</h1>
					<div class="team-edit-row">
						<div class="subsection team-edit-basic">
							<h2>Basic Details</h2>
							<div class="team-edit-fields">
								<div class="team-edit-field">
									<label for="edit-location">Location</label>
									<input type="text" id="edit-location" bind:value={editLocation} />
								</div>
								<div class="team-edit-field">
									<label for="edit-name">Name</label>
									<input type="text" id="edit-name" bind:value={editName} />
								</div>
								<div class="team-edit-field">
									<label for="edit-abbr">Abbreviation</label>
									<input type="text" id="edit-abbr" bind:value={editAbbreviation} />
								</div>
							</div>
						</div>
						<div class="subsection team-edit-colors">
							<h2>Customization</h2>
							<div class="team-edit-fields">
								<div class="team-edit-field">
									<label for="edit-bg">Background</label>
									<div class="team-edit-color-row">
										<input type="color" id="edit-bg" bind:value={editBgColor} />
										<span class="team-edit-color-hex">{editBgColor}</span>
									</div>
								</div>
								<div class="team-edit-field">
									<label for="edit-text">Text</label>
									<div class="team-edit-color-row">
										<input type="color" id="edit-text" bind:value={editTextColor} />
										<span class="team-edit-color-hex">{editTextColor}</span>
									</div>
								</div>
							</div>
							<div class="team-edit-preview" style="background-color: {editBgColor}; color: {editTextColor}; padding: var(--space-3); border-radius: var(--radius-sm); margin-top: var(--space-2);">
								Preview: {editLocation} {editName}
							</div>
						</div>
					</div>
					<div class="team-edit-actions">
						<button class="team-edit-submit" onclick={saveTeam} disabled={saving}>
							{saving ? 'Saving...' : 'Update'}
						</button>
						<button class="team-edit-cancel" onclick={() => showEditForm = false}>Cancel</button>
					</div>
				</div>
			</div>
		{/if}
	{/if}
{:else}
	<div class="row">
		<div class="section">
			<h1>Team Not Found</h1>
			<p>The team you're looking for doesn't exist or couldn't be loaded.</p>
		</div>
	</div>
{/if}
