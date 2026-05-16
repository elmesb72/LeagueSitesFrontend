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

	// Logo upload state
	let logoStatus: { hasLg: boolean; hasMd: boolean; hasSm: boolean; hasCustomSm: boolean; backupCount: number } | null = $state(null);
	let logoVersion = $state(0);
	let logoUploading = $state(false);
	let logoError = $state('');
	let showCustomSmWarning = $state(false);
	let pendingMainFile: File | null = $state(null);

	// Backup manager modal state
	let backupDialog: HTMLDialogElement | null = $state(null);
	let backupList: { slot: number; lastModifiedUtc: string; hasCustomSm: boolean }[] = $state([]);
	let backupBusy = $state(false);
	let backupError = $state('');

	function initEditForm(): void {
		if (!teamPage) return;
		editLocation = teamPage.team.location;
		editName = teamPage.team.name;
		editAbbreviation = teamPage.team.abbreviation;
		editBgColor = `#${teamPage.team.backgroundColor}`;
		editTextColor = `#${teamPage.team.color}`;
		showEditForm = true;
		loadLogoStatus();
	}

	async function loadLogoStatus(): Promise<void> {
		if (!teamPage) return;
		try {
			const res = await fetch(`/api/Teams/${teamPage.team.id}/Logo/Status`);
			if (res.ok) logoStatus = await res.json();
		} catch { /* non-critical */ }
	}

	function logoUrl(size: string): string {
		if (!teamPage) return '';
		return `/images/teams/${teamPage.team.id}-${size}.webp?v=${logoVersion}`;
	}

	async function handleMainLogoSelect(e: Event): Promise<void> {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		// If there's a custom small logo, warn before overwriting
		if (logoStatus?.hasCustomSm) {
			pendingMainFile = file;
			showCustomSmWarning = true;
			return;
		}

		await uploadMainLogo(file, false);
		input.value = '';
	}

	async function confirmMainUpload(keepCustomSmall: boolean): Promise<void> {
		showCustomSmWarning = false;
		if (!pendingMainFile) return;
		await uploadMainLogo(pendingMainFile, keepCustomSmall);
		pendingMainFile = null;
		// Reset the file input
		const input = document.getElementById('logo-main-input') as HTMLInputElement | null;
		if (input) input.value = '';
	}

	function cancelMainUpload(): void {
		showCustomSmWarning = false;
		pendingMainFile = null;
		const input = document.getElementById('logo-main-input') as HTMLInputElement | null;
		if (input) input.value = '';
	}

	async function uploadMainLogo(file: File, keepCustomSmall: boolean): Promise<void> {
		if (!teamPage || logoUploading) return;
		logoUploading = true;
		logoError = '';

		const formData = new FormData();
		formData.append('file', file);

		const qs = keepCustomSmall ? '?keepCustomSmall=true' : '';
		const res = await fetch(`/api/Teams/${teamPage.team.id}/Logo${qs}`, {
			method: 'POST',
			body: formData
		});

		logoUploading = false;
		if (res.ok) {
			logoVersion += 1;
			await loadLogoStatus();
		} else {
			logoError = await res.text();
		}
	}

	async function handleSmallLogoSelect(e: Event): Promise<void> {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || !teamPage) return;

		logoUploading = true;
		logoError = '';

		const formData = new FormData();
		formData.append('file', file);

		const res = await fetch(`/api/Teams/${teamPage.team.id}/Logo/Small`, {
			method: 'POST',
			body: formData
		});

		logoUploading = false;
		if (res.ok) {
			logoVersion += 1;
			await loadLogoStatus();
		} else {
			logoError = await res.text();
		}
		input.value = '';
	}

	async function deleteLogo(): Promise<void> {
		if (!teamPage || logoUploading) return;
		if (!confirm('Delete the current team logo? This cannot be undone.')) return;

		logoUploading = true;
		logoError = '';

		const res = await fetch(`/api/Teams/${teamPage.team.id}/Logo`, { method: 'DELETE' });

		logoUploading = false;
		if (res.ok) {
			logoVersion += 1;
			await loadLogoStatus();
		} else {
			logoError = await res.text();
		}
	}

	async function openBackupManager(): Promise<void> {
		if (!teamPage) return;
		await loadBackupList();
		backupDialog?.showModal();
	}

	function closeBackupManager(): void {
		backupDialog?.close();
		backupError = '';
	}

	async function loadBackupList(): Promise<void> {
		if (!teamPage) return;
		backupError = '';
		const res = await fetch(`/api/Teams/${teamPage.team.id}/Logo/Backups`);
		if (res.ok) {
			backupList = await res.json();
		} else {
			backupError = await res.text();
			backupList = [];
		}
	}

	function backupLogoUrl(slot: number, size: string): string {
		if (!teamPage) return '';
		return `/images/teams/${teamPage.team.id}-${size}-${slot}.webp?v=${logoVersion}`;
	}

	function formatRelative(iso: string): string {
		const then = new Date(iso).getTime();
		const now = Date.now();
		const diffMs = now - then;
		const minutes = Math.floor(diffMs / 60000);
		if (minutes < 1) return 'just now';
		if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
		const days = Math.floor(hours / 24);
		if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
		const months = Math.floor(days / 30);
		if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
		const years = Math.floor(days / 365);
		return `${years} year${years === 1 ? '' : 's'} ago`;
	}

	async function restoreBackup(slot: number): Promise<void> {
		if (!teamPage || backupBusy) return;
		backupBusy = true;
		backupError = '';

		const res = await fetch(
			`/api/Teams/${teamPage.team.id}/Logo/Backup/${slot}/Restore`,
			{ method: 'POST' }
		);

		backupBusy = false;
		if (res.ok) {
			logoVersion += 1;
			await Promise.all([loadLogoStatus(), loadBackupList()]);
		} else {
			backupError = await res.text();
		}
	}

	async function deleteBackup(slot: number): Promise<void> {
		if (!teamPage || backupBusy) return;
		if (!confirm(`Delete backup ${slot}? This cannot be undone.`)) return;

		backupBusy = true;
		backupError = '';

		const res = await fetch(
			`/api/Teams/${teamPage.team.id}/Logo/Backup/${slot}`,
			{ method: 'DELETE' }
		);

		backupBusy = false;
		if (res.ok) {
			logoVersion += 1;
			await Promise.all([loadLogoStatus(), loadBackupList()]);
		} else {
			backupError = await res.text();
		}
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
			<TeamRoster roster={teamPage.roster} canAdd={teamPage.canAddPlayer} canEditEntries={teamPage.canAddPlayer} canViewAdminIcons={teamPage.canViewAdminIcons} />

			{#if teamPage.isTeamMember && teamPage.inactiveRoster}
				<div class="subsection team-roster-inactive">
					<h1>Inactive Roster</h1>
					<TeamRoster roster={teamPage.inactiveRoster.substitutes} title="Substitutes" canAdd={teamPage.canAddPlayer} canEditEntries={teamPage.canAddPlayer} canViewAdminIcons={teamPage.canViewAdminIcons} />
					{#if teamPage.inactiveRoster.formerPlayers.length > 0}
						<TeamRoster roster={teamPage.inactiveRoster.formerPlayers} title="Former Players" canEditEntries={teamPage.canAddPlayer} canViewAdminIcons={teamPage.canViewAdminIcons} />
					{/if}
					<TeamRoster roster={teamPage.inactiveRoster.nonPlayerUsers} title="Non-Player Users" canAdd={teamPage.canAddPlayer} canEditEntries={teamPage.canAddPlayer} canViewAdminIcons={teamPage.canViewAdminIcons} />
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
		<dialog
			bind:this={backupDialog}
			class="team-logo-backup-dialog"
			onclose={() => (backupError = '')}
		>
			<header class="team-logo-backup-header">
				<h2>Backup Logos</h2>
				<button
					type="button"
					class="team-logo-backup-close"
					onclick={closeBackupManager}
					aria-label="Close"
				>
					<i class="fas fa-times"></i>
				</button>
			</header>
			<div class="team-logo-backup-body">
				{#if backupError}
					<p class="team-logo-error">{backupError}</p>
				{/if}
				{#if backupList.length === 0}
					<p class="team-logo-backup-empty">No backups stored.</p>
				{:else}
					<ul class="team-logo-backup-list">
						{#each backupList as backup (backup.slot)}
							<li class="team-logo-backup-item">
								<div class="team-logo-backup-thumbs">
									<div class="team-logo-backup-thumb team-logo-backup-thumb-lg">
										<img
											src={backupLogoUrl(backup.slot, 'lg')}
											alt="Backup {backup.slot}"
											onerror={(e) => {
												const img = e.currentTarget as HTMLImageElement;
												img.style.display = 'none';
											}}
										/>
									</div>
									{#if backup.hasCustomSm}
										<div class="team-logo-backup-thumb team-logo-backup-thumb-sm" title="Custom small logo">
											<img
												src={backupLogoUrl(backup.slot, 'sm')}
												alt="Custom small logo for backup {backup.slot}"
												onerror={(e) => {
													const img = e.currentTarget as HTMLImageElement;
													img.style.display = 'none';
												}}
											/>
										</div>
									{/if}
								</div>
								<div class="team-logo-backup-meta">
									<div class="team-logo-backup-title">
										Backup {backup.slot}
										{#if backup.hasCustomSm}
											<span class="team-logo-custom-badge" title="Has a custom small logo">custom</span>
										{/if}
									</div>
									<div class="team-logo-backup-date">{formatRelative(backup.lastModifiedUtc)}</div>
								</div>
								<div class="team-logo-backup-actions">
									<button
										type="button"
										class="team-logo-restore-btn"
										onclick={() => restoreBackup(backup.slot)}
										disabled={backupBusy}
									>
										<i class="fas fa-undo"></i> Restore
									</button>
									<button
										type="button"
										class="team-logo-delete-btn"
										onclick={() => deleteBackup(backup.slot)}
										disabled={backupBusy}
										aria-label="Delete backup {backup.slot}"
									>
										<i class="fas fa-trash"></i>
									</button>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
			<footer class="team-logo-backup-footer">
				<button type="button" class="team-edit-cancel" onclick={closeBackupManager}>Close</button>
			</footer>
		</dialog>

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
					<div class="team-edit-row">
						<div class="subsection team-edit-logos">
							<h2>Team Logo</h2>
							<div class="team-logo-upload-grid">
								<div class="team-logo-upload-slot">
									<label>Main Logo</label>
									<div class="team-logo-preview team-logo-preview-lg">
										{#if logoStatus?.hasLg}
											<img src={logoUrl('lg')} alt="Large logo" />
										{:else}
											<span class="team-logo-placeholder"><i class="fas fa-image"></i></span>
										{/if}
									</div>
									<div class="team-logo-upload-controls">
										<label class="team-logo-upload-btn" title="Upload main logo (resizes to all three sizes)">
											<i class="fas fa-upload"></i> Upload
											<input
												type="file"
												id="logo-main-input"
												accept="image/png,image/jpeg,image/webp"
												disabled={logoUploading}
												onchange={handleMainLogoSelect}
												hidden
											/>
										</label>
										{#if logoStatus?.hasLg}
											<button
												type="button"
												class="team-logo-delete-btn"
												onclick={deleteLogo}
												disabled={logoUploading}
												title="Delete current logo"
											>
												<i class="fas fa-trash"></i>
											</button>
										{/if}
									</div>
								</div>
								<div class="team-logo-upload-slot">
									<label>
										Small Logo
										{#if logoStatus?.hasCustomSm}
											<span class="team-logo-custom-badge" title="Custom shoulder-patch logo">custom</span>
										{/if}
									</label>
									<div class="team-logo-preview team-logo-preview-sm">
										{#if logoStatus?.hasSm}
											<img src={logoUrl('sm')} alt="Small logo" />
										{:else}
											<span class="team-logo-placeholder"><i class="fas fa-image"></i></span>
										{/if}
									</div>
									<div class="team-logo-upload-controls">
										<label class="team-logo-upload-btn" title="Upload a custom small logo (shoulder-patch style)">
											<i class="fas fa-upload"></i> Upload Small
											<input
												type="file"
												accept="image/png,image/jpeg,image/webp"
												disabled={logoUploading}
												onchange={handleSmallLogoSelect}
												hidden
											/>
										</label>
									</div>
								</div>
							</div>
							{#if logoStatus?.backupCount}
								<button type="button" class="team-logo-backup-link" onclick={openBackupManager}>
									<i class="fas fa-folder-open"></i>
									Manage {logoStatus.backupCount} backup{logoStatus.backupCount > 1 ? 's' : ''}
								</button>
							{/if}
							{#if logoError}
								<p class="team-logo-error">{logoError}</p>
							{/if}
							{#if showCustomSmWarning}
								<div class="team-logo-warning">
									<p>
										This team has a custom small logo (often a shoulder-patch style).
										Uploading a new main logo will replace it with an auto-resized version.
									</p>
									<div class="team-logo-warning-actions">
										<button type="button" onclick={() => confirmMainUpload(false)}>Replace all three sizes</button>
										<button type="button" onclick={() => confirmMainUpload(true)}>Keep custom small logo</button>
										<button type="button" onclick={cancelMainUpload}>Cancel</button>
									</div>
								</div>
							{/if}
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
