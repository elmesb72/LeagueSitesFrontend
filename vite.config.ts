import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig, type ViteDevServer, type Plugin } from 'vite';
import { existsSync } from 'fs';
import { join } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

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
