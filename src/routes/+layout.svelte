<script lang="ts">
	let { children, data } = $props();
	import { siteConfig } from '$lib/siteConfig';
	import HeaderTeams from '../components/HeaderTeams.svelte';
	import LeagueLogo from '../components/LeagueLogo.svelte';
</script>

<svelte:head>
	<link rel="icon" href="src/lib/assets/favicon.svg" sizes="16x16" />
	<title>{siteConfig.siteName}</title>
</svelte:head>

<header>
	<div class="container">
		<ul class="header-section header-primary">
			<li class="header-item">
				<a class="header-link" href="/"
					><LeagueLogo exists={data.logoExists} alt={siteConfig.siteName} /></a
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
		{@render children?.()}
	</main>
	<footer>
		<div class="theme-switch-wrapper">
			<label class="theme-switch" for="checkbox">
				<input type="checkbox" id="checkbox" />
				<div class="slider round"></div>
			</label>
			<em><span title="Toggle Light/Dark Mode" class="fas fa-lightbulb"></span></em>
		</div>
		<p>&copy; 2020-{new Date().getFullYear()} - {siteConfig.siteName}</p>
		<p class="hidden-footer">Designed & developed by Brandon Elmes</p>
	</footer>
</div>

<style>
	:global {
		:root {
			--background-color: #eeefea;
			--nav-background-color: #969c61;
			--section-background-color: white;
			--table-main-color: white;
			--table-alternate-color: lightgrey;
			--table-tertiary-color: darkgrey;
			--table-border: 1px solid rgba(0, 0, 0, 1);
			--text: #050506;
			--text-soft: #a5a5a6;
			--text-soft-contrast: #858584;
			--h1: #886d47;
			--h1-border: 1px solid rgba(0, 0, 0, 0);
			--h2: #b47c45;
			--h2-border: 1px solid rgba(0, 0, 0, 0);
			--link: #886d47;
			--link-hover: #b47c45;
			--header-shadow: 0 1px 5px #050506;
			--section-shadow: 0 1px 5px #886d47;
			--text-inverted: #eeefea;
			--game-border: 1px solid #eeefea;
			--game-hover-background-color: #dfcebb;
			--news-border: 1px solid #eeefea;
			--news-hover-background-color: #dfcebb;
			--standings-border: 1px solid #eeefea;
			--standings-row-hover-background-color: #dfcebb;
			--tournament-series-spot-background-color: #eeefea;
			--tournament-series-spot-shadow: 0 1px 2px #886d47;
			--tournament-series-winner-outline: 2px solid black;
		}

		[data-theme='dark'] {
			--nav-background-color: black;
			--background-color: #050506;
			--section-background-color: #886d47;
			--table-main-color: #886d47;
			--table-alternate-color: #b47c45;
			--table-tertiary-color: #5e5f5a;
			--table-border: 1px solid #eeefea;
			--text: #eeefea;
			--text-soft: #5e5f5a;
			--text-soft-contrast: #c3c3c9;
			--h1: #969c61;
			--h1-border: 1px solid #eeefea;
			--h2-border: 1px solid #b47c45;
			--link: #dfcebb;
			--link-hover: #eeefea;
			--header-shadow: 0 0 200px 80px #eeefea;
			--section-shadow: 0 0 0 1px #eeefea;
			--game-border: 1px solid #b47c45;
			--game-hover-background-color: #b47c45;
			--news-border: 1px dotted #dfcebb;
			--news-hover-background-color: #b47c45;
			--standings-border: 1px solid #b47c45;
			--standings-row-hover-background-color: #b47c45;
			--tournament-series-spot-background-color: #969c61;
			--tournament-series-spot-shadow: none;
			--tournament-series-winner-outline: 2px solid #eeefea;
		}

		html {
			background-color: var(--background-color);
			color: var(--text);
		}

		[class*='fa-'] {
			color: var(--link);
			padding: 0 3px;
		}

		html,
		body,
		h1,
		h2,
		input,
		button,
		select,
		textarea {
			font-family: 'Asap', sans-serif;
			font-size: 16px;
		}

		.soft {
			color: var(--text-soft);
		}

		h1 {
			font-weight: 700;
			background-color: var(--h1);
			color: var(--text-inverted);
			border: var(--h1-border);
			padding: 15px 5px;
			margin: 0 0 10px 0;
		}

		h2 {
			font-family: 'Asap Condensed';
			font-weight: 700;
			background-color: var(--h2);
			color: var(--text-inverted);
			border: var(--h2-border);
			padding: 5px;
			margin: 0 0 3px 0;
		}

		.header-icon {
			/* for font-awesome icons */
			color: var(--text-inverted);
		}

		p {
			margin: 0;
		}

		a:link,
		a:visited,
		a:hover,
		a:active {
			text-decoration: none;
		}
		a:link,
		a:visited,
		a:active {
			color: var(--link);
		}
		a:hover {
			color: var(--link-hover);
		}

		table {
			border-spacing: 0;
			border-collapse: collapse;
		}

		ul {
			margin: 0;
			padding-left: 12px;
		}
		li {
			list-style-type: '» ';
		}

		hr {
			height: 1px;
			border: none;
			border-top: 1px solid var(--text);
		}

		.green {
			color: rgb(72, 180, 0);
		}

		.red {
			color: rgb(214, 0, 0);
		}

		body {
			min-width: 1225px;
			margin: 0;
			display: flex;
			align-items: center;
			flex-direction: column;
		}

		.container {
			margin: 0 auto;
			width: 1225px;
			min-width: 1225px;
		}

		input[type='submit'],
		input[type='button'] {
			display: inline-block;
			height: 36px !important;
			background-image: linear-gradient(to bottom, #1da7ee, #178ee9);
			border-radius: 3px;
			text-shadow: 0 1px 0 rgba(0, 51, 83, 0.3);
			box-shadow:
				0 1px 0 rgba(0, 0, 0, 0.2),
				inset 0 1px rgba(255, 255, 255, 0.03);
			border: 1px solid #0073bb;
			color: white;
		}

		.no-border {
			border: 0 !important;
		}

		.bold-border {
			border-width: 3px !important;
		}
	}

	header {
		width: 100%;
		text-align: center;
		margin-bottom: 20px;
		background-color: var(--nav-background-color);
		box-shadow: var(--header-shadow);
		font-weight: 700;
	}

	header .container {
		height: 80px;
		padding: 0 20px;
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
		padding-left: 10px;
	}
	.header-primary li {
		padding-right: 10px;
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
		padding-right: 10px;
	}

	.header-login li {
		padding-left: 10px;
	}

	footer {
		padding: 0 20px;
		text-align: center;
		margin-bottom: 20px;
	}

	.theme-switch-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 8px;
	}

	.theme-switch-wrapper em {
		margin-left: 10px;
		font-size: 1rem;
	}

	.theme-switch {
		display: inline-block;
		height: 28px;
		position: relative;
		width: 56px;
	}

	.theme-switch input {
		display: none;
	}

	.slider {
		background-color: #886d47;
		bottom: 0;
		cursor: pointer;
		left: 0;
		position: absolute;
		right: 0;
		top: 0;
		transition: 0.4s;
	}

	.slider:before {
		background-color: #eeefea;
		bottom: 3px;
		content: '';
		height: 22px;
		left: 3px;
		position: absolute;
		transition: 0.4s;
		width: 22px;
	}

	input:checked + .slider {
		background-color: #969c61;
	}

	input:checked + .slider:before {
		transform: translateX(28px);
	}

	.slider.round {
		border-radius: 28px;
	}

	.slider.round:before {
		border-radius: 50%;
	}

	.hidden-footer {
		color: var(--background-color);
	}

	.desktop-only {
		display: initial;
	}
	.mobile-only {
		display: none;
	}
</style>
