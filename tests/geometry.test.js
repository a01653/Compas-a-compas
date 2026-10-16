import test from 'node:test';
import assert from 'node:assert/strict';
import { GEOM, findUndrawableVoicings, fretRange, layoutFretboard, spanMessage } from '../src/geometry/fretboard.js';
import { clone, loadDemo } from './helpers.js';

const x = null;

function assertFinite(value, path = 'layout') {
  if (typeof value === 'number') assert.ok(Number.isFinite(value), `${path} no es finito`);
  else if (Array.isArray(value)) value.forEach((v, i) => assertFinite(v, `${path}[${i}]`));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => assertFinite(v, `${path}.${k}`));
}

test('casos geométricos de DISENO.md: trastes visibles', () => {
  const cases = [
    [[x, 3, 5, 3, 4, 3], 3, 5, false],
    [[x, 3, 6, 4, 5, 3], 3, 6, false],
    [[0, 2, 2, 1, 0, 0], 1, 3, true],
    [[0, 2, 2, 4, 0, 0], 1, 4, true],
    [[x, 10, 12, 10, 11, 10], 10, 12, false],
    [[x, x, x, x, x, x], 1, 3, false],
  ];
  for (const [frets, start, end, hasOpen] of cases) {
    const r = fretRange(frets);
    assert.equal(r.start, start, JSON.stringify(frets));
    assert.equal(r.end, end, JSON.stringify(frets));
    assert.equal(r.count, end - start + 1);
    assert.equal(r.hasOpen, hasOpen);
    assert.ok(r.count >= GEOM.minFrets);
  }
});

test('con cuerdas al aire hay cejuela y se amplía hasta la nota más alta', () => {
  const g = layoutFretboard([0, 2, 2, 4, 0, 0]);
  assert.equal(g.start, 1);
  assert.equal(g.count, 4);
  assert.equal(g.fretLines[0].nut, true);
  assert.ok(g.fretLines.slice(1).every((l) => !l.nut));
  const noOpen = layoutFretboard([x, 3, 5, 3, 4, 3]);
  assert.equal(noOpen.fretLines[0].nut, false);
});

test('los puntos quedan centrados entre dos divisiones de traste', () => {
  for (const frets of [[x, 3, 5, 3, 4, 3], [x, 10, 12, 10, 11, 10], [0, 2, 2, 4, 0, 0], [x, 3, 6, 4, 5, 3]]) {
    const g = layoutFretboard(frets);
    for (const mark of g.marks.filter((m) => m.kind === 'dot')) {
      const k = mark.fret - g.start;
      const left = g.fretLines[k].x;
      const right = g.fretLines[k + 1].x;
      assert.equal(mark.x, (left + right) / 2, `traste ${mark.fret} de ${JSON.stringify(frets)}`);
    }
  }
});

test('primera cuerda arriba y sexta abajo sin invertir los datos', () => {
  const frets = [x, x, x, x, x, 7];
  const g = layoutFretboard(frets);
  const dot = g.marks.find((m) => m.kind === 'dot');
  assert.equal(dot.y, GEOM.padTop, 'frets[5] (primera cuerda) va en la línea superior');
  const sixth = layoutFretboard([7, x, x, x, x, x]).marks.find((m) => m.kind === 'dot');
  assert.equal(sixth.y, GEOM.padTop + 5 * GEOM.gap, 'frets[0] (sexta) va en la línea inferior');
  assert.deepEqual(frets, [x, x, x, x, x, 7], 'la digitación recibida no se modifica');
});

test('cuerdas al aire y mudas quedan fuera de la rejilla, a la izquierda', () => {
  const g = layoutFretboard([0, x, 2, 0, x, 3]);
  const first = g.fretLines[0].x;
  const outside = g.marks.filter((m) => m.kind !== 'dot');
  assert.equal(outside.length, 4);
  assert.ok(outside.every((m) => m.x < first));
  assert.equal(g.marks.filter((m) => m.kind === 'open').length, 2);
  assert.equal(g.marks.filter((m) => m.kind === 'mute').length, 2);
});

test('trastes de dos cifras: etiquetas reales y 4 o más trastes sin recortar', () => {
  const g = layoutFretboard([x, 10, 12, 10, 11, 10]);
  assert.deepEqual(g.labels.map((l) => l.text), ['10', '11', '12']);
  const wide = layoutFretboard([x, 3, 7, 4, 5, 3]); // 3–7: 5 trastes
  assert.equal(wide.count, 5);
  assert.equal(wide.labels.length, 5);
  assert.equal(wide.marks.filter((m) => m.kind === 'dot').length, 5);
  assert.ok(wide.width > layoutFretboard([x, 3, 5, 3, 4, 3]).width, 'el ancho crece con los trastes');
});

