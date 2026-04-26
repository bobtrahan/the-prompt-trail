/// <reference types="vitest" />
import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { telemetryPlugin } from './vite-telemetry-plugin';

export default defineConfig({
  plugins: [
    telemetryPlugin(),
    legacy({
      targets: ['chrome >= 80'],
      modernPolyfills: false,
      renderLegacyChunks: false,
    }),
  ],
  base: './',
  server: {
    host: true
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rolldownOptions: {
      output: {
        codeSplitting: false,
      },
    },
    rollupOptions: {
      input: {
        main: 'index.html',
        eventReview: 'event-review.html',
      },
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
