import test from 'node:test';
import assert from 'node:assert/strict';
import { heightParts, mergeHeights, paginate, totalHeight } from '../src/layout/paginate.js';

// Área útil 1000 × 600; cabecera 100 → altura de cuerpo 500. Separaciones de 10.
const BASE = { content: { width: 1000, height: 600 }, headerHeight: 100, columnGap: 10, rowGap: 10, headerGap: 0, safety: 0 };

/** Compás de `atoms` tarjetas; cada tarjeta puede tener su propio ancho/alto. */
function unit(id, atoms, size = {}) {
  return {
    measureId: id,
    label: id.toUpperCase(),
    atoms: Array.from({ length: atoms }, (_, i) => ({ w: size.w ?? 100, h: size.h ?? 100, i })),
  };
}

/** Un fragmento mide la suma de sus tarjetas más 20 de marco (y 18 de etiqueta «continuación» si no es el primero). */
function measurer(units, calls = []) {
  return (ui, from, to) => {
    calls.push([ui, from, to]);
    const atoms = units[ui].atoms.slice(from, to);
    const width = atoms.reduce((sum, a) => sum + a.w, 0) + 20;
    const height = Math.max(0, ...atoms.map((a) => a.h)) + 20 + (from > 0 ? 18 : 0);
    return { width, height };
  };
}

const run = (units, extra = {}, calls = []) => paginate({ ...BASE, units, measureFragment: measurer(units, calls), ...extra });

/** Aplana el plan: [{ page, row, unitIndex, from, to }] en orden de lectura. */
function flat(plan) {
  const out = [];
  plan.pages.forEach((page, p) => page.rows.forEach((row, r) => row.fragments.forEach((f) => out.push({ page: p, row: r, ...f }))));
  return out;
}

test('compases pequeños comparten fila y el siguiente empieza otra cuando falta ancho', () => {
  const units = ['a', 'b', 'c', 'd', 'e'].map((id) => unit(id, 2)); // 220 de ancho cada uno
  const plan = run(units);
  assert.deepEqual(plan.errors, []);
  assert.equal(plan.pages.length, 1);
  assert.deepEqual(plan.pages[0].rows.map((r) => r.fragments.length), [4, 1]);
  assert.equal(plan.pages[0].rows[0].width, 4 * 220 + 3 * 10);
});

test('si falta altura la fila siguiente pasa a otra hoja, sin hojas finales vacías', () => {
  const units = Array.from({ length: 7 }, (_, i) => unit(`m${i}`, 9)); // 920 de ancho: uno por fila; 120 de alto
  const plan = run(units);
  assert.deepEqual(plan.errors, []);
  assert.deepEqual(plan.pages.map((p) => p.rows.length), [3, 3, 1]); // 3 filas de 120 + 2 huecos = 380 ≤ 500; la 4.ª (510) no cabe
  assert.ok(plan.pages.every((p) => p.rows.length > 0));
});

test('un compás muy poblado continúa en varias filas y hojas, contiguo y en orden, sin descartar tarjetas', () => {
  const units = [unit('a', 2), unit('b', 40), unit('c', 2)];
  const plan = run(units);
  assert.deepEqual(plan.errors, []);
  const parts = flat(plan).filter((f) => f.unitIndex === 1);
  assert.ok(parts.length >= 4, 'se parte en varios fragmentos');
  assert.equal(parts[0].from, 0);
  for (let i = 1; i < parts.length; i++) assert.equal(parts[i].from, parts[i - 1].to, 'fragmentos contiguos');
  assert.equal(parts[parts.length - 1].to, 40);
  assert.ok(new Set(parts.map((p) => `${p.page}:${p.row}`)).size === parts.length, 'cada fragmento ocupa su propia fila');
  assert.ok(new Set(parts.map((p) => p.page)).size >= 2, 'cruza de hoja');
  // El compás siguiente va después del último fragmento.
  const all = flat(plan);
  assert.equal(all[all.length - 1].unitIndex, 2);
});

test('un compás que cabe entero en una fila vacía no se parte: se mueve a la fila siguiente', () => {
  const plan = run([unit('a', 6), unit('b', 6)]); // 620 + 620 > 1000
  const frags = flat(plan);
  assert.equal(frags.length, 2);
  assert.deepEqual([frags[1].page, frags[1].row, frags[1].from, frags[1].to], [0, 1, 0, 6]);
});

test('un compás demasiado ancho empieza a partirse en el hueco que queda en la hoja actual', () => {
  const plan = run([unit('a', 2), unit('b', 30)]);
  const parts = flat(plan).filter((f) => f.unitIndex === 1);
  assert.equal(parts[0].page, 0, 'el primer fragmento aprovecha la hoja actual');
  assert.equal(parts[0].row, 1);
});

