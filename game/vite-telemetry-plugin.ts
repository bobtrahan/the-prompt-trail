import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { IncomingMessage, ServerResponse } from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function telemetryPlugin(): Plugin {
  return {
    name: 'vite-plugin-telemetry',
    configureServer(server) {
      // Return a function to add middleware AFTER Vite's internal middleware
      // but we actually want BEFORE, so we add directly here
      server.middlewares.use(
        (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          const url = req.url ?? '';
          
          if (req.method === 'POST' && url.startsWith('/__telemetry/')) {
            let body = '';
            req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
            req.on('end', () => {
              try {
                const json = JSON.parse(body);
                const { playerClass, day, rank } = json;
                const date = new Date().toISOString().split('T')[0];
                const baseDir = path.join(__dirname, 'telemetry');

                let filePath = '';
                if (url.includes('/day')) {
                  const dir = path.join(baseDir, 'days');
                  fs.mkdirSync(dir, { recursive: true });
                  const dd = String(day || 0).padStart(2, '0');
                  filePath = path.join(dir, `${date}_${playerClass}_day${dd}.json`);
                } else if (url.includes('/run')) {
                  const dir = path.join(baseDir, 'runs');
                  fs.mkdirSync(dir, { recursive: true });
                  filePath = path.join(dir, `${date}_${playerClass}_${rank}_run.json`);
                }

                if (filePath) {
                  fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ status: 'ok', path: filePath }));
                } else {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'unknown endpoint' }));
                }
              } catch (err: any) {
                console.error('[Telemetry Plugin] Error:', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          } else {
            next();
          }
        }
      );
    }
  };
}
