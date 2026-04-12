<script lang="ts">
	import type { Bracket } from '$lib/models/Playoffs';
	import PlayoffSeriesSpot from './PlayoffSeriesSpot.svelte';

	let { bracket }: { bracket: Bracket } = $props();
</script>

<div class="tournament-bracket">
	<div class="tournament-bracket-name">{bracket.name} Bracket</div>
	<div class="tournament-bracket-rounds">
		{#each bracket.rounds as round, roundIndex}
			<div class="tournament-round round-{roundIndex + 1}">
				<div class="tournament-round-name">{round.name}</div>
				{#each round.series as series}
					<div class="tournament-series">
						<div class="tournament-series-number">{series.number}</div>
						<div class="tournament-series-matchup">
							<PlayoffSeriesSpot
								spot={series.spot1}
								winner={series.winner}
								initialSeed={series.spot1?.initialSeed ?? null}
							/>
							<PlayoffSeriesSpot
								spot={series.spot2}
								winner={series.winner}
								initialSeed={series.spot2?.initialSeed ?? null}
							/>
						</div>
					</div>
				{/each}
			</div>
		{/each}
	</div>
</div>
