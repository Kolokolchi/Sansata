import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createApiRouter } from './apiRouter.mjs';

const root = resolve('dist');
const api = createApiRouter();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jfif': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.ttf': 'font/ttf',
  '.glb': 'model/gltf-binary'
};

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self'; connect-src 'self' https:; media-src 'self'; frame-src 'self' https://lumalabs.ai https://*.lumalabs.ai; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
};

export function createAppServer({ root = resolve('dist'), api = createApiRouter() } = {}) {
  const server = createServer(async (req, res) => {
    if (req.url?.startsWith('/api/')) {
      return api(req, res, () => {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
      });
    }

    // Для статических файлов разрешены строго GET и HEAD
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405;
      res.setHeader('Allow', 'GET, HEAD');
      return res.end('Method Not Allowed');
    }

    try {
      let pathname;
      try {
        pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
      } catch {
        res.statusCode = 400;
        return res.end('Bad Request');
      }

      // Защита от обращения к скрытым файлам (.env, .git, .DS_Store и т.д.)
      if (pathname.split('/').some(segment => segment.startsWith('.'))) {
        res.statusCode = 403;
        return res.end('Access denied');
      }

      let file = resolve(root, '.' + pathname);

      // Защита от выхода за пределы корневой папки (Path Traversal)
      if (file !== root && !file.startsWith(root + sep)) {
        res.statusCode = 403;
        return res.end('Access denied');
      }

      let fileInfo = await stat(file).catch(() => null);

      // SPA Fallback на index.html для роутов без расширения файла
      if (!fileInfo?.isFile()) {
        if (extname(pathname)) {
          res.statusCode = 404;
          return res.end('Not found');
        }
        file = resolve(root, 'index.html');
        fileInfo = await stat(file);
      }

      const contentType = mimeTypes[extname(file)] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      for (const [header, val] of Object.entries(securityHeaders)) {
        res.setHeader(header, val);
      }
      res.setHeader('Accept-Ranges', 'bytes');

      if (req.method === 'HEAD') {
        res.setHeader('Content-Length', fileInfo.size);
        return res.end();
      }

      // Поддержка Range-запросов (206 Partial Content) для аудио и видео
      const rangeHeader = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
      if (rangeHeader) {
        const start = Number(rangeHeader[1]);
        const end = rangeHeader[2] ? Math.min(Number(rangeHeader[2]), fileInfo.size - 1) : fileInfo.size - 1;

        if (start > end || start >= fileInfo.size) {
          res.writeHead(416, { 'Content-Range': `bytes */${fileInfo.size}` });
          return res.end();
        }

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileInfo.size}`,
          'Content-Length': end - start + 1
        });
        const stream = createReadStream(file, { start, end });
        stream.on('error', () => {
          stream.destroy();
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Server error' }));
          } else {
            res.destroy();
          }
        });
        stream.pipe(res);
      } else {
        res.setHeader('Content-Length', fileInfo.size);
        const stream = createReadStream(file);
        stream.on('error', () => {
          stream.destroy();
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Server error' }));
          } else {
            res.destroy();
          }
        });
        stream.pipe(res);
      }
    } catch {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'Server error' }));
      } else {
        res.destroy();
      }
    }
  });

  // Защита от Slowloris: явные таймауты сокетов и заголовков
  server.headersTimeout = 5000;
  server.requestTimeout = 10000;
  server.keepAliveTimeout = 5000;

  return server;
}

export const server = createAppServer({ root, api });

const port = Number(process.env.PORT || 4173);
if (
  process.argv[1] &&
  (process.argv[1].endsWith('server\\index.mjs') ||
   process.argv[1].endsWith('server/index.mjs') ||
   process.argv[1].endsWith('index.mjs'))
) {
  server.listen(port, '127.0.0.1', () => {
    console.log(`Shattyq server running: http://127.0.0.1:${port}`);
  });
}

