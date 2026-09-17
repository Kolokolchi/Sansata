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

const server = createServer(async (req, res) => {
  if (req.url?.startsWith('/api/')) {
    return api(req, res, () => {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
    });
  }

  try {
    const pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
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
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Accept-Ranges', 'bytes');

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
      createReadStream(file, { start, end }).pipe(res);
    } else {
      res.setHeader('Content-Length', fileInfo.size);
      createReadStream(file).pipe(res);
    }
  } catch {
    res.statusCode = 500;
    res.end('Server error');
  }
});

const port = Number(process.env.PORT || 4173);
server.listen(port, '127.0.0.1', () => {
  console.log(`Shattyq server running: http://127.0.0.1:${port}`);
});
