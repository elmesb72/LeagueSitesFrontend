<script lang="ts">
	import './+page.css';
	import TeamLogoSmall from '../../../components/TeamLogoSmall.svelte';

	let { data } = $props();
	const playerData = $derived(data.playerData);
	const player = $derived(playerData?.player);
	const bio = $derived(player?.bio);
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	function calculateAge(birthdate: string): number {
		const birth = new Date(birthdate);
		const today = new Date();
		let age = today.getFullYear() - birth.getFullYear();
		if (birth > new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) {
			age--;
		}
		return age;
	}

	function formatBirthdate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{shortName} » {player?.name ?? 'Player'}</title>
</svelte:head>

{#if player}
	<div class="row player-row">
		<div class="section player-info">
			<h1>
				{#if player.number}
					<span class="player-number">{player.number}</span>
				{/if}
				<span>{player.name}</span>
			</h1>
			{#each player.invitations.filter((i) => i.team && !i.team.hidden) as invitation}
				{#if invitation.team}
					<div class="player-team">
						<div class="player-team-logo"><TeamLogoSmall team={invitation.team} /></div>
						<div class="player-team-name">
							<a href="/Team/{invitation.team.abbreviation}">{invitation.team.fullName}</a>
						</div>
					</div>
				{/if}
			{/each}
			<br />
			<img
				src="/images/players/{player.shortCode}-h.webp"
				alt="{player.name}"
				class="player-photo"
				onerror={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
			/>
			{#if bio}
				{#if bio.positions}<p><b>Position(s):</b> {bio.positions}</p>{/if}
				{#if bio.bats || bio.throws}
					<p>
						{#if bio.bats}<b>Bats:</b> {bio.bats}{/if}
						{#if bio.bats && bio.throws} &bull; {/if}
						{#if bio.throws}<b>Throws:</b> {bio.throws}{/if}
					</p>
				{/if}
				{#if bio.heightImperial && bio.weightImperial}
					<p>
						{Math.floor(bio.heightImperial / 12)}'{bio.heightImperial % 12}",
						{bio.weightImperial}lbs
						({bio.height}cm, {bio.weight}kg)
					</p>
				{/if}
				<br />
				<h2>
					Bio
					{#if player.socials.length > 0}
						<div class="player-socials">
							{#each player.socials as social}
								{#if social.platform}
									<a href="{social.platform.name === 'Twitter' ? 'https://twitter.com/' : ''}{social.account}" target="_blank" rel="noopener">
										<img src="/images/social/{social.platform.name}.webp" alt="{social.platform.name}" />
									</a>
								{/if}
							{/each}
						</div>
					{/if}
				</h2>
				{#if bio.from}<p>From: {bio.from}</p>{/if}
				{#if bio.birthdate}
					<p>Age: {calculateAge(bio.birthdate)}</p>
					<p>Born: {formatBirthdate(bio.birthdate)}</p>
				{/if}
				{#if bio.referredBy}
					<p>
						Recruited by:
						{#if playerData?.referredBy}
							<a href="/Player/{playerData.referredBy.shortCode}">{bio.referredBy}</a>
						{:else}
							{bio.referredBy}
						{/if}
					</p>
				{/if}
			{/if}
			<br />
		</div>
		<div class="section player-stats-section">
			<h1>Stats</h1>
			<h2>Batting</h2>
			<p><i title="Coming Soon" class="fas fa-laptop-code"></i> Coming Soon</p>
			<br />
			<h2>Pitching</h2>
			<p><i title="Coming Soon" class="fas fa-laptop-code"></i> Coming Soon</p>
			<br />
		</div>
	</div>
{:else}
	<div class="row">
		<div class="section">
			<h1>Player Not Found</h1>
			<p>The player you're looking for doesn't exist or couldn't be loaded.</p>
		</div>
	</div>
{/if}
