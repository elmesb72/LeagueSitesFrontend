<script lang="ts">
	import './HomepageGame.css';
	import type { Game } from '$lib/models/Game';
	import TeamLogoSmall from './TeamLogoSmall.svelte';
	import { formatTime } from '$lib/utils/date';

	let { game }: { game: Game } = $props();

	function formatForfeitScore(score: number | null): string {
		return score === null || score === 0 ? '0 (FF)' : score.toString();
	}
</script>

{#if game.status.name === 'Upcoming'}
	<div class="game">
		<div class="visitor">
			<div class="team-logo"><TeamLogoSmall team={game.visitingTeam} /></div>
			<div class="team">
				<a href="/Team/{game.visitingTeam.abbreviation}">
					<p class="team-location">{game.visitingTeam.location}</p>
					<p class="team-name">{game.visitingTeam.name}</p>
				</a>
			</div>
			<div class="time"><a href="/Game/{game.id}">{formatTime(game.date)}</a></div>
		</div>
		<div class="home">
			<div class="team-logo"><TeamLogoSmall team={game.hostTeam} /></div>
			<div class="team">
				<a href="/Team/{game.hostTeam.abbreviation}">
					<p class="team-location">{game.hostTeam.location}</p>
					<p class="team-name">{game.hostTeam.name}</p>
				</a>
			</div>
			<div class="location"><a href="/Locations/#{game.location.name}">{game.location.name}</a></div>
		</div>
	</div>
{:else if game.status.name === 'Postponed'}
	<div class="game">
		<div class="visitor">
			<div class="team-logo"><TeamLogoSmall team={game.visitingTeam} /></div>
			<div class="team">
				<a href="/Team/{game.visitingTeam.abbreviation}">
					<p class="team-location">{game.visitingTeam.location}</p>
					<p class="team-name">{game.visitingTeam.name}</p>
				</a>
			</div>
			<div class="postponed"><a href="/Game/{game.id}"><p>(PPD)</p></a></div>
		</div>
		<div class="home">
			<div class="team-logo"><TeamLogoSmall team={game.hostTeam} /></div>
			<div class="team">
				<a href="/Team/{game.hostTeam.abbreviation}">
					<p class="team-location">{game.hostTeam.location}</p>
					<p class="team-name">{game.hostTeam.name}</p>
				</a>
			</div>
			<div class="postponed"></div>
		</div>
	</div>
{:else if game.status.name === 'Played'}
	<div class="game" title="{game.location.name}, {formatTime(game.date)}">
		<div class="visitor">
			<div class="team-logo"><TeamLogoSmall team={game.visitingTeam} /></div>
			<div class="team">
				<a href="/Team/{game.visitingTeam.abbreviation}">
					<p class="team-location">{game.visitingTeam.location}</p>
					<p class="team-name">{game.visitingTeam.name}</p>
				</a>
			</div>
			<div class="score"><a href="/Game/{game.id}">{game.scoreVisitor}</a></div>
		</div>
		<div class="home">
			<div class="team-logo"><TeamLogoSmall team={game.hostTeam} /></div>
			<div class="team">
				<a href="/Team/{game.hostTeam.abbreviation}">
					<p class="team-location">{game.hostTeam.location}</p>
					<p class="team-name">{game.hostTeam.name}</p>
				</a>
			</div>
			<div class="score"><a href="/Game/{game.id}">{game.scoreHost}</a></div>
		</div>
	</div>
{:else if game.status.name === 'Forfeit'}
	<div class="game" title="{game.location.name}, {formatTime(game.date)}">
		<div class="visitor">
			<div class="team-logo"><TeamLogoSmall team={game.visitingTeam} /></div>
			<div class="team">
				<a href="/Team/{game.visitingTeam.abbreviation}">
					<p class="team-location">{game.visitingTeam.location}</p>
					<p class="team-name">{game.visitingTeam.name}</p>
				</a>
			</div>
			<div class="score"><a href="/Game/{game.id}">{formatForfeitScore(game.scoreVisitor)}</a></div>
		</div>
		<div class="home">
			<div class="team-logo"><TeamLogoSmall team={game.hostTeam} /></div>
			<div class="team">
				<a href="/Team/{game.hostTeam.abbreviation}">
					<p class="team-location">{game.hostTeam.location}</p>
					<p class="team-name">{game.hostTeam.name}</p>
				</a>
			</div>
			<div class="score"><a href="/Game/{game.id}">{formatForfeitScore(game.scoreHost)}</a></div>
		</div>
	</div>
{/if}