test('una tarjeta más ancha que el área útil da error visible, se conserva y la hoja queda marcada', () => {
  const plan = run([unit('a', 3, { w: 1500 })]);
  assert.equal(plan.errors.length, 3);
  assert.ok(plan.errors.every((e) => e.kind === 'width' && e.measureId === 'a'));
  assert.match(plan.errors[0].message, /Compás A.*tarjeta 1.*ancho/);
  assert.equal(plan.pages.length, 3);
  assert.ok(plan.pages.every((p) => p.overflow));
  assert.deepEqual(flat(plan).map((f) => [f.from, f.to]), [[0, 1], [1, 2], [2, 3]]);
});

test('una tarjeta más alta que el cuerpo da error de altura', () => {
  const plan = run([unit('a', 1, { h: 900 })]);
  assert.equal(plan.errors.length, 1);
  assert.equal(plan.errors[0].kind, 'height');
  assert.equal(flat(plan).length, 1);
});

test('una cabecera que no deja espacio se informa y el reparto termina igualmente', () => {
  const plan = run([unit('a', 2), unit('b', 2)], { headerHeight: 650 });
  assert.equal(plan.errors[0].kind, 'header');
  const covered = flat(plan).reduce((sum, f) => sum + (f.to - f.from), 0);
  assert.equal(covered, 4, 'ninguna tarjeta se pierde');
});

test('compás vacío y canción sin compases', () => {
  const empty = run([unit('a', 0), unit('b', 1)]);
  assert.deepEqual(empty.errors, []);
  assert.deepEqual(flat(empty).map((f) => [f.unitIndex, f.from, f.to]), [[0, 0, 0], [1, 0, 1]]);
  const none = run([]);
  assert.equal(none.pages.length, 1, 'siempre hay al menos una hoja');
  assert.equal(none.pages[0].rows.length, 0);
});

test('el margen de seguridad evita llenar la fila hasta el último píxel', () => {
  const one = (extra) => run([unit('a', 1, { w: 979 })], extra); // 999 de ancho
  assert.deepEqual(one({ safety: 0 }).errors, []);
  assert.deepEqual(one({ safety: 1 }).errors, []);
  assert.equal(run([unit('a', 1, { w: 981 })], { safety: 1 }).errors.length, 1, '1001 > 999');
});

test('las medidas se piden con rangos válidos y sin repetir', () => {
  const units = [unit('a', 2), unit('b', 40), unit('c', 0)];
  const calls = [];
  run(units, {}, calls);
  const keys = calls.map((c) => c.join(':'));
  assert.equal(new Set(keys).size, keys.length, 'sin medidas repetidas');
  for (const [ui, from, to] of calls) {
    assert.ok(from >= 0 && from <= to && to <= units[ui].atoms.length);
  }
});

/* ---------- Alturas por pistas compartidas (marcas, títulos, franjas, zona del compás) ---------- */

/** Compás de `atoms` tarjetas de 100 de ancho cuya altura medida se desglosa en `rows`. */
function tracked(id, rows, atoms = 4) {
  return { measureId: id, label: id.toUpperCase(), rows, atoms: Array.from({ length: atoms }, () => ({})) };
}
function trackedMeasurer(units) {
  return (ui, from, to) => {
    const { rows } = units[ui];
    return { width: (to - from) * 100 + 50, height: rows.reduce((a, b) => a + b, 0), rows };
  };
}
const runTracked = (units, extra = {}) => paginate({ ...BASE, units, measureFragment: trackedMeasurer(units), ...extra });

test('heightParts y mergeHeights: sin desglose es una sola pista y el resto se combina por pistas', () => {
  assert.deepEqual(heightParts({ width: 1, height: 80 }), { rows: [80], extra: 0 });
  assert.deepEqual(heightParts({ width: 1, height: 100, rows: [10, 20, 30] }), { rows: [10, 20, 30], extra: 40 });
  assert.deepEqual(heightParts({ width: 1, height: 60, rows: [10, NaN, -5, 50], extra: 3 }), { rows: [10, 0, 0, 50], extra: 3 });
  const merged = mergeHeights({ rows: [0, 60, 0, 100], extra: 0 }, { rows: [20, 0, 0, 150], extra: 4 });
  assert.deepEqual(merged, { rows: [20, 60, 0, 150], extra: 4 });
  assert.equal(totalHeight(merged), 234);
  assert.deepEqual(mergeHeights({ rows: [], extra: 0 }, { rows: [5], extra: 0 }), { rows: [5], extra: 0 }, 'primera fila: sin pistas previas');
  assert.deepEqual(mergeHeights({ rows: [7], extra: 0 }, { rows: [0, 0, 0, 9], extra: 0 }), { rows: [7, 0, 0, 9], extra: 0 }, 'longitudes distintas');
});

test('una fila suma el máximo de cada pista: puede superar al máximo de las alturas individuales', () => {
  const units = [tracked('a', [0, 60, 0, 100], 4), tracked('b', [0, 0, 0, 150], 4)]; // 160 y 150 por separado
  const plan = runTracked(units);
  assert.deepEqual(plan.errors, []);
  assert.deepEqual(plan.pages[0].rows.map((r) => r.fragments.length), [2]);
  assert.equal(plan.pages[0].rows[0].height, 210, '60 de título de uno + 150 de tarjetas del otro');
  assert.deepEqual(plan.pages[0].rows[0].heights.rows, [0, 60, 0, 150]);
});

