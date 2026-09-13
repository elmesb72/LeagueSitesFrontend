<script lang="ts">
	// "How it fits together": the tournament's brackets and pools as the chain the
	// seeding rules describe, with the champion mark shown where it sits, a warning
	// when a marked stage is really a qualifier, and the next piece worth adding.
	import type { TournamentDetail } from '$lib/models/Tournament';
	import { tournamentFlow } from '$lib/tournament/flow';

	let { detail }: { detail: TournamentDetail } = $props();

	const flow = $derived(tournamentFlow(detail));
</script>

{#if flow.stages.length > 0}
	<section class="tournament-flow" aria-labelledby="tournament-flow-title">
		<h2 id="tournament-flow-title">How it fits together</h2>

		{#each flow.warnings as warning (warning.stage.key + warning.feeds.key)}
			<p class="tournament-flow-note tournament-flow-note-warning" role="status">
				<span class="tournament-flow-note-icon" aria-hidden="true">&#9888;</span>
				<span>
					{warning.message}
					<a href={warning.stage.settingsHref}>Edit {warning.stage.name}</a>
					&middot;
					<a href={warning.feeds.settingsHref}>Edit {warning.feeds.name}</a>
				</span>
			</p>
		{/each}

		{#each flow.rows as row, rowIndex (rowIndex)}
			<div class="tournament-flow-path">
				{#each row.items as item, itemIndex (itemIndex)}
					{#if item.type === 'source'}
						<div class="tournament-flow-stage tournament-flow-source">
							<span class="tournament-flow-kind">source</span>
							<span>{item.label}</span>
						</div>
					{:else if item.type === 'stage'}
						<div
							class="tournament-flow-stage"
							class:tournament-flow-champion={item.stage.historical}
							data-stage={item.stage.key}
						>
							<span class="tournament-flow-kind">{item.stage.kind} &middot; {item.stage.size}</span>
							<a href={item.stage.href}>{item.stage.name}</a>
							{#if item.stage.historical}
								<span class="tournament-flow-tag" title="Winner appears on the History page">
									champion
								</span>
							{/if}
						</div>
					{:else if item.type === 'ref'}
						<div class="tournament-flow-stage tournament-flow-ref">
							<span class="tournament-flow-kind">{item.stage.kind}</span>
							<a href={item.stage.href}>{item.stage.name}</a>
						</div>
					{:else if item.type === 'arrow'}
						<div
							class="tournament-flow-arrow"
							class:tournament-flow-arrow-losers={item.edge.kind === 'losers'}
						>
							<span>{item.edge.label}</span>
						</div>
					{:else if item.type === 'ghost-arrow'}
						<div class="tournament-flow-arrow tournament-flow-arrow-ghost">
							<span>{item.label}</span>
						</div>
					{:else}
						<a class="tournament-flow-stage tournament-flow-ghost" href={item.href}>
							<span class="tournament-flow-kind">suggested</span>
							<span>+ {item.label}</span>
						</a>
					{/if}
				{/each}
			</div>
		{/each}

		{#if flow.suggestion}
			{@const s = flow.suggestion}
			<p class="tournament-flow-note tournament-flow-note-next">
				<span class="tournament-flow-note-icon" aria-hidden="true">&rarr;</span>
				<span>
					<strong>Next:</strong>
					the {s.losers} teams knocked out in the {s.roundName} have nowhere to play.
					<a href={s.href}>Add a B-side pool for them</a>
					&ndash; it comes pre-filled with those {s.losers}. Or skip it if the league has no B side.
				</span>
			</p>
		{/if}

		<p class="tournament-flow-legend">
			<span class="tournament-flow-tag">champion</span>
			= its winner goes on the History page. It sits on the last stop of each path, the stage nobody moves
			on from.
		</p>
	</section>
{/if}

<style>
	.tournament-flow {
		margin-bottom: var(--space-5);
	}

	.tournament-flow-path {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-2) 0;
		margin-bottom: var(--space-3);
	}

	.tournament-flow-stage {
		display: inline-flex;
		flex-direction: column;
		align-items: flex-start;
		min-width: 120px;
		padding: var(--space-2) var(--space-4);
		border: 1px solid var(--color-grey-light);
		border-radius: var(--radius-md);
		background: var(--surface-section);
		color: var(--text-default);
		text-decoration: none;
	}

	.tournament-flow-stage > a {
		font-weight: 600;
		text-decoration: none;
	}

	.tournament-flow-stage > a:hover {
		text-decoration: underline;
	}

	.tournament-flow-kind {
		font-size: var(--text-xs);
		color: var(--text-soft-contrast);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.tournament-flow-source,
	.tournament-flow-ref {
		border-style: dashed;
		background: transparent;
		color: var(--text-soft-contrast);
	}

	.tournament-flow-champion {
		border-color: var(--color-copper);
		box-shadow: inset 0 0 0 1px var(--color-copper);
	}

	.tournament-flow-ghost {
		border-style: dashed;
		background: var(--surface-page);
	}

	.tournament-flow-ghost:hover {
		border-color: var(--surface-heading-primary);
	}

	.tournament-flow-tag {
		display: inline-block;
		margin-top: var(--space-1);
		padding: 1px 6px;
		border-radius: var(--radius-sm);
		background-color: var(--surface-heading-secondary);
		color: var(--text-inverted);
		font-size: var(--text-xs, 11px);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.tournament-flow-arrow {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		min-width: 96px;
		margin: 0 var(--space-2);
		font-size: var(--text-xs);
		line-height: 1.2;
		color: var(--text-soft-contrast);
		text-align: center;
	}

	.tournament-flow-arrow::after {
		content: '';
		display: block;
		width: 100%;
		margin-top: 3px;
		border-top: 2px solid var(--color-grey-light);
	}

	.tournament-flow-arrow-losers::after {
		border-top-style: dashed;
	}

	.tournament-flow-arrow-ghost::after {
		border-top-style: dotted;
	}

	.tournament-flow-note {
		display: flex;
		gap: var(--space-3);
		align-items: flex-start;
		margin: 0 0 var(--space-3);
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--color-grey-light);
		border-left-width: 4px;
		border-radius: var(--radius-sm);
		background: var(--surface-page);
		font-size: var(--text-sm);
	}

	.tournament-flow-note-next {
		border-left-color: var(--surface-heading-primary);
	}

	.tournament-flow-note-warning {
		border-color: var(--color-loss);
		border-left-width: 4px;
	}

	.tournament-flow-note-icon {
		flex: none;
	}

	.tournament-flow-legend {
		margin: 0;
		font-size: var(--text-xs);
		color: var(--text-soft-contrast);
	}

	.tournament-flow-legend .tournament-flow-tag {
		margin: 0 var(--space-1) 0 0;
	}
</style>
