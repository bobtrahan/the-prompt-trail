import { defineConfig } from 'vite';
import { telemetryPlugin } from './vite-telemetry-plugin';

export default defineConfig({
  plugins: [
    telemetryPlugin()
  ],
  server: {
    host: true
  }
});
