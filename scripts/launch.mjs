// Lanzador para doble clic (Abrir-Compas.cmd), sin dependencias. Uso: node scripts/launch.mjs
// Reutiliza el servidor de Compás a compás si ya responde; si no, arranca scripts/serve.mjs
// como proceso hijo de esta consola, espera a que responda por HTTP y abre el navegador.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const URL_APP = 'http://127.0.0.1:5174';
export const APP_NAME = 'compas-a-compas';
export const START_TIMEOUT_MS = 10000;
const PROBE_TIMEOUT_MS = 1500;
const POLL_INTERVAL_MS = 150;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Qué hay en la URL: 'compas' (nuestro servidor), 'none' (nadie escucha) u 'other'
 * (otra aplicación, respuesta lenta o inesperada). `fetchImpl` permite probarlo con un stub.
 */
export async function probeServer(url = URL_APP, { fetchImpl = fetch, timeoutMs = PROBE_TIMEOUT_MS } = {}) {
  try {
    const res = await fetchImpl(`${url}/package.json`, { signal: AbortSignal.timeout(timeoutMs), cache: 'no-store' });
    if (!res.ok) return 'other';
    const data = await res.json();
    return data && data.name === APP_NAME ? 'compas' : 'other';
  } catch (err) {
    const code = err?.cause?.code ?? err?.code;
    return code === 'ECONNREFUSED' ? 'none' : 'other';
  }
}

/**
 * Sondea hasta que responda nuestro servidor. Devuelve 'ready', 'other' (el puerto lo usa
 * otra cosa), 'aborted' (shouldStop() true) o 'timeout'. Reloj y espera inyectables.
 */
export async function waitForServer({
  probe = () => probeServer(),
  timeoutMs = START_TIMEOUT_MS,
  intervalMs = POLL_INTERVAL_MS,
  shouldStop = () => false,
  now = Date.now,
  sleep = wait,
} = {}) {
  const limit = now() + timeoutMs;
  for (;;) {
    if (shouldStop()) return 'aborted';
    const state = await probe();
    if (state === 'compas') return 'ready';
    if (state === 'other') return 'other';
    if (now() >= limit) return 'timeout';
    await sleep(intervalMs);
  }
}

/**
 * Abre la URL en el navegador predeterminado de Windows sin pasar por cmd.
 * Resuelve true al crearse el proceso y false si falla el arranque (error asíncrono o excepción).
 */
export function openBrowser(url = URL_APP, { spawnImpl = spawn } = {}) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      resolve(ok);
    };
    try {
      const child = spawnImpl('rundll32.exe', ['url.dll,FileProtocolHandler', url], {
        stdio: 'ignore',
        detached: true,
        windowsHide: true,
      });
      child.once('error', () => finish(false));
      child.once('spawn', () => {
        child.unref?.();
        finish(true);
      });
    } catch {
      finish(false);
    }
  });
}

/** true si el navegador se abrió; si falla o lanza, indica la URL para abrirla a mano. */
async function tryOpen(openImpl) {
  let ok = false;
  try {
    ok = (await openImpl(URL_APP)) !== false;
  } catch {
    ok = false;
  }
  if (!ok) console.error(`No se pudo abrir el navegador. Abre esta dirección a mano: ${URL_APP}`);
  return ok;
}

function busyMessage() {
  console.error('El puerto 5174 lo usa otra aplicación, no Compás a compás. No se ha cerrado nada.');
  console.error('Cierra esa aplicación o arranca a mano en otro puerto: npm start -- --port 8080');
}

/** Servidor de Compás ya en marcha (de otro lanzador): solo abre el navegador. */
async function reuse(openImpl) {
  console.log(`Compás a compás ya estaba en marcha. Abriendo ${URL_APP}`);
  return (await tryOpen(openImpl)) ? 0 : 1;
}

/** Devuelve el código de salida del proceso. */
export async function main({ openImpl = openBrowser, probe = probeServer } = {}) {
  const first = await probe(URL_APP);
  if (first === 'compas') return reuse(openImpl);
  if (first === 'other') {
    busyMessage();
    return 1;
  }

  console.log('Iniciando Compás a compás...');
  const child = spawn(process.execPath, [path.join(ROOT, 'scripts', 'serve.mjs')], { cwd: ROOT, stdio: 'inherit' });
  let exited = false;
  let stopping = false;
  const exitPromise = new Promise((resolve) => {
    child.on('error', (err) => {
      console.error(`No se pudo iniciar el servidor: ${err.message}`);
      exited = true;
      resolve(1);
    });
    child.on('exit', (code) => {
      exited = true;
      resolve(code ?? 1);
    });
  });
  const stop = () => {
    stopping = true;
    if (!exited) child.kill();
  };
  const signals = ['SIGINT', 'SIGTERM', 'SIGBREAK'];
  for (const s of signals) process.on(s, stop);

  try {
    const result = await waitForServer({ probe: () => probe(URL_APP), shouldStop: () => exited || stopping });

    if (result === 'ready' && !exited) {
      console.log('Servidor listo. Esta ventana es el servidor: ciérrala o pulsa Ctrl+C para detener la aplicación.');
      if (await tryOpen(openImpl)) console.log('Navegador abierto.');
      const code = await exitPromise;
      return stopping ? 0 : code;
    }

    if (result === 'ready' || result === 'aborted') {
      if (stopping) {
        await exitPromise;
        return 0;
      }
      // El hijo terminó solo; si hay un servidor de Compás es el de otro doble clic que ganó la carrera.
      await exitPromise;
      const now = await probe(URL_APP);
      if (now === 'compas') return reuse(openImpl);
      if (now === 'other') busyMessage();
      else console.error('El servidor se cerró antes de responder.');
      return 1;
    }

    stop();
    await exitPromise;
    if (result === 'other') busyMessage();
    else console.error(`El servidor no respondió en ${START_TIMEOUT_MS / 1000} s y se ha detenido.`);
    return 1;
  } finally {
    for (const s of signals) process.off(s, stop);
    if (!exited) child.kill();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      console.error(`Error inesperado en el lanzador: ${err?.message ?? err}`);
      process.exit(1);
    },
  );
}
