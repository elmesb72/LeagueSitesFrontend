<script lang="ts">
	// Champion banner for a decided bracket the league marks as historical.
	import type { Team } from '$lib/models/Team';
	import TeamLogoMedium from './TeamLogoMedium.svelte';

	let { team, year, bracketName }: { team: Team; year: number | null; bracketName: string } =
		$props();
</script>

<div class="playoff-champion">
	<div class="playoff-champion-logo"><TeamLogoMedium {team} /></div>
	<div>
		<p class="playoff-champion-kicker">{year ? `${year} ` : ''}{bracketName} Bracket Champions</p>
		<p class="playoff-champion-name"><a href="/Team/{team.abbreviation}">{team.fullName}</a></p>
	</div>
</div>
