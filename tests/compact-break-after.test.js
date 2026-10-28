import test from 'node:test';
import assert from 'node:assert/strict';
import { findDuplicateIds } from '../src/model/ids.js';
import { duplicateMeasures } from '../src/model/measureOps.js';
import { toggleBreakAfter } from '../src/model/song.js';
import { validateSong } from '../src/model/validate.js';
import { buildUnits } from '../src/layout/atoms.js';
import { paginate } from '../src/layout/paginate.js';
import { clone, loadDemo } from './helpers.js';

/* ---------- Filas compactas ---------- */

// Área útil 1000 × 600 sin cabecera. Cada tarjeta mide 120 de ancho (100 compacta) y el compás suma 20 de marco:
// cuatro compases de dos tarjetas miden 1070 (no caben) y compactos 910 (caben).
const BASE = { content: { width: 1000, height: 600 }, headerHeight: 0, columnGap: 10, rowGap: 10 };
const unit = (id, atoms, extra = {}) => ({ measureId: id, label: id, atoms: Array.from({ length: atoms }, (_, i) => ({ i })), ...extra });
const sizer = (card, calls = []) => (ui, from, to) => {
  calls.push([ui, from, to]);
  return { width: (to - from) * card + 20, height: 120, columns: Array.from({ length: to - from }, () => card) };
};
const run = (units, extra = {}, calls = {}) => paginate({
  ...BASE, units, measureFragment: sizer(120, calls.normal), measureCompact: sizer(100, calls.compact), ...extra,
});
const shape = (plan) => plan.pages.map((page) => page.rows.map((row) => `${row.fragments.map((f) => f.unitIndex).join(',')}${row.compact ? ' compacta' : ''}`));

test('sin medida compacta, cuatro compases de dos tarjetas que no caben siguen repartiéndose como siempre', () => {
  const units = ['a', 'b', 'c', 'd'].map((id) => unit(id, 2));
  const plan = run(units, { measureCompact: null });
  assert.deepEqual(shape(plan), [['0,1,2', '3']]);
});

test('si un compás no cabe, la fila entera se compacta y caben los cuatro', () => {
  const units = ['a', 'b', 'c', 'd'].map((id) => unit(id, 2));
  const plan = run(units);
  assert.deepEqual(plan.errors, []);
  assert.deepEqual(shape(plan), [['0,1,2,3 compacta']]);
  const [row] = plan.pages[0].rows;
  assert.deepEqual(row.fragments.map((f) => f.width), [220, 220, 220, 220], 'lo ya colocado también se vuelve a medir compacto');
  assert.deepEqual(row.fragments[0].columns, [100, 100]);
  assert.equal(row.width, 4 * 220 + 3 * 10);
});

test('una fila que cabe sin compactar no se compacta ni se mide compacta', () => {
  const calls = { normal: [], compact: [] };
  const plan = run(['a', 'b', 'c'].map((id) => unit(id, 2)), {}, calls);
  assert.deepEqual(shape(plan), [['0,1,2']]);
  assert.deepEqual(calls.compact, []);
});

test('en una fila ya compacta, lo que se añade después se mide compacto', () => {
  // a y b (4 tarjetas, 500) no caben juntos; compactos (420 + 420) sí. c (1 tarjeta) va detrás con su medida compacta (120).
  const plan = run([unit('a', 4), unit('b', 4), unit('c', 1)]);
  const [row] = plan.pages[0].rows;
  assert.equal(row.compact, true);
  assert.deepEqual(row.fragments.map((f) => f.width), [420, 420, 120]);
  assert.equal(row.width, 420 + 420 + 120 + 2 * 10);
});

test('el tope de compases por línea no se salta compactando', () => {
  const units = ['a', 'b', 'c', 'd'].map((id) => unit(id, 2));
  assert.deepEqual(shape(run(units, { maxPerRow: 3 })), [['0,1,2', '3']]);
});

