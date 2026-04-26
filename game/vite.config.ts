/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { telemetryPlugin } from './vite-telemetry-plugin';

export default defineConfig({
  plugins: [
    telemetryPlugin()
  ],
  server: {
    host: true
  },
  build: {
    chunkSizeWarningLimit: 1300,
    rollupOptions: {
      input: {
        main: 'index.html',
        eventReview: 'event-review.html',
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) return 'phaser';
        },
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
