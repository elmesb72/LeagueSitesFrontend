<script lang="ts">
	import './+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import TeamLogoSmall from '../../components/TeamLogoSmall.svelte';

	let { data } = $props();
	const profile = $derived(data.profile);
	const shortName = $derived(data.siteConfig?.shortName ?? '');
	const userName = $derived(data.user?.name ?? '');

	const userRoles = $derived(
		profile?.user.userRoles.map((ur) => ur.role?.name).filter(Boolean) ?? []
	);
	const isWebmaster = $derived(userRoles.includes('Webmaster'));
	const isExecutive = $derived(userRoles.includes('Executive'));
	const multipleTeams = $derived((profile?.user.invitations.length ?? 0) > 1);

	async function forgetLogin(id: number): Promise<void> {
		const response = await fetch(`/api/UserLogin/Delete/${id}`, { method: 'DELETE' });
		if (response.ok) {
			goto('/User', { invalidateAll: true });
		} else {
			const error = await response.text();
			alert(error);
		}
	}

	async function favouriteLogin(id: number): Promise<void> {
		const response = await fetch(`/api/UserLogin/Favourite/${id}`, { method: 'POST' });
		if (response.ok) {
			goto('/User', { invalidateAll: true });
		} else {
			const error = await response.text();
			alert(error);
		}
	}

	onMount(() => {
		if (data.redirect) {
			goto(data.redirect);
		}
	});
</script>

<svelte:head>
	<title>{shortName} » {userName}</title>
</svelte:head>

{#if data.error}
	<div class="row">
		<div class="section login-error">
			<h1>Error</h1>
			<p>{data.error}</p>
		</div>
	</div>
{/if}

{#if profile}
	<div class="row user-main">
		<div class="section user-invitations">
			<h1>Your Profile</h1>

			{#if isWebmaster}
				<div class="subsection user-role">
					<h2><i title="Webmaster" class="fas fa-tools header-icon"></i>Webmaster</h2>
					<ul>
						<li><a href="/Webmaster">Site Administration</a></li>
						<li><a href="/Executive">League Administration</a></li>
					</ul>
				</div>
			{/if}

			{#if isExecutive && !isWebmaster}
				<div class="subsection user-role">
					<h2><i title="League Executive" class="fas fa-user-tie header-icon"></i>League Executive</h2>
					<ul>
						<li><a href="/Executive">League Administration</a></li>
					</ul>
				</div>
			{/if}

			<div class="subsection">
				<h2>Team{multipleTeams ? 's' : ''}</h2>
				{#each profile.user.invitations as invitation}
					<div class="user-invitation">
						{#if invitation.team}
							<a class="user-invitation-link" href="/Team/{invitation.team.abbreviation}">
								<div><TeamLogoSmall team={invitation.team} /></div>
								<div class="user-invitation-link-name">
									{invitation.team.location} {invitation.team.name}
								</div>
							</a>
						{/if}
						{#if invitation.player}
							<a class="user-invitation-link" href="/Player/{invitation.player.shortCode}">
								<div><i class="fas fa-baseball-ball"></i></div>
								<div class="user-invitation-link-name">{invitation.player.name}</div>
							</a>
						{/if}
						{#if invitation.invitationRoles.length > 0}
							<div class="user-invitation-roles">
								{#if invitation.invitationRoles.some((ir) => ir.role?.name === 'Manager')}
									<i title="Manager" class="fas fa-users"></i>
								{:else if invitation.invitationRoles.some((ir) => ir.role?.name === 'Scorer')}
									<i title="Scorer" class="fas fa-clipboard-list"></i>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>

			{#if profile.hasDeletedNews}
				<div class="subsection">
					<h2>News</h2>
					<ul>
						<li><a href="/RecycleBin/News">View/restore deleted News posts</a></li>
					</ul>
				</div>
			{/if}
		</div>

		<div class="section user-logins">
			<h1>Authorization Providers</h1>
			<div class="subsection">
				<h2>Existing</h2>
				{#each [...profile.user.userLogins].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)) as login}
					<div class="user-login">
						<div class="user-login-source">
							<img src="/images/social/{login.loginSource?.source ?? 'Unknown'}.webp" alt="{login.loginSource?.source ?? 'Unknown'}" />
						</div>
						<div class="user-login-details">{login.name} ({login.email})</div>
						<div class="user-login-update">
							{#if login.isPrimary}
								<i title="Primary login" class="fas fa-star"></i>
							{:else}
								<button class="login-action" onclick={() => forgetLogin(login.id)} title="Forget connection">
									<i class="fas fa-trash-alt"></i>
								</button>
								<button class="login-action" onclick={() => favouriteLogin(login.id)} title="Make this connection primary">
									<i class="far fa-star"></i>
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
			{#if data.providers.length > 0}
				<div class="subsection">
					<h2>Add Other Accounts</h2>
					{#each data.providers as provider}
						<a class="oauth-provider-link" href={provider.url}>
							<div class="oauth-provider-image">
								<img src="/images/social/{provider.name}.webp" alt="{provider.name}" />
							</div>
							<div class="oauth-provider-text">Sign in with {provider.name}</div>
						</a>
					{/each}
				</div>
			{/if}
			<div class="subsection">
				<h2>Log Out</h2>
				<ul>
					<li><a href="/Logout">Click here to log out!</a></li>
				</ul>
			</div>
		</div>
	</div>
{/if}
