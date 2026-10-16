import test from 'node:test';
import assert from 'node:assert/strict';
import { collectProblems } from '../src/layout/problems.js';
import { ZOOM_MIN, ZOOM_MAX, clampZoom, fitZoom } from '../src/layout/zoom.js';
import { MM_PX, PAGE, PAGE_PX, pageStyleVars } from '../src/layout/spec.js';
import { songSample } from '../src/layout/fonts.js';
import { GEOM } from '../src/geometry/fretboard.js';

const song = (frets) => ({
  measures: [{ id: 'm1', label: '7', chordEvents: [{ id: 'e1', chordName: 'Xm', voicings: [{ id: 'v1', frets }] }] }],
});

test('una digitación que supera el máximo de trastes bloquea y conserva los datos', () => {
  const s = song([null, 1, 40, null, null, null]);
  const before = JSON.stringify(s);
  const problems = collectProblems(s, null);
  assert.equal(problems.length, 1);
  assert.equal(problems[0].kind, 'undrawable');
  assert.match(problems[0].message, /Compás 7.*Xm.*40 trastes/);
  assert.equal(JSON.stringify(s), before, 'no se modifica ninguna nota');
});

test('exactamente el máximo de trastes no bloquea', () => {
  const frets = [null, 1, GEOM.maxFrets, null, null, null];
  assert.deepEqual(collectProblems(song(frets), { errors: [] }), []);
  assert.equal(collectProblems(song([null, 1, GEOM.maxFrets + 1, null, null, null]), { errors: [] }).length, 1);
});

test('los errores de reparto también bloquean, con su mensaje', () => {
  const layout = { errors: [{ kind: 'width', message: 'Compás 7: la tarjeta 1 no cabe.' }, { kind: 'header', message: 'Cabecera.' }] };
  const problems = collectProblems(song([null, null, null, null, null, null]), layout);
  assert.deepEqual(problems.map((p) => p.kind), ['width', 'header']);
});

test('ajustar al ancho cabe en 360 px: el contenedor de 304 px ya no queda desbordado por un mínimo del 30 %', () => {
  const zoom = fitZoom(304, PAGE_PX.width);
  assert.ok(zoom < 0.3, `escala ${zoom}`);
  assert.ok(PAGE_PX.width * zoom <= 304 + 1e-9);
  assert.equal(fitZoom(0, PAGE_PX.width), ZOOM_MIN);
  assert.equal(fitZoom(100000, PAGE_PX.width), ZOOM_MAX);
  assert.equal(clampZoom(NaN), 1);
  assert.equal(clampZoom(0.01), ZOOM_MIN);
});

test('A4 apaisado en milímetros con márgenes explícitos', () => {
  assert.deepEqual([PAGE.widthMm, PAGE.heightMm, PAGE.marginMm], [297, 210, 10]);
  assert.ok(Math.abs(PAGE_PX.width - 297 * MM_PX) < 1e-9);
  const vars = pageStyleVars();
  assert.match(vars, /--hoja-w:297mm/);
  assert.match(vars, /--hoja-h:210mm/);
  assert.match(vars, /--hoja-margen:10mm/);
  assert.doesNotMatch(vars, /794px|1123px/, 'sin píxeles redondeados que superen 210 mm');
});

test('la muestra de fuentes recoge los caracteres reales de la canción sin repetirlos', () => {
  const s = {
    title: 'Café ♭',
    key: 'Sol',
    measures: [{ label: 'Intro', chordEvents: [{ chordName: 'Cm7', aboveText: 'ñ', insideText: '×', voicings: [{ degrees: ['b3', null] }] }] }],
  };
  const sample = songSample(s);
  for (const ch of ['é', '♭', 'ñ', '×', 'C', 'b']) assert.ok(sample.includes(ch), ch);
  assert.equal(sample.length, new Set(sample).size);
});