test('un compás que solo cabe compacto en una fila vacía no se parte', () => {
  // 9 tarjetas: 1100 de ancho normal (no cabe), 920 compacto.
  const plan = run([unit('a', 2), unit('b', 9)]);
  assert.deepEqual(plan.errors, []);
  assert.deepEqual(shape(plan), [['0', '1 compacta']]);
  assert.deepEqual(plan.pages[0].rows[1].fragments.map((f) => [f.from, f.to]), [[0, 9]]);
});

test('una pareja de repetición cabe en la fila compactándola, sin separar sus dos destinos', () => {
  const units = [unit('a', 2), unit('b', 2), unit('c', 2, { repeatPair: 'first' }), unit('d', 2, { repeatPair: 'second' })];
  assert.deepEqual(shape(run(units)), [['0,1,2,3 compacta']]);
  assert.deepEqual(shape(run(units, { measureCompact: null })), [['0,1', '2,3']]);
});

test('compactar no deja pasar una fila que no cabe en alto', () => {
  // Cuerpo de 250: dos filas de 120 + 10 de separación caben; una tercera no. Compactar no cambia la altura.
  const units = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'].map((id) => unit(id, 2));
  const plan = run(units, { content: { width: 1000, height: 250 } });
  assert.deepEqual(plan.errors, []);
  assert.deepEqual(shape(plan), [['0,1,2,3 compacta', '4,5,6,7 compacta'], ['8']]);
});

test('invariantes con 300 repartos aleatorios compactables: orden, cobertura, ajuste y filas compactas medidas compactas', () => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let compacted = 0;
  for (let n = 0; n < 300; n++) {
    const units = Array.from({ length: 1 + Math.floor(rnd() * 14) }, (_, i) => unit(`m${i}`, Math.floor(rnd() * 12), rnd() < 0.15 ? { breakAfter: true } : {}));
    const cards = units.map(() => 60 + Math.floor(rnd() * 140));
    const height = 600 + Math.floor(rnd() * 400);
    const size = (shrink) => (ui, from, to) => ({ width: (to - from) * (cards[ui] - shrink) + 20, height: 100 + (ui % 3) * 40 });
    const plan = paginate({ ...BASE, content: { width: 1000, height }, units, measureFragment: size(0), measureCompact: size(8), maxPerRow: n % 4 });
    const frags = plan.pages.flatMap((page) => page.rows.flatMap((row) => row.fragments.map((f) => ({ ...f, compact: row.compact }))));
    const order = frags.map((f) => f.unitIndex);
    assert.deepEqual(order, [...order].sort((a, b) => a - b), `reparto ${n}: orden`);
    units.forEach((u, ui) => {
      const parts = frags.filter((f) => f.unitIndex === ui);
      assert.equal(parts[0].from, 0);
      for (let i = 1; i < parts.length; i++) assert.equal(parts[i].from, parts[i - 1].to, `reparto ${n}: contiguos`);
      assert.equal(parts[parts.length - 1].to, u.atoms.length, `reparto ${n}: cubre todas las tarjetas`);
    });
    for (const f of frags) assert.equal(f.width, size(f.compact ? 8 : 0)(f.unitIndex, f.from, f.to).width, `reparto ${n}: medida del modo de su fila`);
    for (const page of plan.pages) {
      assert.ok(page.rows.length > 0, `reparto ${n}: sin hojas vacías`);
      if (page.overflow) continue;
      for (const row of page.rows) {
        assert.ok(row.width <= 1000, `reparto ${n}: ancho de fila`);
        if (n % 4) assert.ok(new Set(row.fragments.map((f) => f.unitIndex)).size <= n % 4, `reparto ${n}: tope por línea`);
        compacted += row.compact ? 1 : 0;
      }
      // Tras un salto de línea después, el compás siguiente empieza fila.
      page.rows.forEach((row) => row.fragments.slice(1).forEach((f) => {
        if (f.from === 0) assert.ok(!units[f.unitIndex - 1]?.breakAfter, `reparto ${n}: salto después respetado`);
      }));
    }
  }
  assert.ok(compacted > 20, 'el muestreo ejercita filas compactas');
});

