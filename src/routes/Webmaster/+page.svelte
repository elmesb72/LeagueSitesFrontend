<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	onMount(() => {
		if (data.redirect) {
			goto(data.redirect);
		}
	});
</script>

<svelte:head>
	<title>{shortName} » Site Administration</title>
</svelte:head>

{#if data.authorized}
	<div class="row">
		<div class="section" style="width: 100%">
			<h1>Site Administration</h1>
			<p>This page is under construction.</p>
		</div>
	</div>
{/if}
