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
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
