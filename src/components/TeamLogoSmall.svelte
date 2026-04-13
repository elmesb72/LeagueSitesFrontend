<script lang="ts">
	let { team } = $props();
</script>

<object data="/images/teams/{team.id}-sm.webp" aria-label="{team.abbreviation} logo">
	<div style="height: 24px; width: 24px; border-radius: 14px; background-color: #{team.backgroundColor} !important; border: 2px solid black; color: #{team.color} !important; line-height: 24px !important; text-align: center; font-size: 16px; font-weight: 700;">{team.abbreviation.charAt(0)}</div>
</object>
