<script lang="ts">
	let { teams } = $props();
	import HeaderTeam from './HeaderTeam.svelte';
</script>

<ul class="header-section header-teams">
	{#each teams as team}
		<HeaderTeam {team} />
	{/each}
</ul>

<style>
	.header-teams {
		height: 100%;
        overflow: hidden;

        margin: 0;
		padding: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

    
</style>