test('el salto de hoja cuenta la altura combinada, no la mayor individual', () => {
  // Cada fila [a, b] mide 210. Con el máximo individual (160) cabrían tres filas (500); con la suma solo dos (430).
  const units = ['a', 'b', 'a', 'b', 'a', 'b'].map((kind, i) => tracked(`m${i}`, kind === 'a' ? [0, 60, 0, 100] : [0, 0, 0, 150], 4));
  const plan = runTracked(units);
  assert.deepEqual(plan.errors, []);
  assert.deepEqual(plan.pages.map((p) => p.rows.length), [2, 1]);
  for (const page of plan.pages) {
    const used = page.rows.reduce((sum, r) => sum + r.height, 0) + (page.rows.length - 1) * BASE.rowGap;
    assert.ok(used <= plan.bodyHeight, `la hoja no invade el pie (${used} ≤ ${plan.bodyHeight})`);
  }
});

test('un compás que cabe en ancho pero cuya combinación no cabe en alto pasa a la fila o hoja siguiente', () => {
  const units = [tracked('a', [0, 350, 0, 100], 2), tracked('b', [0, 0, 0, 160], 2)]; // 450 y 160; juntos 510 > 500
  const plan = runTracked(units);
  assert.deepEqual(plan.errors, []);
  assert.deepEqual(flat(plan).map((f) => [f.page, f.row, f.unitIndex]), [[0, 0, 0], [1, 0, 1]]);
});

test('compases vacíos y sin pistas previas: la fila toma la altura de lo que sí tiene', () => {
  const units = [tracked('a', [0, 0, 0, 40], 0), tracked('b', [0, 0, 0, 120], 1), tracked('c', [30, 0, 0, 20], 1)];
  const plan = runTracked(units);
  assert.deepEqual(plan.errors, []);
  assert.deepEqual(plan.pages[0].rows.map((r) => r.height), [150]); // 30 de marcas + 120 de tarjetas
  // Un medidor antiguo (sin rows) sigue funcionando con el máximo.
  const legacy = run([unit('x', 2), unit('y', 1, { h: 300 })]);
  assert.equal(legacy.pages[0].rows[0].height, 320);
});

test('un compás con título que se divide mantiene cada fragmento dentro del alto de la hoja', () => {
  const units = [tracked('a', [0, 90, 0, 100], 12)]; // 190 de alto; cada fila admite 9 tarjetas (950) como máximo
  const plan = runTracked(units);
  assert.deepEqual(plan.errors, []);
  const parts = flat(plan);
  assert.ok(parts.length >= 2);
  assert.equal(parts[parts.length - 1].to, 12);
  for (const row of plan.pages[0].rows) assert.ok(row.height <= plan.bodyHeight);
});

// Generador pseudoaleatorio determinista para el recorrido por muchos casos.
function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

test('invariantes con 300 canciones aleatorias: orden, cobertura exacta, ajuste y sin hojas vacías', () => {
  for (let seed = 1; seed <= 300; seed++) {
    const rnd = prng(seed);
    const units = Array.from({ length: 1 + Math.floor(rnd() * 12) }, (_, i) => ({
      measureId: `m${i}`,
      label: String(i + 1),
      atoms: Array.from({ length: Math.floor(rnd() * 25) }, () => ({ w: 60 + Math.floor(rnd() * 200), h: 40 + Math.floor(rnd() * 250) })),
    }));
    const plan = run(units);
    const frags = flat(plan);

    // Orden de lectura: los compases aparecen en su orden escrito, sin intercalarse.
    const order = frags.map((f) => f.unitIndex);
    assert.deepEqual(order, [...order].sort((a, b) => a - b), `seed ${seed}: orden de compases`);
    // Cobertura exacta: los fragmentos de cada compás son contiguos y suman todas sus tarjetas, una vez.
    units.forEach((u, ui) => {
      const parts = frags.filter((f) => f.unitIndex === ui);
      assert.ok(parts.length >= 1, `seed ${seed}: compás ${ui} colocado`);
      assert.equal(parts[0].from, 0);
      for (let i = 1; i < parts.length; i++) assert.equal(parts[i].from, parts[i - 1].to, `seed ${seed}: contiguos`);
      assert.equal(parts[parts.length - 1].to, u.atoms.length, `seed ${seed}: cubre todas las tarjetas`);
    });

    assert.ok(plan.pages.every((p) => p.rows.length > 0), `seed ${seed}: sin hojas vacías`);

    // Las hojas sin desbordamiento respetan ancho y alto.
    plan.pages.forEach((page, pi) => {
      if (page.overflow) return;
      let y = 0;
      for (const row of page.rows) {
        assert.ok(row.width <= BASE.content.width, `seed ${seed} hoja ${pi}: ancho de fila`);
        y += row.height;
      }
      y += Math.max(0, page.rows.length - 1) * BASE.rowGap;
      assert.ok(y <= plan.bodyHeight + 1e-9, `seed ${seed} hoja ${pi}: alto de hoja`);
    });
  }
});
