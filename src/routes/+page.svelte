<script lang="ts">
	import './+page.css';
	import HomepageGame from '../components/HomepageGame.svelte';
	import HomepageNews from '../components/HomepageNews.svelte';
	import HomepageStandings from '../components/HomepageStandings.svelte';
	import HomepageInformationIcon from '../components/HomepageInformationIcon.svelte';
	import type { Game } from '$lib/models/Game';

	let { data } = $props();

	function groupGamesByDate(games: Game[]): Map<string, Game[]> {
		const groups = new Map<string, Game[]>();
		for (const game of games) {
			const dateKey = new Date(game.date).toLocaleDateString('en-US', {
				weekday: 'long',
				month: 'long',
				day: 'numeric'
			});
			if (!groups.has(dateKey)) groups.set(dateKey, []);
			groups.get(dateKey)!.push(game);
		}
		return groups;
	}

	const gamesByDate = $derived(groupGamesByDate(data.games));
	const siteConfig = data.siteConfig;
	const home = siteConfig.home;
</script>

<div class="row row-home home-main">
	{#if data.isPlayoffs}
		<div class="section mobile-only">
			<a href="/Playoffs">
				<h1 title="Overdue (unscored), Recent (last 7 days), Upcoming (7 days)">Playoffs</h1>
				<h2>Click here to view brackets and games</h2>
			</a>
		</div>
	{/if}

	<div class="section home-main-left home-left">
		<h1 title="Overdue (unscored), Recent (last 7 days), Upcoming (7 days)">Games</h1>
		<div class="home-games">
			{#if data.games.length === 0}
				<span>&raquo; There are no recently played or upcoming games.</span>
			{:else}
				{#each [...gamesByDate] as [dateLabel, games]}
					<div class="subsection home-day">
						<h2>{dateLabel}</h2>
						{#each games as game}
							<HomepageGame {game} />
						{/each}
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<div class="section home-main-middle home-middle">
		<h1>News and Game Recaps</h1>
		{#if data.news.length === 0}
			<div class="home-news">
				<div class="home-news-header">
					<div class="home-news-title">Welcome!</div>
				</div>
				<div class="home-news-post">
					{siteConfig.siteName} has no news posts yet. Check back soon!
				</div>
			</div>
		{:else}
			{#each data.news as news}
				<HomepageNews {news} />
			{/each}
		{/if}
	</div>

	<div class="section home-main-right home-right">
		{#if data.isPlayoffs}
			<div class="home-playoffs desktop-only">
				<a href="/Playoffs">
					<h1 title="Overdue (unscored), Recent (last 7 days), Upcoming (7 days)">Playoffs</h1>
					Playoffs are now live! Click here to view the brackets, matchups, and games!
				</a>
			</div>
		{/if}

		{#if data.standings.length > 0}
			<HomepageStandings standings={data.standings} />
		{/if}

		<div>
			<h1>About</h1>
			<p>{@html home.aboutBlurb}</p>
		</div>

		{#if Object.keys(home.executives).length > 0}
			<div>
				<h1>League Executives</h1>
				<ul>
					{#each Object.entries(home.executives) as [role, name]}
						<li>{role}: {name}</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>

<div class="row row-home home-low">
	<div class="section home-low-left home-left">
		<h1>Follow us!</h1>
		<p class="socials">
			{#each Object.entries(home.socials) as [platform, url]}
				<a href={url}><img src="/images/social/{platform}.webp" alt={platform} /></a>
			{/each}
		</p>
	</div>
	<div class="section home-low-middle home-middle">
		<h1>Links</h1>
		<ul>
			{#each Object.entries(home.links) as [label, url]}
				<li><a href={url}>{label}</a></li>
			{/each}
		</ul>
	</div>
	<div class="section home-low-right home-right">
		<h1>Information</h1>
		<ul>
			{#each Object.entries(home.information) as [label, url]}
				<li><a href={url}><HomepageInformationIcon href={url} />{label}</a></li>
			{/each}
		</ul>
	</div>
</div>
