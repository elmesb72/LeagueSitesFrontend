<script lang="ts">
	let { exists, alt } = $props();
</script>

{#if exists}
	<img src='/images/logo.webp' alt="" />
{:else}
	{alt}
{/if}
