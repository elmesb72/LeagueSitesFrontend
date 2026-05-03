import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig, type ViteDevServer, type Plugin } from 'vite';
import { existsSync } from 'fs';
import { join } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Dev-only middleware that returns a proper 404 for missing images under
 * /images/ so <img onerror> fallbacks actually fire. Without it, Vite's
 * dev server catches unmatched routes and returns the SvelteKit SPA
 * HTML with a 200, which the browser doesn't treat as an image error.
 *
 * Required for the team-logo components (TeamLogoSmall/Medium/Large)
 * which render a colored-initial fallback when their image is missing,
 * and anything else that relies on onerror for <img> elements under
 * /images/.
 *
 * In production this isn't needed — the webserver returns a real 404
 * for missing files directly.
 */
function suppressMissingImages(): Plugin {
	return {
		name: 'suppress-missing-images',
		configureServer(server: ViteDevServer) {
			server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
				if (req.url?.startsWith('/images/') && req.url?.endsWith('.webp')) {
					const filePath = join('static', req.url);
					if (!existsSync(filePath)) {
						res.statusCode = 404;
						res.setHeader('Content-Length', '0');
						return res.end();
					}
				}
				next();
			});
		}
	};
}

export default defineConfig({
	plugins: [
		suppressMissingImages(),
		enhancedImages(), // must come before the SvelteKit plugin
		sveltekit(),
		devtoolsJson()
	],
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:6100',
				changeOrigin: true
			}
		}
	}
});
