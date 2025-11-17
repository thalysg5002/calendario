import express from 'express';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';

export function createServer() {
  const app = express();

  app.use(express.json());

  // Serve static assets (logo, icon, etc.)
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const assetsDir = path.resolve(__dirname, '../assets');
  const publicDir = path.resolve(__dirname, '../public');
  
  // Try public first, then assets
  app.use((req, res, next) => {
    if (req.url === '/logo-igreja.png' || req.url === '/icon.png') {
      let filePath = path.join(publicDir, 'logo-igreja.png');
      if (!fs.existsSync(filePath)) {
        filePath = path.join(assetsDir, 'icon.png');
      }
      if (fs.existsSync(filePath)) {
        console.log('[STATIC]', req.url, '->', filePath);
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'max-age=3600');
        res.sendFile(filePath);
        return;
      }
    }
    next();
  });

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    next();
  });

  // Simple request logger for diagnostics
  app.use((req, res, next) => {
    console.log('[API]', req.method, req.url);
    next();
  });

  const apiDir = path.resolve(__dirname, '../api');
  const handlers = ['aniversarios', 'eventos', 'igrejas', 'list-files', 'test', 'ssr'];

  handlers.forEach((name) => {
    const filePath = path.join(apiDir, `${name}.js`);
    // accept /api/name and any subpath like /api/name/123
    // accept both /api/name and /name (some middleware may strip the /api prefix)
    app.all(new RegExp(`^(?:/api)?/${name}($|/)`), async (req, res) => {
      try {
        const mod = await import(pathToFileURL(filePath).href + '') ;
        const handler = mod && (mod.default || mod);
        if (typeof handler === 'function') return handler(req, res);
        return res.status(500).json({ error: 'Handler inválido' });
      } catch (err) {
        console.warn('handler import failed:', filePath, err && err.message);
        return res.status(500).json({ error: 'Handler load failed' });
      }
    });
  });

  // Default 404 for other /api routes
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  return app;
}
