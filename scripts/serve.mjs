// Servidor estático local, sin dependencias. Uso: node scripts/serve.mjs [--port N]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HOST = '127.0.0.1';
const DEFAULT_PORT = 5174;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon',
};

export function parsePort(argv) {
  const i = argv.indexOf('--port');
  if (i === -1) return DEFAULT_PORT;
  const value = argv[i + 1];
  const port = Number(value);
  if (!value || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Puerto no válido: «${value ?? ''}». Usa un entero entre 1 y 65535.`);
  }
  return port;
}

/** Ruta absoluta dentro de la raíz del proyecto, o null si sale de ella. */
export function resolveInside(root, urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath); } catch { return null; }
  if (decoded.includes('\0')) return null;
  const target = path.resolve(root, '.' + path.posix.normalize('/' + decoded.replace(/\\/g, '/')));
  const rel = path.relative(root, target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return target;
}

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Método no permitido');
  let pathname;
  try {
    pathname = new URL(req.url, `http://${HOST}`).pathname;
  } catch {
    return send(res, 400, 'URL no válida');
  }
  let file = resolveInside(ROOT, pathname);
  if (!file) return send(res, 403, 'Ruta fuera del proyecto');
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const data = await readFile(file);
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return send(res, 404, 'No encontrado');
    send(res, 500, 'Error al leer el archivo');
  }
});

let port;
try {
  port = parsePort(process.argv.slice(2));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') console.error(`El puerto ${port} ya está en uso. Prueba con: npm start -- --port ${port + 1}`);
  else if (err.code === 'EACCES') console.error(`Sin permiso para usar el puerto ${port}. Prueba con otro: npm start -- --port 8080`);
  else console.error(`No se pudo iniciar el servidor: ${err.message}`);
  process.exit(1);
});

server.listen(port, HOST, () => {
  console.log(`Compás a compás en http://${HOST}:${port} (Ctrl+C para parar)`);
});
