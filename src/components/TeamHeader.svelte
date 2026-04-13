<script lang="ts">
	import type { Team } from '$lib/models/Team';
	import TeamLogoLarge from './TeamLogoLarge.svelte';

	let { team, record, managers }: { team: Team; record: string; managers: string[] } = $props();
</script>

<div
	class="team-header"
	style="background-color: #{team.backgroundColor}; color: #{team.color};"
>
	<div class="team-header-logo">
		<TeamLogoLarge {team} />
	</div>
	<div class="team-header-main">
		<p class="team-header-details">{team.location} {team.name}</p>
		<p class="team-header-record">{record}</p>
		<p class="team-header-manager">
			Manager: {managers.length > 0 ? managers.join(', ') : '(Unknown)'}
		</p>
	</div>
</div>
