import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig, type ViteDevServer, type Plugin } from 'vite';
import { existsSync, createReadStream, statSync } from 'fs';
import { join } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Dev-only middleware that returns a proper 404 for missing team-logo
 * images so the <img onerror> fallback in TeamLogoSmall/Medium/Large
 * actually fires. Without it, Vite's dev server catches unmatched
 * routes and returns the SvelteKit SPA HTML with a 200, which the
 * browser doesn't treat as an image error and the fallback never runs.
 *
 * Checks the backend's static volume path so that uploaded logos
 * (written to /var/db/static/images/teams/) are served correctly in
 * dev while still returning 404 for teams without a logo.
 *
 * In production this isn't needed — the webserver returns a real 404
 * for missing files directly.
 */
function teamLogoFallback404(): Plugin {
	return {
		name: 'team-logo-fallback-404',
		configureServer(server: ViteDevServer) {
			server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
				const rawUrl = req.url ?? '';
				const urlPath = rawUrl.split('?')[0];
				if (urlPath.startsWith('/images/teams/') && urlPath.endsWith('.webp')) {
					const localPath = join('static', urlPath);
					const volumePath = join('/var/db/static', urlPath);
					if (!existsSync(localPath) && !existsSync(volumePath)) {
						res.statusCode = 404;
						res.setHeader('Content-Length', '0');
						return res.end();
					}
					// If the file exists on the volume, serve it
					if (!existsSync(localPath) && existsSync(volumePath)) {
						const stat = statSync(volumePath);
						res.statusCode = 200;
						res.setHeader('Content-Type', 'image/webp');
						res.setHeader('Content-Length', stat.size.toString());
						createReadStream(volumePath).pipe(res);
						return;
					}
				}
				next();
			});
		}
	};
}

export default defineConfig({
	plugins: [
		teamLogoFallback404(),
		enhancedImages(), // must come before the SvelteKit plugin
		sveltekit(),
		devtoolsJson()
	],
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:6100',
				changeOrigin: true
			},
			// Tenant-specific assets live on the per-VM volume at
			// /var/db/static and are served by the backend's
			// UseStaticFiles middleware in dev. In prod Apache aliases
			// handle these paths and requests never reach Kestrel.
			//
			// Specific prefixes only, so /images/teams/ still flows
			// through the teamLogoFallback404 plugin and SvelteKit's
			// own static/ dir.
			'/images/social': {
				target: 'http://localhost:6100',
				changeOrigin: true
			},
			'/images/logo.webp': {
				target: 'http://localhost:6100',
				changeOrigin: true
			},
			'/favicon.png': {
				target: 'http://localhost:6100',
				changeOrigin: true
			},
			'/files': {
				target: 'http://localhost:6100',
				changeOrigin: true
			}
		}
	}
});
