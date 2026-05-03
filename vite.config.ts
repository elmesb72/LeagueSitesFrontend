import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig, type ViteDevServer, type Plugin } from 'vite';
import { existsSync } from 'fs';
import { join } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Dev-only middleware that returns a proper 404 for missing team-logo
 * images so the <img onerror> fallback in TeamLogoSmall/Medium/Large
 * actually fires. Without it, Vite's dev server catches unmatched
 * routes and returns the SvelteKit SPA HTML with a 200, which the
 * browser doesn't treat as an image error and the fallback never runs.
 *
 * Scoped narrowly to team-logo paths on purpose. Other tenant images
 * (social icons, league logo, favicon) live on the per-VM volume and
 * are served by the backend in dev via the proxy below — this
 * middleware must not intercept them.
 *
 * In production this isn't needed — the webserver returns a real 404
 * for missing files directly.
 */
function teamLogoFallback404(): Plugin {
	return {
		name: 'team-logo-fallback-404',
		configureServer(server: ViteDevServer) {
			server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
				if (req.url?.startsWith('/images/teams/') && req.url?.endsWith('.webp')) {
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
