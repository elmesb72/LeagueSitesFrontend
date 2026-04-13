<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import HomepageNews from '../../../components/HomepageNews.svelte';

	let { data } = $props();
	const deletedNews = $derived(data.deletedNews);
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	onMount(() => {
		if (data.redirect) {
			goto(data.redirect);
		}
	});
</script>

<svelte:head>
	<title>{shortName} » Recycle Bin (News)</title>
</svelte:head>

<div class="row recycle-bin-news">
	<div class="section" style="width: 100%;">
		<h1>Recycle Bin</h1>
		<h2>News</h2>
		{#each deletedNews as news}
			<HomepageNews {news} canEdit={true} isDeleted={true} />
		{/each}
	</div>
</div>
