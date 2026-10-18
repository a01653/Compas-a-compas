import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const index = readFileSync(new URL('index.html', root), 'utf8');
const link = /<a\b[^>]*id="btn-manual"[^>]*>/.exec(index)?.[0] ?? '';
const attribute = (tag, name) => new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1];
const PDF = 'docs/latex/Manual_Uso_Compas_a_compas.pdf';

test('el botón Manual abre la página de ayuda en otra pestaña con una ruta relativa', () => {
  assert.ok(link, 'index.html tiene el botón #btn-manual');
  const href = attribute(link, 'href');
  assert.equal(href, 'ayuda/index.html');
  assert.doesNotMatch(href, /^([a-z]+:)?\/\//i, 'sin esquema ni host');
  assert.doesNotMatch(href, /^\//, 'sin barra inicial: funciona bajo la URL de GitHub Pages');
  assert.equal(attribute(link, 'target'), '_blank');
  assert.match(attribute(link, 'rel'), /noopener/);
  assert.equal(attribute(link, 'data-icon'), 'book');
  assert.doesNotMatch(link, /download=|\.pdf/, 'el botón abre una página, no descarga el PDF');
  assert.ok(existsSync(new URL(href, root)), 'la página de ayuda existe');
});

test('la página de ayuda es HTML con rutas relativas y un enlace al PDF', () => {
  const page = readFileSync(new URL('ayuda/index.html', root), 'utf8');
  assert.match(page, /^<!doctype html>/i);
  assert.match(page, /<title>[^<]*Manual de uso/);
  const pdfLink = /<a\b[^>]*id="enlace-pdf"[^>]*>/.exec(page)?.[0] ?? '';
  assert.equal(attribute(pdfLink, 'href'), `../${PDF}`, 'enlace relativo al PDF desde ayuda/');
  assert.doesNotMatch(pdfLink, /download=/);
  assert.ok(existsSync(new URL(attribute(pdfLink, 'href'), new URL('ayuda/index.html', root))));
  assert.equal(readFileSync(new URL(PDF, root)).subarray(0, 5).toString(), '%PDF-');
  assert.match(page, /href="\.\.\/index\.html"/, 'vuelve a la aplicación');
  const urls = [...page.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const url of urls) {
    assert.doesNotMatch(url, /^(?:[a-z][a-z0-9+.-]*:)?\/\//i, `sin recursos externos: ${url}`);
    assert.doesNotMatch(url, /^\//, `ruta relativa: ${url}`);
    assert.ok(existsSync(new URL(url, new URL('ayuda/index.html', root))), `existe ${url}`);
  }
  assert.doesNotMatch(page, /<script/i, 'sin JavaScript');
});

test('el empaquetado de Pages incluye la ayuda y el PDF con sus rutas relativas', () => {
  const script = readFileSync(new URL('scripts/build-pages.mjs', root), 'utf8');
  assert.ok(script.includes("'ayuda'"));
  assert.ok(script.includes(`'${PDF}'`));
});

test('el enlace al manual no forma parte de las hojas ni del HTML exportado', () => {
  const offenders = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = `${dir}/${name}`;
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(js|css)$/.test(name) && /Manual_Uso|btn-manual|ayuda\/index/.test(readFileSync(path, 'utf8'))) offenders.push(path);
    }
  };
  walk(fileURLToPath(new URL('src', root)));
  assert.deepEqual(offenders, [], 'ni el renderizador ni el exportador mencionan el manual');
  assert.doesNotMatch(readFileSync(new URL('styles/export.css', root), 'utf8'), /manual/i);
});
