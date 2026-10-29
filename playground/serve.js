import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const assets = new Map([
  ['/', 'index.html'],
  ['/index.html', 'index.html'],
  ['/playground/', 'playground/index.html'],
  ['/playground/index.html', 'playground/index.html'],
  ['/playground/app.js', 'playground/app.js'],
  ['/playground/studio.css', 'playground/studio.css'],
  ['/src/index.js', 'src/index.js'],
  ['/src/motion.css', 'src/motion.css'],
]);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

/**
 * Create a playground server exposing an explicit public asset list.
 * @returns {Server} An unbound Node HTTP server; callers own its lifecycle.
 */
export function createPlaygroundServer() {
  return createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, 'http://localhost').pathname,
      );
      const asset = assets.get(pathname);
      if (!asset) {
        res.writeHead(404).end('Not found');
        return;
      }
      const canonicalRoot = await realpath(root);
      const path = await realpath(resolve(root, asset));
      if (!path.startsWith(canonicalRoot + sep)) {
        res.writeHead(404).end('Not found');
        return;
      }
      const data = await readFile(path);
      res.writeHead(200, { 'Content-Type': types[extname(path)] });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch {
      res.writeHead(404).end('Not found');
    }
  });
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT ?? 4173);
  if (!Number.isInteger(port) || port < 0 || port > 65535)
    throw new RangeError('PORT must be 0–65535');
  const server = createPlaygroundServer();
  server.on('error', (error) => {
    console.error(`Playground could not start: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () =>
    console.log(`Motion playground: http://localhost:${server.address().port}`),
  );
}