/* ---------- Salto de línea después ---------- */

// Área útil 1000 × 600 sin cabecera; cada compás mide 220 × 120: caben cuatro por fila.
const layout = (song) => paginate({
  units: buildUnits(song), measureFragment: () => ({ width: 220, height: 120 }),
  content: { width: 1000, height: 600 }, headerHeight: 0, columnGap: 10, rowGap: 10,
});
const rows = (song) => layout(song).pages.flatMap((page) => page.rows.map((row) => row.fragments.map((f) => song.measures[f.unitIndex].label)));
const fourMeasures = () => {
  const song = clone(loadDemo());
  song.structure = { repeats: [], endings: [], markers: [], jumps: [] };
  return song;
};
const valid = (song) => {
  assert.deepEqual(validateSong(song).errors, []);
  assert.deepEqual(findDuplicateIds(song), []);
};

test('con salto de línea después, el compás siguiente empieza otra línea aunque quepa en la anterior', () => {
  const song = fourMeasures();
  toggleBreakAfter(song, ['m2']);
  assert.equal(song.measures[1].breakAfter, true);
  assert.equal(buildUnits(song)[1].breakAfter, true);
  assert.deepEqual(rows(song), [['1', '2'], ['3', '4']]);
  valid(song);
});

test('el salto de línea después en el último compás no crea una línea vacía', () => {
  const song = fourMeasures();
  song.measures[3].breakAfter = true;
  assert.deepEqual(rows(song), [['1', '2', '3', '4']]);
});

test('salto después de un compás y antes del siguiente dan una sola línea nueva', () => {
  const song = fourMeasures();
  song.measures[1].breakAfter = true;
  song.measures[2].breakBefore = true;
  assert.deepEqual(rows(song), [['1', '2'], ['3', '4']]);
});

test('el salto de línea después en el primer destino de una repetición de dos compases no separa la pareja', () => {
  const song = fourMeasures();
  song.measures[3].chordEvents = [];
  song.measures[2].chordEvents = [];
  song.measures[2].repeatPreviousTwo = { sourceMeasureIds: ['m1', 'm2'], targetMeasureIds: ['m3', 'm4'] };
  valid(song);
  song.measures[2].breakAfter = true;
  assert.deepEqual(rows(song), [['1', '2', '3', '4']]);
  song.measures[1].breakAfter = true;
  assert.deepEqual(rows(song), [['1', '2'], ['3', '4']]);
});

test('activar y quitar el salto de línea después de varios compases a la vez', () => {
  const song = fourMeasures();
  song.measures[0].breakAfter = true;
  assert.equal(toggleBreakAfter(song, ['m1', 'm3']).on, true, 'si falta en alguno, se activa en todos');
  assert.deepEqual(song.measures.map((m) => m.breakAfter === true), [true, false, true, false]);
  assert.equal(toggleBreakAfter(song, ['m1', 'm3']).on, false);
  assert.deepEqual(song.measures.map((m) => 'breakAfter' in m), [false, false, false, false], 'quitar no deja el campo a false');
  assert.deepEqual(song.measures.map((m) => 'breakBefore' in m), [false, false, false, false], 'no toca el salto de antes');
});

test('el salto de línea después se valida como booleano y las copias de un compás no lo heredan', () => {
  const song = fourMeasures();
  song.measures[1].breakAfter = 1;
  assert.ok(validateSong(song).errors.some((e) => e.path === 'measures[1].breakAfter'));
  song.measures[1].breakAfter = true;
  valid(song);
  const { ids } = duplicateMeasures(song, ['m2'], { renumber: false });
  const copy = song.measures.find((m) => m.id === ids[0]);
  assert.equal('breakAfter' in copy, false);
  assert.equal(song.measures[1].breakAfter, true);
});
