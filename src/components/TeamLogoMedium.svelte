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
		src="/images/teams/{team.id}-md.webp"
		alt="{team.abbreviation} logo"
		class="team-logo-md"
		onerror={handleMissingLogo}
	/>
{/if}

<style>
	.team-logo-md {
		display: block;
		width: 75px;
		height: 75px;
		margin: 0 auto;
	}

	.team-logo-fallback {
		height: 75px;
		width: 75px;
		border-radius: 40px;
		border: 3px solid black;
		line-height: 69px;
		text-align: center;
		font-size: 32px;
		font-weight: 700;
		box-sizing: border-box;
		display: block;
		margin: 0 auto;
	}
</style>