test('todas mudas, todas al aire y mezclas no producen NaN ni puntos falsos', () => {
  for (const frets of [[x, x, x, x, x, x], [0, 0, 0, 0, 0, 0], [0, x, 0, x, 0, x], [1, 1, 1, 1, 1, 1], [0, 0, 0, 0, 0, 12]]) {
    const g = layoutFretboard(frets);
    assertFinite(g);
    assert.equal(g.drawable, true);
    assert.equal(g.marks.length, 6);
  }
  assert.equal(layoutFretboard([x, x, x, x, x, x]).marks.filter((m) => m.kind === 'dot').length, 0);
  assert.equal(layoutFretboard([0, 0, 0, 0, 0, 0]).marks.filter((m) => m.kind === 'dot').length, 0);
  const allOpen = fretRange([0, 0, 0, 0, 0, 0]);
  assert.deepEqual([allOpen.start, allOpen.count], [1, 3]);
});

test('valores inválidos recibidos no dibujan puntos ni rompen el cálculo', () => {
  const g = layoutFretboard([1.5, -2, 'x', NaN, undefined, 3]);
  assertFinite(g);
  assert.equal(g.marks.filter((m) => m.kind === 'dot').length, 1);
  assert.deepEqual(fretRange(undefined), { start: 1, count: 3, end: 3, hasOpen: false });
});

test('límite de legibilidad: GEOM.maxFrets se dibuja y maxFrets+1 no, sin perder datos', () => {
  const max = GEOM.maxFrets;
  const frets = [1, x, x, x, x, max];
  const ok = layoutFretboard(frets);
  assert.equal(ok.drawable, true);
  assert.equal(ok.count, max);
  assert.equal(ok.labels.length, max);
  const tooWide = [1, x, x, x, x, max + 1];
  const bad = layoutFretboard(tooWide);
  assert.equal(bad.drawable, false);
  assert.match(bad.reason, new RegExp(`${max + 1} trastes`));
  assert.match(bad.reason, /datos se conservan/);
  assert.deepEqual(tooWide, [1, x, x, x, x, max + 1], 'las notas no se tocan');
});

test('el máximo cabe en una fila A4 apaisada (1123 px menos márgenes y relleno de la hoja)', () => {
  const usable = 1123 - 64 - 48;
  assert.ok(GEOM.zone + GEOM.maxFrets * GEOM.cell + 4 <= usable);
  assert.ok(GEOM.zone + (GEOM.maxFrets + 1) * GEOM.cell + 4 > usable - GEOM.cell, 'no queda holgura para otro traste entero');
  assert.equal(layoutFretboard([1, x, x, x, x, GEOM.maxFrets]).width, GEOM.zone + GEOM.maxFrets * GEOM.cell + 4);
});

test('la geometría pura no usa require ni importa módulos de interfaz', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../src/geometry/fretboard.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\brequire\s*\(/);
  assert.doesNotMatch(source, /^import\s/m);
});

test('spans absurdos no construyen listas por traste y devuelven al instante', () => {
  for (const big of [99, 1e6, 1e9, Number.MAX_SAFE_INTEGER, 1e21]) {
    const t0 = Date.now();
    const g = layoutFretboard([1, x, x, x, x, big]);
    assert.ok(Date.now() - t0 < 200, `tardó demasiado con ${big}`);
    assert.equal(g.drawable, false);
    assert.deepEqual([g.fretLines.length, g.labels.length, g.marks.length, g.strings.length], [0, 0, 0, 0]);
    assertFinite({ w: g.width, h: g.height });
  }
  assert.match(spanMessage(fretRange([1, x, x, x, x, 1e9])), /más de 9999 trastes/);
  assert.equal(spanMessage(fretRange([x, 3, 5, 3, 4, 3])), null);
});

test('findUndrawableVoicings localiza tarjetas ilegibles sin modificar la canción', () => {
  const song = clone(loadDemo());
  assert.deepEqual(findUndrawableVoicings(song), []);
  song.measures[1].chordEvents[0].voicings[0].frets = [1, null, null, null, null, 40];
  const before = JSON.stringify(song);
  const found = findUndrawableVoicings(song);
  assert.equal(found.length, 1);
  assert.equal(found[0].measureLabel, '2');
  assert.equal(found[0].chordName, 'F7');
  assert.equal(found[0].voicingId, 'v3');
  assert.equal(JSON.stringify(song), before);
});

test('grados manuales llegan al punto y a la cuerda al aire; las mudas no los dibujan', () => {
  const g = layoutFretboard([0, x, 2, 0, 1, 3], ['1', '5', 'b3', null, '', '9']);
  const byY = (y) => g.marks.find((m) => m.y === y);
  assert.equal(byY(GEOM.padTop).degree, '9', 'primera cuerda = último grado');
  assert.equal(byY(GEOM.padTop + 5 * GEOM.gap).kind, 'open');
  assert.equal(byY(GEOM.padTop + 5 * GEOM.gap).degree, '1', 'cuerda al aire con grado');
  const mute = g.marks.find((m) => m.kind === 'mute');
  assert.equal(mute.degree, null, 'la cuerda muda no dibuja su grado');
  assert.equal(g.marks.find((m) => m.fret === 1).degree, null, 'cadena vacía = sin grado');
  const fourth = g.marks.find((m) => m.y === GEOM.padTop + 2 * GEOM.gap); // frets[3], al aire, grado null
  assert.equal(fourth.kind, 'open');
  assert.equal(fourth.degree, null, 'null = sin grado');
  assert.equal(g.marks.find((m) => m.y === GEOM.padTop + 3 * GEOM.gap).degree, 'b3');
});
