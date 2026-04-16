<script lang="ts">
	import { onMount } from 'svelte';
	import '$lib/assets/tokens.css';
	import './+layout.css';
	import HeaderTeams from '../components/HeaderTeams.svelte';
	import LeagueLogo from '../components/LeagueLogo.svelte';
	import PageTransition from '../components/PageTransition.svelte';

	let { children, data } = $props();
	let darkMode = $state(false);

	onMount(() => {
		darkMode = localStorage.getItem('theme') === 'dark';
		applyTheme();
	});

	function applyTheme(): void {
		document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
		localStorage.setItem('theme', darkMode ? 'dark' : 'light');
	}

	function toggleTheme(): void {
		darkMode = !darkMode;
		applyTheme();
	}
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" />
	<title>{data.siteConfig.siteName}</title>
</svelte:head>

<header>
	<div class="container">
		<ul class="header-section header-primary">
			<li class="header-item">
				<a class="header-link" href="/"
					><LeagueLogo alt={data.siteConfig.siteName} /></a
				>
			</li>
			<li class="header-item">
				<a class="header-link" href="/Standings">Standings</a>
			</li>
			<li class="header-item">
				<a class="header-link" href="/Scores">Scores</a>
			</li>
			<li class="header-item">
				<a class="header-link" href="/Schedule">Schedule</a>
			</li>
			<li class="header-item">
				<a class="header-link" href="/Playoffs">Playoffs</a>
			</li>
			<li class="header-item">
				<a class="header-link" href="/History">History</a>
			</li>
			<li class="header-item">
				<a class="header-link" href="/Locations">Locations</a>
			</li>
		</ul>
		<HeaderTeams teams={data.teams} />
		<ul class="header-section header-login">
			{#if !data.user.isAuthenticated}
				<li>
					<a class="header-link" href="/Login"
						><span class="desktop-only">Log In</span><i class="mobile-only far fa-user-circle"
						></i></a
					>
				</li>
			{:else}
				<li>
					<a class="header-link" href="/User"
						><span class="desktop-only">{data.user.name}</span><i
							class="mobile-only fas fa-user-circle"
						></i></a
					>
				</li>
			{/if}
		</ul>
	</div>
</header>
<div class="container">
	<main>
		<PageTransition>
			{@render children?.()}
		</PageTransition>
	</main>
	<footer>
		<div class="theme-switch-wrapper">
			<label class="theme-switch" for="checkbox">
				<input type="checkbox" id="checkbox" checked={darkMode} onchange={toggleTheme} />
				<div class="slider round"></div>
			</label>
			<em><span title="Toggle Light/Dark Mode" class="fas fa-lightbulb"></span></em>
		</div>
		<p>&copy; 2020-{new Date().getFullYear()} - {data.siteConfig.siteName}</p>
		<p class="hidden-footer">Designed & developed by Brandon Elmes</p>
	</footer>
</div>

<style>
	header {
		width: 100%;
		text-align: center;
		margin-bottom: var(--space-6);
		background-color: var(--surface-nav);
		box-shadow: var(--shadow-header);
		font-weight: 700;
	}

	header .container {
		height: 80px;
		padding: 0 var(--space-6);
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	header ul {
		margin: 0;
		padding: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	header li {
		list-style: none;
	}

	.header-section {
		overflow: hidden;
	}

	.header-primary {
		padding-left: var(--space-4);
	}
	.header-primary li {
		padding-right: var(--space-4);
	}

	.header-primary a,
	.header-login a {
		color: var(--text-inverted) !important;
	}
	.header-primary a:hover,
	.header-login a:hover {
		color: white !important;
	}

	.header-login {
		padding-right: var(--space-4);
	}

	.header-login li {
		padding-left: var(--space-4);
	}

	footer {
		padding: 0 var(--space-6);
		text-align: center;
		margin-bottom: var(--space-6);
	}

	.theme-switch-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: var(--space-3);
	}

	.theme-switch-wrapper em {
		margin-left: var(--space-4);
		font-size: 1rem;
	}

	.theme-switch {
		display: inline-block;
		height: var(--space-7);
		position: relative;
		width: 56px;
	}

	.theme-switch input {
		display: none;
	}

	.slider {
		background-color: var(--color-tan);
		bottom: 0;
		cursor: pointer;
		left: 0;
		position: absolute;
		right: 0;
		top: 0;
		transition: 0.4s;
	}

	.slider:before {
		background-color: var(--color-cream);
		bottom: var(--space-1);
		content: '';
		height: 22px;
		left: var(--space-1);
		position: absolute;
		transition: 0.4s;
		width: 22px;
	}

	input:checked + .slider {
		background-color: var(--color-olive);
	}

	input:checked + .slider:before {
		transform: translateX(28px);
	}

	.slider.round {
		border-radius: var(--radius-full);
	}

	.slider.round:before {
		border-radius: 50%;
	}

	.hidden-footer {
		color: var(--surface-page);
	}
</style>
