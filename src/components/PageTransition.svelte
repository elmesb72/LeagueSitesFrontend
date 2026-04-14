<script lang="ts">
	import { navigating } from '$app/stores';
	import { fade } from 'svelte/transition';
	import { page } from '$app/stores';

	let { children } = $props();
	let visible = $state(true);

	$effect(() => {
		if ($navigating) {
			// Only hide if we're actually going somewhere different
			const from = $navigating.from?.url.pathname;
			const to = $navigating.to?.url.pathname;
			if (from !== to) {
				visible = false;
			}
		}
	});

	$effect(() => {
		// Re-show when navigation completes (navigating becomes null)
		if (!$navigating && !visible) {
			visible = true;
		}
	});
</script>

{#if visible}
	<div in:fade={{ duration: 150 }}>
		{@render children?.()}
	</div>
{/if}
