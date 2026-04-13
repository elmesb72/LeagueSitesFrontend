<script lang="ts">
	let { team } = $props();
</script>

<object data="/images/teams/{team.id}-md.webp" aria-label="{team.abbreviation} logo" class="team-logo-md">
	<div style="height: 75px; width: 75px; border-radius: 40px; background-color: #{team.backgroundColor} !important; border: 3px solid black; color: #{team.color} !important; line-height: 69px !important; text-align: center; font-size: 32px; font-weight: 700; box-sizing: border-box;">{team.abbreviation}</div>
</object>

<style>
	.team-logo-md {
		display: block;
		width: 75px;
		height: 75px;
		margin: 0 auto;
	}
</style>
