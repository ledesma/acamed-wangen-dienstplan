import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

export function spaFallback(): Plugin {
  const root = process.cwd();
  const indexPath = path.resolve(root, 'index.html');

  return {
    name: 'spa-fallback',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method === 'GET' && (req.url === '/index.html' || (req.url !== '/' && !req.url.includes('.') && !req.url.startsWith('/@') && !req.url.startsWith('/node_modules/')))) {
          try {
            const rawHtml = fs.readFileSync(indexPath, 'utf-8');
            const html = await server.transformIndexHtml(req.url, rawHtml);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
          } catch {
            next();
          }
        } else {
          next();
        }
      });
    }
  };
}
