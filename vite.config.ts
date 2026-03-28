import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

// Load environment variables for tests
config();

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	optimizeDeps: {
		include: ['bits-ui']
	},
	ssr: {
		noExternal: ['bits-ui', 'svelte-sonner']
	},
	test: {
		globals: true,
		environment: 'node'
	}
});
