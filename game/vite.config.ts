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
    rollupOptions: {
      input: {
        main: 'index.html',
        eventReview: 'event-review.html',
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
