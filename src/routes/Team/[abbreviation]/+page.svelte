<script lang="ts">
	import './+page.css';
	import TeamHeader from '../../../components/TeamHeader.svelte';
	import TeamSchedule from '../../../components/TeamSchedule.svelte';
	import TeamRoster from '../../../components/TeamRoster.svelte';

	let { data } = $props();
	const teamPage = $derived(data.teamPage);
</script>

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
			<TeamRoster roster={teamPage.roster} />
		</div>
	</div>
{:else}
	<div class="row">
		<div class="section">
			<h1>Team Not Found</h1>
			<p>The team you're looking for doesn't exist or couldn't be loaded.</p>
		</div>
	</div>
{/if}
