import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExportDocument, escapeHtml, neutralizeStyle, htmlFileName } from '../src/export/document.js';

const BODY = '<section class="hoja"><div class="hoja-titulo">Canci&oacute;n</div></section>';

test('el documento es autónomo: estilos incluidos, sin scripts ni recursos externos', () => {
  const html = buildExportDocument({ title: 'Mi canción', css: '.hoja { color: red }', bodyHtml: BODY });
  assert.match(html, /^<!doctype html>/);
  assert.match(html, /<meta charset="utf-8">/);
  assert.match(html, /<style>\n\.hoja \{ color: red \}\n<\/style>/);
  assert.ok(html.includes(BODY));
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /<link\b/i);
  assert.doesNotMatch(html, /(href|src)=["']?https?:/i);
  assert.doesNotMatch(html, /<button|<input|<textarea|<form/i, 'sin herramientas de edición');
});

test('un título con </title><script> sale escapado y no cierra la etiqueta', () => {
  const evil = '</title><script>alert(1)</script><title>';
  const html = buildExportDocument({ title: evil, css: '', bodyHtml: BODY });
  assert.doesNotMatch(html, /<script/i);
  const title = html.match(/<title>([\s\S]*?)<\/title>/);
  assert.ok(title);
  assert.equal(title[1], '&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;&lt;title&gt;');
  assert.equal((html.match(/<title>/g) || []).length, 1);
});

test('comillas, ampersands y símbolos se escapan', () => {
  assert.equal(escapeHtml(`a & b < c > "d" 'e'`), 'a &amp; b &lt; c &gt; &quot;d&quot; &#39;e&#39;');
  assert.equal(escapeHtml('♭ ♯ Cmaj7/E ×2'), '♭ ♯ Cmaj7/E ×2');
});

test('un </style> dentro de los estilos no puede cerrar el bloque', () => {
  const html = buildExportDocument({ title: 't', css: 'a{}</style><script>x</script>', bodyHtml: BODY });
  assert.equal((html.match(/<\/style>/gi) || []).length, 1, 'solo el cierre propio');
  assert.equal(neutralizeStyle('x</STYLE>'), 'x<\\/STYLE>');
});

test('un cuerpo con etiquetas activas sin escapar se rechaza', () => {
  for (const bad of ['<script>x</script>', '<SCRIPT src=x>', '< script>', '<iframe src=x></iframe>', '<link rel=stylesheet href=x>']) {
    assert.throws(() => buildExportDocument({ title: 't', css: '', bodyHtml: bad }), /no permitidas/, bad);
  }
  // El mismo texto ya escapado (como lo serializa el DOM) es contenido normal.
  const escaped = escapeHtml('</script><script>alert(1)</script>');
  assert.doesNotThrow(() => buildExportDocument({ title: 't', css: '', bodyHtml: `<div>${escaped}</div>` }));
});

test('título vacío y nombre de archivo', () => {
  assert.match(buildExportDocument({ title: '  ', css: '', bodyHtml: BODY }), /<title>Hojas de acordes<\/title>/);
  assert.equal(htmlFileName({ title: 'Canción de Prueba ¡Ñandú!' }), 'cancion-de-prueba-nandu.html');
  assert.equal(htmlFileName({ title: '' }), 'cancion.html');
});
