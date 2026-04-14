<script lang="ts">
	let { alt } = $props();
	let failed = $state(false);

	function handleMissingLogo() {
		console.info('League logo not found, using text fallback.');
		failed = true;
	}
</script>

{#if failed}
	<span class="league-logo-fallback">{alt}</span>
{:else}
	<img
		src="/images/logo.webp"
		{alt}
		class="league-logo"
		onerror={handleMissingLogo}
	/>
{/if}

<style>
	.league-logo {
		vertical-align: middle;
		max-height: 60px;
	}

	.league-logo-fallback {
		vertical-align: middle;
	}
</style>
