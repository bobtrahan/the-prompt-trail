import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function telemetryPlugin(): Plugin {
  return {
    name: 'vite-plugin-telemetry',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'POST') {
          return next();
        }

        const url = req.url || '';
        const isDay = url === '/__telemetry/day';
        const isRun = url === '/__telemetry/run';

        if (!isDay && !isRun) {
          return next();
        }

        try {
          const body = await new Promise<string>((resolve, reject) => {
            let data = '';
            req.on('data', (chunk) => { data += chunk; });
            req.on('end', () => resolve(data));
            req.on('error', reject);
          });

          const json = JSON.parse(body);
          const { playerClass, day, rank } = json;
          const date = new Date().toISOString().split('T')[0];

          let filePath = '';
          const baseDir = path.join(__dirname, 'telemetry');

          if (isDay) {
            const dir = path.join(baseDir, 'days');
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const dd = String(day || 0).padStart(2, '0');
            filePath = path.join(dir, `${date}_${playerClass}_day${dd}.json`);
          } else {
            const dir = path.join(baseDir, 'runs');
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            filePath = path.join(dir, `${date}_${playerClass}_${rank}_run.json`);
          }

          fs.writeFileSync(filePath, body, 'utf8');
          
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'ok', path: filePath }));
        } catch (error: any) {
          console.error('Telemetry Error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error.message }));
        }
      });
    }
  };
}
