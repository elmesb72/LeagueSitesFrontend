<script lang="ts">
	import './+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import TeamLogoSmall from '../../components/TeamLogoSmall.svelte';
	import TagInput from '../../components/TagInput.svelte';

	let { data } = $props();
	const createData = $derived(data.createData);
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	let teamId = $state(0);
	let firstName = $state('');
	let lastName = $state('');
	let number = $state('');
	let statusId = $state(1);
	let emails = $state('');
	let emergencyContact = $state('');
	let isManager = $state(false);
	let isScorer = $state(false);
	let isReporter = $state(false);
	let saving = $state(false);

	// Taken numbers and permissions
	let takenNumbers: Record<string, string> = $state({});
	let permissions: Record<string, boolean> = $state({});

	function initForm(): void {
		if (!createData) return;
		teamId = createData.teams[0]?.id ?? 0;
		statusId = createData.statuses.find((s: any) => s.name === 'Active')?.id ?? 1;
		loadTeamData();
	}

	async function loadTeamData(): Promise<void> {
		if (!teamId || teamId === 0) return;
		const [numbersRes, permsRes] = await Promise.all([
			fetch(`/api/Teams/${teamId}/Players${number ? `?exclude=${number}` : ''}`),
			fetch(`/api/User/Permissions/${teamId}`)
		]);
		takenNumbers = numbersRes.ok ? await numbersRes.json() : {};
		permissions = permsRes.ok ? await permsRes.json() : {};
	}

	function selectTeam(id: number): void {
		if (teamId === id) {
			teamId = 0;
		} else {
			teamId = id;
			number = '';
		}
		loadTeamData();
	}

	function selectNumber(num: string): void {
		if (takenNumbers[num]) return;
		number = number === num ? '' : num;
	}

	function isNumberTaken(num: string): boolean {
		return num in takenNumbers;
	}

	async function createInvitation(): Promise<void> {
		if (saving || !teamId) return;
		if (!emails.trim()) {
			alert('At least one email address is required.');
			return;
		}
		saving = true;

		const body = {
			teamID: teamId,
			firstName,
			lastName,
			number,
			statusID: statusId,
			emails,
			emergencyContactInfo: emergencyContact,
			isManager,
			isScorer,
			isReporter,
			isWebmaster: false,
			isExecutive: false,
			playerExists: !!(firstName && lastName),
			userExists: false,
			isNewInvitation: true,
			invitationID: 0
		};

		const response = await fetch('/api/Invitation', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		saving = false;
		if (response.ok) {
			const team = createData?.teams.find((t: any) => t.id === teamId);
			goto(`/Team/${team?.abbreviation ?? ''}`, { invalidateAll: true });
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
	<title>{shortName} » New Invitation</title>
</svelte:head>

{#if createData}
	<div class="row">
		<div class="section invitation" style="width: 100%">
			<h1>New Invitation</h1>
			<div class="invitation-form">
				<div class="invitation-team-selector">
					<p>Select Team</p>
					<div class="team-selector">
						{#each createData.teams as team}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="team-selector-item"
								class:team-selected={team.id === teamId}
								onclick={() => selectTeam(team.id)}
							>
								<TeamLogoSmall {team} />
							</div>
						{/each}
					</div>
				</div>

				<div class="invitation-form-main">
					<div class="invitation-form-player">
						<h2>Player</h2>
						<p class="invitation-note"><i>Leave blank to create a non-player user.</i></p>
						<div class="invitation-form-row">
							<div class="invitation-field">
								<label for="firstName">First Name</label>
								<input type="text" id="firstName" bind:value={firstName} />
							</div>
							<div class="invitation-field">
								<label for="lastName">Last Name</label>
								<input type="text" id="lastName" bind:value={lastName} />
							</div>
						</div>
						<div class="invitation-form-row">
							<div class="invitation-field">
								<p>Number</p>
								<div class="number-selector">
									{#each Array.from({ length: 99 }, (_, i) => String(i + 1)) as num}
										<!-- svelte-ignore a11y_click_events_have_key_events -->
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div
											class="number-item"
											class:number-selected={number === num}
											class:number-taken={isNumberTaken(num)}
											title={takenNumbers[num] ?? ''}
											onclick={() => selectNumber(num)}
										>
											<i class="fas fa-tshirt"></i>
											<span class="number-label">{num}</span>
										</div>
									{/each}
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<!-- svelte-ignore a11y_no_static_element_interactions -->
									<div
										class="number-item"
										class:number-selected={number === '00'}
										class:number-taken={isNumberTaken('00')}
										title={takenNumbers['00'] ?? ''}
										onclick={() => selectNumber('00')}
									>
										<i class="fas fa-tshirt"></i>
										<span class="number-label">00</span>
									</div>
								</div>
							</div>
							<div class="invitation-field">
								<label for="status">Status</label>
								<select id="status" bind:value={statusId} size={createData.statuses.length}>
									{#each createData.statuses as status}
										<option value={status.id}>{status.name}</option>
									{/each}
								</select>
							</div>
						</div>
					</div>

					<div class="invitation-form-user">
						<h2>User</h2>
						<div class="invitation-field">
							<label>Emails</label>
							<TagInput bind:value={emails} />
						</div>
						<div class="invitation-field">
							<label for="emergency">Alternate Contact Info</label>
							<input type="text" id="emergency" bind:value={emergencyContact} />
						</div>
						<div class="invitation-roles">
							<p>Roles</p>
							<label>
								<input type="checkbox" bind:checked={isManager}
									disabled={!(permissions['Webmaster'] || permissions['Executive'] || permissions['Manager']) || !teamId} />
								Manager
							</label>
							<label>
								<input type="checkbox" bind:checked={isScorer}
									disabled={!(permissions['Webmaster'] || permissions['Executive'] || permissions['Manager'] || permissions['Scorer']) || !teamId} />
								Scorer
							</label>
							<label>
								<input type="checkbox" bind:checked={isReporter}
									disabled={!(permissions['Webmaster'] || permissions['Executive'] || permissions['Manager'] || permissions['Scorer']) || !teamId} />
								Reporter
							</label>
						</div>
					</div>
				</div>

				<div class="invitation-actions">
					<button class="invitation-submit" onclick={createInvitation} disabled={saving}>
						{saving ? 'Creating...' : 'Create'}
					</button>
					<button class="invitation-cancel" onclick={() => history.back()}>Cancel</button>
				</div>
			</div>
		</div>
	</div>
{/if}
