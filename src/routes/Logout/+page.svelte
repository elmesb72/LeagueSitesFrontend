<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();

	onMount(() => {
		if (data.redirect) {
			goto(data.redirect, { invalidateAll: true });
		}
	});
</script>

<p>Logging out...</p>
