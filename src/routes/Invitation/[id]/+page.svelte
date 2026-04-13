<script lang="ts">
	import '../+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import TeamLogoSmall from '../../../components/TeamLogoSmall.svelte';
	import TagInput from '../../../components/TagInput.svelte';

	let { data } = $props();
	const invitation = $derived(data.invitation);
	const refData = $derived(data.refData);
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	let teamId = $state(0);
	let firstName = $state('');
	let lastName = $state('');
	let number = $state('');
	let statusId = $state(1);
	let emails = $state('');
	let emergencyContact = $state('');
	let isWebmaster = $state(false);
	let isExecutive = $state(false);
	let isManager = $state(false);
	let isScorer = $state(false);
	let isReporter = $state(false);
	let userExists = $state(false);
	let saving = $state(false);

	let takenNumbers: Record<string, string> = $state({});
	let permissions: Record<string, boolean> = $state({});

	function initForm(): void {
		if (!invitation) return;
		teamId = invitation.teamID ?? invitation.teamId ?? 0;
		statusId = invitation.statusID ?? invitation.statusId ?? 1;
		emergencyContact = invitation.emergencyContactInfo ?? '';

		if (invitation.player) {
			firstName = invitation.player.firstName;
			lastName = invitation.player.lastName;
			number = invitation.player.number ?? '';
		}

		if (invitation.user) {
			userExists = true;
			emails = invitation.user.userLogins?.map((ul: any) => ul.email).join(',') ?? '';
			isWebmaster = invitation.user.userRoles?.some((ur: any) => ur.role?.name === 'Webmaster') ?? false;
			isExecutive = invitation.user.userRoles?.some((ur: any) => ur.role?.name === 'Executive') ?? false;
		} else {
			emails = invitation.invitationEmails?.map((ie: any) => ie.email).join(',') ?? '';
		}

		isManager = invitation.invitationRoles?.some((ir: any) => ir.role?.name === 'Manager') ?? false;
		isScorer = invitation.invitationRoles?.some((ir: any) => ir.role?.name === 'Scorer') ?? false;
		isReporter = invitation.invitationRoles?.some((ir: any) => ir.role?.name === 'Reporter') ?? false;

		loadTeamData();
	}

	async function loadTeamData(): Promise<void> {
		if (!teamId) return;
		const [numbersRes, permsRes] = await Promise.all([
			fetch(`/api/Teams/${teamId}/Players${number ? `?exclude=${number}` : ''}`),
			fetch(`/api/User/Permissions/${teamId}`)
		]);
		takenNumbers = numbersRes.ok ? await numbersRes.json() : {};
		permissions = permsRes.ok ? await permsRes.json() : {};
	}

	function selectNumber(num: string): void {
		if (takenNumbers[num]) return;
		number = number === num ? '' : num;
	}

	function isNumberTaken(num: string): boolean {
		return num in takenNumbers;
	}

	async function updateInvitation(): Promise<void> {
		if (saving || !invitation) return;
		saving = true;

		const body = {
			teamID: teamId,
			firstName,
			lastName,
			number,
			statusID: statusId,
			emails,
			emergencyContactInfo: emergencyContact,
			isWebmaster,
			isExecutive,
			isManager,
			isScorer,
			isReporter,
			playerExists: !!(firstName && lastName) || !!invitation.player,
			userExists,
			isNewInvitation: false,
			invitationID: invitation.id
		};

		const response = await fetch(`/api/Invitation/${invitation.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		saving = false;
		if (response.ok) {
			const team = refData?.teams.find((t: any) => t.id === teamId);
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
	<title>{shortName} » Edit Invitation</title>
</svelte:head>

{#if invitation && refData}
	<div class="row">
		<div class="section invitation" style="width: 100%">
			<h1>Edit Invitation</h1>
			<div class="invitation-form">
				<div class="invitation-team-selector">
					<p>Select Team</p>
					<div class="team-selector">
						{#each refData.teams as team}
							<div
								class="team-selector-item"
								class:team-selected={team.id === teamId}
								class:team-disabled={true}
							>
								<TeamLogoSmall {team} />
							</div>
						{/each}
					</div>
				</div>

				<div class="invitation-form-main">
					<div class="invitation-form-player">
						<h2>Player</h2>
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
								<select id="status" bind:value={statusId} size={refData.statuses.length}>
									{#each refData.statuses as status}
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
							<TagInput bind:value={emails} disabled={userExists} />
							{#if userExists}
								<p class="invitation-note"><i>(Managed by existing user)</i></p>
							{/if}
						</div>
						<div class="invitation-field">
							<label for="emergency">Alternate Contact Info</label>
							<input type="text" id="emergency" bind:value={emergencyContact} />
						</div>
						<div class="invitation-roles">
							<p>Roles</p>
							<label>
								<input type="checkbox" bind:checked={isWebmaster}
									disabled={!permissions['Webmaster'] || !userExists} />
								Webmaster
							</label>
							<label>
								<input type="checkbox" bind:checked={isExecutive}
									disabled={!(permissions['Webmaster'] || permissions['Executive']) || !userExists} />
								Executive
							</label>
							<label>
								<input type="checkbox" bind:checked={isManager}
									disabled={!(permissions['Webmaster'] || permissions['Executive'] || permissions['Manager'])} />
								Manager
							</label>
							<label>
								<input type="checkbox" bind:checked={isScorer}
									disabled={!(permissions['Webmaster'] || permissions['Executive'] || permissions['Manager'] || permissions['Scorer'])} />
								Scorer
							</label>
							<label>
								<input type="checkbox" bind:checked={isReporter}
									disabled={!(permissions['Webmaster'] || permissions['Executive'] || permissions['Manager'] || permissions['Scorer'])} />
								Reporter
							</label>
						</div>
					</div>
				</div>

				<div class="invitation-actions">
					<button class="invitation-submit" onclick={updateInvitation} disabled={saving}>
						{saving ? 'Saving...' : 'Update'}
					</button>
					<button class="invitation-cancel" onclick={() => history.back()}>Cancel</button>
				</div>
			</div>
		</div>
	</div>
{/if}
