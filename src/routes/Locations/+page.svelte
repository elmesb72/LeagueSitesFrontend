<script lang="ts">
	import './+page.css';
	import type { LocationWithGames } from '$lib/models/LocationWithGames';

	let { data } = $props();
	const locations = $derived(data.locations);
	const googleMapsKey = $derived(data.googleMapsKey);

	interface SiteGroup {
		globalIndex: number;
		locations: LocationWithGames[];
	}

	interface CityGroup {
		city: string;
		sites: SiteGroup[];
	}

	function buildCityGroups(locs: LocationWithGames[]): CityGroup[] {
		const cityMap = new Map<string, LocationWithGames[]>();
		for (const loc of locs) {
			if (!cityMap.has(loc.city)) cityMap.set(loc.city, []);
			cityMap.get(loc.city)!.push(loc);
		}

		const result: CityGroup[] = [];
		let globalIdx = 0;
		for (const [city, cityLocs] of cityMap) {
			const formalMap = new Map<string | null, LocationWithGames[]>();
			for (const loc of cityLocs) {
				const key = loc.formalName;
				if (!formalMap.has(key)) formalMap.set(key, []);
				formalMap.get(key)!.push(loc);
			}
			const sites: SiteGroup[] = [];
			for (const [_, siteLocs] of formalMap) {
				sites.push({ globalIndex: globalIdx++, locations: siteLocs });
			}
			result.push({ city, sites });
		}
		return result;
	}

	function formatGameDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	const cityGroups = $derived(buildCityGroups(locations));
</script>

{#each cityGroups as cityGroup}
	<div class="row location-row">
		<div class="section">
			<h1>{cityGroup.city}</h1>
			{#each cityGroup.sites as site}
				<div class="inner-row">
					{#if site.globalIndex % 2 === 1}
						<div class="subsection location-details location-details-left">
							{#if googleMapsKey && site.locations[0].mapsPlaceId}
								<iframe
									class="location-map"
									style="border:0"
									loading="lazy"
									allowfullscreen
									title="{site.locations[0].formalName ?? site.locations[0].name} map"
									src="https://www.google.com/maps/embed/v1/place?q=place_id:{site.locations[0].mapsPlaceId}&maptype=satellite&key={googleMapsKey}"
								></iframe>
							{:else}
								{@const loc = site.locations[0]}
								{@const searchName = (loc.formalName ?? loc.name).replace(/\s+/g, '+')}
								{@const searchCity = loc.city.replace(/\s+/g, '+')}
								<div class="location-info-fallback">
									<p class="location-info-name">{loc.formalName ?? loc.name}</p>
									{#if loc.address}<p>{loc.address}</p>{/if}
									<p>{loc.city}</p>
									<p><a href="https://www.google.com/search?q={searchName}+{searchCity}" target="_blank" rel="noopener">Search on Google <i class="fas fa-external-link-alt"></i></a></p>
								</div>
							{/if}
						</div>
					{/if}
					<div class="subsection location-games">
						{#each site.locations as diamond}
							<h2 id={diamond.name}>{diamond.name}</h2>
							{#if diamond.recentGames.length > 0 || diamond.upcomingGames.length > 0}
								{#if diamond.recentGames.length > 0}
									<p class="location-diamond-subtitle">Recent Games</p>
									<ul class="location-games-list">
										{#each diamond.recentGames as game}
											<li>
												{formatGameDate(game.date)}: {game.visitingTeam.fullName} ({game.scoreVisitor}) @ {game.hostTeam.fullName} ({game.scoreHost})
											</li>
										{/each}
									</ul>
								{/if}
								{#if diamond.upcomingGames.length > 0}
									<p class="location-diamond-subtitle">Upcoming Games</p>
									<ul class="location-games-list">
										{#each diamond.upcomingGames as game}
											<li>
												{formatGameDate(game.date)}: {game.visitingTeam.fullName} @ {game.hostTeam.fullName}
											</li>
										{/each}
									</ul>
								{/if}
							{:else}
								<p>There are no games that have been played here recently, nor are there currently any planned upcoming games.</p>
							{/if}
						{/each}
					</div>
					{#if site.globalIndex % 2 === 0}
						<div class="subsection location-details location-details-right">
							{#if googleMapsKey && site.locations[0].mapsPlaceId}
								<iframe
									class="location-map"
									style="border:0"
									loading="lazy"
									allowfullscreen
									title="{site.locations[0].formalName ?? site.locations[0].name} map"
									src="https://www.google.com/maps/embed/v1/place?q=place_id:{site.locations[0].mapsPlaceId}&maptype=satellite&key={googleMapsKey}"
								></iframe>
							{:else}
								{@const loc = site.locations[0]}
								{@const searchName = (loc.formalName ?? loc.name).replace(/\s+/g, '+')}
								{@const searchCity = loc.city.replace(/\s+/g, '+')}
								<div class="location-info-fallback">
									<p class="location-info-name">{loc.formalName ?? loc.name}</p>
									{#if loc.address}<p>{loc.address}</p>{/if}
									<p>{loc.city}</p>
									<p><a href="https://www.google.com/search?q={searchName}+{searchCity}" target="_blank" rel="noopener">Search on Google <i class="fas fa-external-link-alt"></i></a></p>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/each}

{#if locations.length === 0}
	<div class="row location-row">
		<div class="section">
			<h1>Locations</h1>
			<p>No location data available.</p>
		</div>
	</div>
{/if}
