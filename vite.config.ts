import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'La Quincena',
				short_name: 'La Quincena',
				description: 'Finanzas familiares quincenales',
				start_url: '/',
				display: 'standalone',
				orientation: 'portrait',
				theme_color: '#1a2e1a',
				background_color: '#1a2e1a',
				icons: [
					{ src: '/LaQuincena-192.png', sizes: '192x192', type: 'image/png' },
					{
						src: '/LaQuincena-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					}
				]
			},
			workbox: {
				globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}'],
				navigateFallback: '/'
			},
			devOptions: {
				enabled: true
			}
		})
	]
});
