<script lang="ts">
	import './HomepageNews.css';
	import type { News } from '$lib/models/News';

	let { news, canEdit = false, renderedContents = '', isDeleted = false }: { news: News; canEdit?: boolean; renderedContents?: string; isDeleted?: boolean } = $props();

	const displayContents = $derived(renderedContents || news.contents);

	function formatDate(dateStr: string): string {
		return new Date(dateStr.split('T')[0] + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	const displayDate = $derived(news.edited ? formatDate(news.edited) : formatDate(news.date));
</script>

<div class="home-news" class:home-news-hidden={news.isHidden}>
	<div class="home-news-header">
		<div class="home-news-author">
			{news.author.name}
		</div>
		<div class="home-news-date">
			{#if canEdit}
				<a href="/News/{news.id}">{displayDate} <i class="fa-solid fa-pen-to-square"></i></a>
			{:else}
				{displayDate}
			{/if}
		</div>
	</div>
	<div class="home-news-header">
		<div class="home-news-title">{news.title}</div>
	</div>
	<div class="home-news-post">
		{#if isDeleted}
			<div class="home-news-hidden-disclaimer">
				This post has been deleted. You can restore it by editing it and unchecking the "Deleted" checkbox.
			</div>
		{:else if news.isHidden}
			<div class="home-news-hidden-disclaimer">
				This post (authored by you) is hidden. Publish the post by editing it to uncheck the "Hidden" checkbox or, if it's no longer needed, set it to Deleted.
			</div>
		{/if}
		{@html displayContents}
	</div>
</div>
