<script lang="ts">
	import './+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();
	const shortName = $derived(data.siteConfig?.shortName ?? '');
	const location = $derived(data.location);

	let name = $state('');
	let formalName = $state('');
	let city = $state('');
	let address = $state('');
	let mapsPlaceID = $state('');
	let saving = $state(false);

	function initForm(): void {
		if (!location) return;
		name = location.name;
		formalName = location.formalName ?? '';
		city = location.city;
		address = location.address ?? '';
		mapsPlaceID = location.mapsPlaceID ?? '';
	}

	async function save(): Promise<void> {
		if (!location || saving) return;
		if (!name.trim() || !city.trim()) {
			alert('Location and city are required.');
			return;
		}

		saving = true;
		const response = await fetch(`/api/Locations/${location.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: name.trim(),
				formalName: formalName.trim() || null,
				city: city.trim(),
				address: address.trim() || null,
				mapsPlaceID: mapsPlaceID.trim() || null
			})
		});
		saving = false;
		if (response.ok) {
			goto('/Locations', { invalidateAll: true });
		} else {
			alert(await response.text());
		}
	}

	onMount(() => {
		if (data.redirect) {
			goto(data.redirect);
			return;
		}
		initForm();
	});
</script>

<svelte:head>
	<title>{shortName} » Edit Location</title>
</svelte:head>

{#if location}
	<div class="row">
		<div class="section location-edit-section">
			<h1>Edit Location</h1>

			<div class="location-edit-field">
				<label for="city">City</label>
				<input id="city" type="text" bind:value={city} disabled={saving} />
			</div>

			<div class="location-edit-field">
				<label for="name">Short Name (e.g. Springfield or Shelbyville - 3)</label>
				<input id="name" type="text" bind:value={name} disabled={saving} />
			</div>

			<div class="location-edit-field">
				<label for="formalName">Formal Name</label>
				<input id="formalName" type="text" bind:value={formalName} disabled={saving} />
			</div>

			<div class="location-edit-field">
				<label for="address">Address</label>
				<input id="address" type="text" bind:value={address} disabled={saving} />
			</div>

			<div class="location-edit-field">
				<label for="mapsPlaceID">Google Maps Place ID</label>
				<input id="mapsPlaceID" type="text" bind:value={mapsPlaceID} disabled={saving} placeholder="ChIJ..." />
				<p class="location-edit-help">Used to embed a map on the Locations page. Find via <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener">Google Place ID finder</a>.</p>
			</div>

			<div class="location-edit-actions">
				<button class="location-edit-submit" onclick={save} disabled={saving}>
					{saving ? 'Saving...' : 'Update'}
				</button>
				<button class="location-edit-cancel" onclick={() => goto('/Locations')} disabled={saving}>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}
