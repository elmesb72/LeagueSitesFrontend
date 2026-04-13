<script lang="ts">
	let { team } = $props();
</script>

<object data="/images/teams/{team.id}-lg.webp" aria-label="{team.abbreviation} logo" class="team-logo-lg">
	<div style="height: 120px; width: 120px; border-radius: 64px; background-color: #{team.backgroundColor} !important; border: 4px solid black; color: #{team.color} !important; line-height: 112px !important; text-align: center; font-size: 48px; font-weight: 700; box-sizing: border-box;">{team.abbreviation}</div>
</object>

<style>
	.team-logo-lg {
		display: block;
		width: 120px;
		height: 120px;
	}
</style>
