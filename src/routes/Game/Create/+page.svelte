<script lang="ts">
	import '../[id]/Edit/+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import TeamLogoMedium from '../../../components/TeamLogoMedium.svelte';

	let { data } = $props();
	const createData = $derived(data.createData);
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	let seasonId = $state(0);
	let visitingTeamId = $state(0);
	let hostTeamId = $state(0);
	let locationId = $state(0);
	let statusId = $state(0);
	let gameDate = $state('');
	let gameTime = $state('19:00');
	let scoreVisitor = $state<string>('');
	let scoreHost = $state<string>('');
	let saving = $state(false);

	const selectedStatus = $derived(
		createData?.statuses.find((s) => s.id === statusId)?.name ?? ''
	);
	const scoresEnabled = $derived(
		selectedStatus === 'Played' || selectedStatus === 'Upcoming'
	);
	const visitorTeam = $derived(
		createData?.teams.find((t) => t.id === visitingTeamId) ?? null
	);
	const homeTeam = $derived(
		createData?.teams.find((t) => t.id === hostTeamId) ?? null
	);

	function initForm(): void {
		if (!createData) return;
		seasonId = createData.seasons[0]?.id ?? 0;
		visitingTeamId = createData.teams[0]?.id ?? 0;
		hostTeamId = createData.teams[1]?.id ?? createData.teams[0]?.id ?? 0;
		locationId = data.prefillLocationId || createData.locations[0]?.id || 0;
		statusId = createData.statuses.find((s) => s.name === 'Upcoming')?.id ?? createData.statuses[0]?.id ?? 0;
		gameDate = data.prefillDate || new Date().toISOString().split('T')[0];
	}

	function onScoreChange(): void {
		const playedStatus = createData?.statuses.find((s) => s.name === 'Played');
		if (playedStatus && scoreVisitor !== '' && scoreHost !== '') {
			statusId = playedStatus.id;
		}
	}

	function onStatusChange(): void {
		if (!scoresEnabled) {
			scoreVisitor = '';
			scoreHost = '';
		}
	}

	async function createGame(): Promise<void> {
		if (!createData || saving) return;

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

		const response = await fetch('/api/Game', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		saving = false;
		if (response.ok) {
			const created = await response.json();
			goto(`/Game/${created.id}`, { invalidateAll: true });
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
	<title>{shortName} » Create Game</title>
</svelte:head>

{#if createData}
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
						{#each createData.seasons as s}
							<option value={s.id}>{s.name}</option>
						{/each}
					</select>
				</div>
				<div class="game-edit-matchup">
					<select bind:value={visitingTeamId}>
						{#each createData.teams as t}
							<option value={t.id}>{t.fullName}</option>
						{/each}
					</select>
					<span>@</span>
					<select bind:value={hostTeamId}>
						{#each createData.teams as t}
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
						{#each createData.locations as l}
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
				{#each createData.statuses as status}
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
				<button class="game-edit-submit" onclick={createGame} disabled={saving}>
					{saving ? 'Creating...' : 'Create Game'}
				</button>
				<button class="game-edit-cancel" onclick={() => goto('/Schedule')}>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}
