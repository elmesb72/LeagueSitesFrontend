<script lang="ts">
	import './+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();
	const providers = $derived(data.providers);
	const errorMessage = $derived(data.errorMessage);

	onMount(() => {
		if (data.redirect) {
			goto(data.redirect);
		}
	});
</script>

{#if errorMessage}
	<div class="row">
		<div class="section login-error">
			<h1>Error</h1>
			<p>{errorMessage}</p>
		</div>
	</div>
{/if}

<div class="row">
	<div class="section login-providers">
		<h1>Select a Provider</h1>
		{#if providers.length === 0}
			<span>No authentication providers have been configured. Contact the webmaster to set up authentication via a valid provider.</span>
		{:else}
			{#each providers as provider}
				<a class="oauth-provider-link" href={provider.url}>
					<div class="oauth-provider-image">
						<img src="/images/social/{provider.name}.webp" alt="{provider.name}" />
					</div>
					<div class="oauth-provider-text">Sign in with {provider.name}</div>
				</a>
			{/each}
		{/if}
	</div>
	<div class="section login-privacy">
		<h1>Privacy Policy</h1>
		<h2>Data Collection</h2>
		<p>This website collects your name and email address through third-party authentication providers for the sole purpose of identifying you within the site. Provider login prompts request the minimum access level that includes both name and email. No other personal data is accessed or stored.</p>
		<h2>Cookies</h2>
		<p>Authentication cookies are used to maintain your login session. No tracking or analytics cookies are used.</p>
		<h2>Third-Party Services</h2>
		<p>Your data is not shared with, sold to, or made available to any third party. Third-party services used by this site (authentication providers, Google Maps) are governed by their own privacy policies.</p>
		<h2>Data Retention</h2>
		<p>Your data is retained for as long as your account is active. You may request deletion of your account and associated data by contacting your team manager or league webmaster.</p>
		<h2>Children</h2>
		<p>This site is not directed at children under 13. If a minor participates in the league, a parent or guardian should manage their account.</p>
		<h2>Changes</h2>
		<p>This policy may be updated from time to time. Continued use of the site constitutes acceptance of any changes.</p>
	</div>
</div>
