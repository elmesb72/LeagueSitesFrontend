<script lang="ts">
	import type { RosterEntry } from '$lib/models/TeamPage';

	let { roster, title = 'Active Roster' }: { roster: RosterEntry[]; title?: string } = $props();
</script>

<div class="subsection team-roster-active">
	<h1>{title}</h1>
	<ul class="team-roster-list">
		{#if roster.length === 0}
			<li class="team-roster-invitation">
				<div>(none)</div>
			</li>
		{:else}
			{#each roster as entry}
				<li class="team-roster-invitation">
					{#if entry.player}
						{#if entry.player.number}
							<div class="player-number">{entry.player.number}</div>
						{/if}
						<div class="player-name">
							<a href="/Player/{entry.player.shortCode}">{entry.player.name}</a>
						</div>
					{/if}
					<div class="invitation-status">
						{#if entry.userRoles.includes('Webmaster')}
							<div><i title="Webmaster" class="fas fa-tools"></i></div>
						{/if}
						{#if entry.userRoles.includes('Executive')}
							<div><i title="League Executive" class="fas fa-user-tie"></i></div>
						{/if}
						{#if entry.roles.includes('Manager')}
							<div><i title="Manager" class="fas fa-users"></i></div>
						{/if}
						{#if entry.roles.includes('Scorer')}
							<div><i title="Scorer" class="fas fa-clipboard-list"></i></div>
						{/if}
						{#if entry.roles.includes('Reporter')}
							<div><i title="Reporter" class="fas fa-newspaper"></i></div>
						{/if}
					</div>
				</li>
			{/each}
		{/if}
	</ul>
</div>
