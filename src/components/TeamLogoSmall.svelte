<script lang="ts">
	let { team } = $props();
	let failed = $state(false);

	function handleMissingLogo() {
		console.info(`Team logo not found for "${team.abbreviation}" (id: ${team.id}), using fallback.`);
		failed = true;
	}
</script>

{#if failed}
	<div
		class="team-logo-fallback"
		style="background-color: #{team.backgroundColor}; color: #{team.color};"
		aria-label="{team.abbreviation} logo"
	>
		{team.abbreviation.charAt(0)}
	</div>
{:else}
	<img
		src="/images/teams/{team.id}-sm.webp"
		alt="{team.abbreviation} logo"
		class="team-logo-small"
		onerror={handleMissingLogo}
	/>
{/if}

<style>
	.team-logo-small {
		height: 24px;
		width: 24px;
		vertical-align: middle;
		display: inline-block;
	}

	.team-logo-fallback {
		height: 24px;
		width: 24px;
		border-radius: 14px;
		border: 2px solid black;
		line-height: 24px;
		text-align: center;
		font-size: 16px;
		font-weight: 700;
		vertical-align: middle;
		display: inline-block;
	}
</style>
