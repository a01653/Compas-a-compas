import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const index = readFileSync(new URL('index.html', root), 'utf8');
const link = /<a\b[^>]*id="btn-manual"[^>]*>/.exec(index)?.[0] ?? '';
const attribute = (name) => new RegExp(`${name}="([^"]*)"`).exec(link)?.[1];

test('el botón Manual de la aplicación abre el PDF en otra pestaña con una ruta relativa', () => {
  assert.ok(link, 'index.html tiene el botón #btn-manual');
  const href = attribute('href');
  assert.equal(href, 'docs/latex/Manual_Uso_Compas_a_compas.pdf');
  assert.doesNotMatch(href, /^([a-z]+:)?\/\//i, 'sin esquema ni host');
  assert.doesNotMatch(href, /^\//, 'sin barra inicial: funciona bajo la URL de GitHub Pages');
  assert.equal(attribute('target'), '_blank');
  assert.match(attribute('rel'), /noopener/);
  assert.match(attribute('data-icon'), /^book$/);
  const pdf = new URL(href, root);
  assert.ok(existsSync(pdf), 'el PDF existe en el repositorio');
  assert.equal(readFileSync(pdf).subarray(0, 5).toString(), '%PDF-');
});

test('el empaquetado de Pages incluye el PDF del manual con la misma ruta relativa', () => {
  const script = readFileSync(new URL('scripts/build-pages.mjs', root), 'utf8');
  assert.ok(script.includes(`'${attribute('href')}'`));
});

test('el enlace al manual no forma parte de las hojas ni del HTML exportado', () => {
  const offenders = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = `${dir}/${name}`;
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(js|css)$/.test(name) && /Manual_Uso|btn-manual/.test(readFileSync(path, 'utf8'))) offenders.push(path);
    }
  };
  walk(fileURLToPath(new URL('src', root)));
  assert.deepEqual(offenders, [], 'ni el renderizador ni el exportador mencionan el manual');
  assert.doesNotMatch(readFileSync(new URL('styles/export.css', root), 'utf8'), /manual/i);
});
