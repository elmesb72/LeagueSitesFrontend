import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			fallback: 'index.html'
		}),
		// Every push to main deploys a new build. A tab left open keeps running
		// the old bundle from cache; polling _app/version.json lets the client
		// notice and turn its next navigation into a full reload.
		version: {
			pollInterval: 60_000
		}
	}
};

export default config;
