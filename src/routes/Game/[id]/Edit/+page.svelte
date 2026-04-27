<script lang="ts">
	import './+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import TeamLogoMedium from '../../../../components/TeamLogoMedium.svelte';

	let { data } = $props();
	const gameEdit = $derived(data.gameEdit);
	const game = $derived(gameEdit?.game);
	const editData = $derived(gameEdit?.editData);
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	// Form state
	let seasonId = $state(0);
	let visitingTeamId = $state(0);
	let hostTeamId = $state(0);
	let locationId = $state(0);
	let statusId = $state(0);
	let gameDate = $state('');
	let gameTime = $state('');
	let scoreVisitor = $state<string>('');
	let scoreHost = $state<string>('');
	let saving = $state(false);
	let previousStatusId = $state(0);

	const selectedStatus = $derived(
		editData?.statuses.find((s) => s.id === statusId)?.name ?? ''
	);
	const previousStatus = $derived(
		editData?.statuses.find((s) => s.id === previousStatusId)?.name ?? ''
	);
	const scoresEnabled = $derived(
		selectedStatus === 'Played' || selectedStatus === 'Upcoming'
	);
	const visitorTeam = $derived(
		editData?.teams.find((t) => t.id === visitingTeamId) ?? game?.visitingTeam ?? null
	);
	const homeTeam = $derived(
		editData?.teams.find((t) => t.id === hostTeamId) ?? game?.hostTeam ?? null
	);

	function initForm(): void {
		if (!game) return;
		seasonId = game.seasonId ?? game.season.id;
		visitingTeamId = game.visitingTeamId ?? game.visitingTeam.id;
		hostTeamId = game.hostTeamId ?? game.hostTeam.id;
		locationId = game.locationId ?? game.location.id;
		statusId = game.statusId ?? game.status.id;
		previousStatusId = statusId;
		const d = new Date(game.date);
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		gameDate = `${year}-${month}-${day}`;
		const hours = String(d.getHours()).padStart(2, '0');
		const minutes = String(d.getMinutes()).padStart(2, '0');
		gameTime = `${hours}:${minutes}`;
		scoreVisitor = game.scoreVisitor?.toString() ?? '';
		scoreHost = game.scoreHost?.toString() ?? '';
	}

	function onScoreChange(): void {
		// Auto-set status to Played when scores are entered
		const playedStatus = editData?.statuses.find((s) => s.name === 'Played');
		if (playedStatus && scoreVisitor !== '' && scoreHost !== '') {
			statusId = playedStatus.id;
		}
	}

	function onStatusChange(): void {
		// Warn if moving OFF Postponed on a game that was loaded as Postponed.
		// Only the persisted state matters — toggling around pre-save is fine.
		if (game?.status.name === 'Postponed' && previousStatus === 'Postponed' && selectedStatus !== 'Postponed') {
			const confirmed = confirm(
				'Heads up: scorers typically leave postponed games alone and create a new ' +
				'game record for the rescheduled date. Continue un-postponing this game?'
			);
			if (!confirmed) {
				statusId = previousStatusId;
				return;
			}
		}

		previousStatusId = statusId;

		if (!scoresEnabled) {
			scoreVisitor = '';
			scoreHost = '';
		}
	}

	async function saveGame(): Promise<void> {
		if (!game || saving) return;

		// Validate both scores are provided when status is Played
		if (selectedStatus === 'Played') {
			if (scoreVisitor === '' || scoreHost === '') {
				alert('Both scores must be entered for a played game.');
				return;
			}
		}

		saving = true;

		const dateTime = `${gameDate}T${gameTime}:00`;
		const body = {
			seasonID: seasonId,
			date: dateTime,
			hostTeamID: hostTeamId,
			visitingTeamID: visitingTeamId,
			locationID: locationId,
			statusID: statusId,
			scoreHost: scoresEnabled && scoreHost !== '' ? parseInt(scoreHost) : null,
			scoreVisitor: scoresEnabled && scoreVisitor !== '' ? parseInt(scoreVisitor) : null
		};

		const response = await fetch(`/api/Game/${game.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		saving = false;
		if (response.ok) {
			goto(`/Game/${game.id}`, { invalidateAll: true });
		} else {
			alert(await response.text());
		}
	}

	onMount(() => {
		if (data.redirect) {
			goto(data.redirect);
			return;
		}
		initForm();
	});
</script>

<svelte:head>
	<title>{shortName} » Edit Game</title>
</svelte:head>

{#if game && editData}
	<div class="row game-row">
		<div class="inner-row">
			<div class="section game-team">
				{#if visitorTeam}
					<TeamLogoMedium team={visitorTeam} />
				{/if}
			</div>
			<div class="section game-header">
				<div class="game-edit-field">
					<label for="season">Season</label>
					<select id="season" bind:value={seasonId}>
						{#each editData.seasons as s}
							<option value={s.id}>{s.name}</option>
						{/each}
					</select>
				</div>
				<div class="game-edit-matchup">
					<select bind:value={visitingTeamId}>
						{#each editData.teams as t}
							<option value={t.id}>{t.fullName}</option>
						{/each}
					</select>
					<span>@</span>
					<select bind:value={hostTeamId}>
						{#each editData.teams as t}
							<option value={t.id}>{t.fullName}</option>
						{/each}
					</select>
				</div>
				<div class="game-edit-field">
					<label for="date">Date</label>
					<input type="date" id="date" bind:value={gameDate} />
				</div>
				<div class="game-edit-field">
					<label for="time">Time</label>
					<input type="time" id="time" bind:value={gameTime} />
				</div>
				<div class="game-edit-field">
					<label for="location">Location</label>
					<select id="location" bind:value={locationId}>
						{#each editData.locations as l}
							<option value={l.id}>{l.name}</option>
						{/each}
					</select>
				</div>
			</div>
			<div class="section game-team">
				{#if homeTeam}
					<TeamLogoMedium team={homeTeam} />
				{/if}
			</div>
		</div>
		<div class="inner-row game-edit-scores">
			<div class="section game-team">
				<input
					type="number"
					min="0"
					placeholder="0"
					bind:value={scoreVisitor}
					disabled={!scoresEnabled}
					oninput={onScoreChange}
				/>
			</div>
			<div class="section game-header game-edit-statuses">
				{#each editData.statuses.filter((s) => s.name !== 'Deleted') as status}
					<label class="game-edit-status">
						<input
							type="radio"
							name="status"
							value={status.id}
							bind:group={statusId}
							onchange={onStatusChange}
						/>
						{status.name}
					</label>
				{/each}
			</div>
			<div class="section game-team">
				<input
					type="number"
					min="0"
					placeholder="0"
					bind:value={scoreHost}
					disabled={!scoresEnabled}
					oninput={onScoreChange}
				/>
			</div>
		</div>
		<div class="inner-row">
			<div class="section">
				<button class="game-edit-submit" onclick={saveGame} disabled={saving}>
					{saving ? 'Saving...' : 'Update'}
				</button>
				<button class="game-edit-cancel" onclick={() => goto(`/Game/${game.id}`)}>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}
