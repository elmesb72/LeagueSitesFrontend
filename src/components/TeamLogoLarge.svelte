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
		{team.abbreviation}
	</div>
{:else}
	<img
		src="/images/teams/{team.id}-lg.webp"
		alt="{team.abbreviation} logo"
		class="team-logo-lg"
		onerror={handleMissingLogo}
	/>
{/if}

<style>
	.team-logo-lg {
		display: block;
		width: 120px;
		height: 120px;
	}

	.team-logo-fallback {
		height: 120px;
		width: 120px;
		border-radius: 64px;
		border: 4px solid black;
		line-height: 112px;
		text-align: center;
		font-size: 48px;
		font-weight: 700;
		box-sizing: border-box;
		display: block;
	}
</style>
