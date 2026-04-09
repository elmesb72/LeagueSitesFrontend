<script lang="ts">
	let { team } = $props();
	import TeamLogoSmall from './TeamLogoSmall.svelte';
</script>

<li class="header-item">
	<a
		class="header-link header-team"
		href="/Team/{team.abbreviation}"
		title={team.fullName}
		style="--color: #{team.backgroundColor}00;
            --hover-background-color: #{team.backgroundColor};
            --hover-color: #{team.color}FF;"
	>
		<TeamLogoSmall {team} />
		<span class="header-team-abbreviation">
			{team.abbreviation}
		</span>
	</a>
	<style>
		.header-link {
			color: var(--color) !important;
			transition:
				background-color 0.4s ease-out,
				padding-top 0.2s,
				color 0.3s ease-out;
			padding-top: 8px;
		}
		.header-link:hover {
			background-color: var(--hover-background-color);
			color: var(--hover-color) !important;
			transition:
				background-color 0.4s ease-in,
				padding-top 0.2s,
				color 0.3s ease-in;
			padding-top: 0;
		}
	</style>
</li>

<style>
	.header-item,
	.header-link {
		height: 100%;
	}

	li {
		width: 28px;
		list-style: none;
	}

	a {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		text-transform: uppercase;
		font-family: 'Asap Condensed';
		font-size: 11px;
		text-align: center;
	}
</style>
