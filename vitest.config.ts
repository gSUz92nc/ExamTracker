import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['tests/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'happy-dom',
		setupFiles: ['./tests/setup.ts']
	}
});