import test from 'node:test';
import assert from 'node:assert/strict';
import { addCard } from '../src/model/cards.js';
import { buildUnits } from '../src/layout/atoms.js';
import { paginate } from '../src/layout/paginate.js';
import { checkStructure, measureConsequences } from '../src/model/structure.js';
import { validateSong } from '../src/model/validate.js';
import { parseSongJson, serializeSong } from '../src/model/serialize.js';
import { createIdFactory } from '../src/model/ids.js';
import {
  addMeasure, canRepeatTwo, clearRepeatPreviousTwo, createEmptySong, deleteMeasure, duplicateMeasure, fixRepeatPreviousTwo,
  leaveRepeat, measureNumbersVisible, moveMeasure, repeatPairOf, setMaxMeasuresPerRow, setRepeatPrevious, setRepeatPreviousTwo,
  setShowMeasureNumbers,
} from '../src/model/song.js';
import { tonalitiesVisible } from '../src/model/tonality.js';
import { clone } from './helpers.js';

function song5() {
  const song = createEmptySong();
  for (let i = 0; i < 4; i++) addMeasure(song); // m1..m5
  addCard(song, 'm1'); addCard(song, 'm2');
  return song;
}
const warnings = (song) => checkStructure(song).filter((w) => w.kind === 'repeat');

test('dos compases: la marca va en el primer destino con los IDs de fuentes y destinos', () => {
  const song = song5();
  assert.equal(canRepeatTwo(song, 'm2'), false);
  assert.equal(setRepeatPreviousTwo(song, 'm2'), false, 'faltan dos compases anteriores');
  assert.equal(setRepeatPreviousTwo(song, 'm5'), false, 'falta el segundo destino');
  assert.equal(setRepeatPreviousTwo(song, 'm3'), true);
  assert.deepEqual(song.measures[2].repeatPreviousTwo, { sourceMeasureIds: ['m1', 'm2'], targetMeasureIds: ['m3', 'm4'] });
  assert.equal('repeatPreviousTwo' in song.measures[3], false);
  assert.deepEqual(song.measures[2].chordEvents.concat(song.measures[3].chordEvents), []);
  assert.equal(song.measures[0].chordEvents.length, 1, 'las fuentes no se copian ni se alteran');
  assert.deepEqual(validateSong(song), { errors: [], warnings: [] });
  assert.equal(repeatPairOf(song, 'm4').first.id, 'm3');
  const units = buildUnits(song);
  assert.deepEqual(units.map((u) => u.repeatPair), [null, null, 'first', 'second', null]);
  assert.deepEqual(units.map((u) => u.repeatPrevious), [false, false, false, false, false]);
});

test('sustituir tarjetas de los destinos, conservar etiquetas y marcas, y quitar deja ambos vacíos', () => {
  const song = song5();
  addCard(song, 'm3'); addCard(song, 'm4');
  const labels = song.measures.map((m) => m.label);
  const structure = JSON.stringify(song.structure);
  setRepeatPreviousTwo(song, 'm3');
  assert.deepEqual(song.measures.map((m) => m.label), labels);
  assert.equal(JSON.stringify(song.structure), structure);
  assert.equal(clearRepeatPreviousTwo(song, 'm4'), true, 'se puede quitar desde el segundo destino');
  assert.equal('repeatPreviousTwo' in song.measures[2], false);
  assert.deepEqual(song.measures.map((m) => m.chordEvents.length), [1, 1, 0, 0, 0]);
  assert.equal(clearRepeatPreviousTwo(song, 'm3'), false);
});

test('dos compases: la repetición de un compás sobre un destino la reemplaza y viceversa', () => {
  const song = song5();
  setRepeatPrevious(song, 'm4');
  setRepeatPreviousTwo(song, 'm3');
  assert.equal('repeatPrevious' in song.measures[3], false);
  setRepeatPreviousTwo(song, 'm4'); // m4 y m5 pasan a destino; el par anterior se retira
  assert.equal('repeatPreviousTwo' in song.measures[2], false);
  assert.deepEqual(song.measures[3].repeatPreviousTwo.targetMeasureIds, ['m4', 'm5']);
  assert.equal(leaveRepeat(song, 'm5'), true);
  assert.equal('repeatPreviousTwo' in song.measures[3], false);
});

test('validación: forma, tarjetas en destinos, ambas repeticiones a la vez y campos desconocidos', () => {
  const base = song5();
  setRepeatPreviousTwo(base, 'm3');
  const bads = [
    (s) => { s.measures[2].repeatPreviousTwo.sourceMeasureIds = ['m1']; },
    (s) => { s.measures[2].repeatPreviousTwo.targetMeasureIds = ['m3', 'm3']; },
    (s) => { s.measures[2].repeatPreviousTwo.sourceMeasureIds = ['m1', '']; },
    (s) => { s.measures[2].repeatPreviousTwo.extra = 1; },
    (s) => { delete s.measures[2].repeatPreviousTwo.targetMeasureIds; },
    (s) => { s.measures[2].repeatPreviousTwo = 'm1'; },
    (s) => { s.measures[2].repeatPrevious = { sourceMeasureId: 'm2' }; },
    (s) => { addCard(s, 'm3'); },
  ];
  for (const [i, mutate] of bads.entries()) {
    const copy = clone(base);
    mutate(copy);
    assert.ok(validateSong(copy).errors.length, `caso ${i}`);
  }
});

test('referencias rotas de la pareja: avisan, conservan los IDs y se corrigen con una acción expresa', () => {
  const missing = song5();
  setRepeatPreviousTwo(missing, 'm3');
  deleteMeasure(missing, 'm1');
  assert.deepEqual(missing.measures[1].repeatPreviousTwo.sourceMeasureIds, ['m1', 'm2'], 'IDs conservados');
  assert.match(warnings(missing)[0].message, /ya no existe/);
  assert.deepEqual(validateSong(missing).errors, []);

  const moved = song5();
  setRepeatPreviousTwo(moved, 'm3');
  const result = moveMeasure(moved, 'm2', -1); // m2, m1, m3, m4: las fuentes ya están en otro orden
  assert.equal(result.repeats.length, 1);
  assert.match(warnings(moved)[0].message, /dos compases inmediatamente anteriores/);
  assert.equal(fixRepeatPreviousTwo(moved, 'm3'), true);
  assert.deepEqual(moved.measures[2].repeatPreviousTwo.sourceMeasureIds, ['m2', 'm1']);
  assert.deepEqual(warnings(moved), []);

  const split = song5();
  setRepeatPreviousTwo(split, 'm3');
  moveMeasure(split, 'm5', -1); // m5 queda entre m3 y m4
  assert.match(warnings(split)[0].message, /consecutivos/);
  assert.equal(buildUnits(split).some((u) => u.repeatPair), false, 'un par inválido no se dibuja como par');

  const cycle = song5();
  setRepeatPreviousTwo(cycle, 'm3');
  cycle.measures[2].repeatPreviousTwo.sourceMeasureIds = ['m2', 'm4'];
  assert.match(warnings(cycle)[0].message, /ciclo|sí mismo/);

  const overlap = song5();
  setRepeatPreviousTwo(overlap, 'm4');
  overlap.measures[2].repeatPreviousTwo = { sourceMeasureIds: ['m1', 'm2'], targetMeasureIds: ['m3', 'm4'] };
  assert.ok(warnings(overlap).some((w) => /solapa|contenido propio|no se dibuja/.test(w.message)));
});

test('borrar un compás de la pareja se anuncia y duplicar un destino no copia la marca', () => {
  const song = song5();
  setRepeatPreviousTwo(song, 'm3');
  assert.ok(measureConsequences(song, 'm1').some((c) => /junto con otro/.test(c)));
  assert.ok(measureConsequences(song, 'm4').some((c) => /destino de la repetición de dos compases/.test(c)));
  const copy = duplicateMeasure(song, 'm3');
  assert.equal('repeatPreviousTwo' in copy, false);
  assert.ok(warnings(song).length, 'la copia entre los destinos los separa y se avisa');
  assert.notEqual(createIdFactory(song)('m'), 'm1');
});

test('archivos sin las opciones nuevas se abren y guardan sin añadir campos', () => {
  const song = song5();
  const text = serializeSong(song);
  assert.doesNotMatch(text, /repeatPreviousTwo|showMeasureNumbers|maxMeasuresPerRow/);
  assert.equal(serializeSong(parseSongJson(text).song), text);
});

test('opciones de página: máximo de compases por línea y numeración', () => {
  const song = song5();
  setMaxMeasuresPerRow(song, '3');
  assert.equal(song.maxMeasuresPerRow, 3);
  assert.deepEqual(validateSong(song).errors, []);
  setMaxMeasuresPerRow(song, '');
  assert.equal('maxMeasuresPerRow' in song, false, 'Automático no escribe el campo');
  for (const bad of [0, -1, 1.5, '2', 17, null, true]) {
    const copy = clone(song);
    copy.maxMeasuresPerRow = bad;
    assert.ok(validateSong(copy).errors.length, JSON.stringify(bad));
  }
  assert.equal(measureNumbersVisible(song), true);
  setShowMeasureNumbers(song, false);
  assert.equal(song.showMeasureNumbers, false);
  assert.equal(measureNumbersVisible(song), false);
  assert.deepEqual(validateSong(song).errors, []);
  assert.equal(song.measures[0].label, '1', 'las etiquetas se conservan');
  setShowMeasureNumbers(song, true);
  assert.equal('showMeasureNumbers' in song, false);
  const copy = clone(song);
  copy.showMeasureNumbers = 'no';
  assert.ok(validateSong(copy).errors.length);
});

test('ocultar tonalidades no borra los valores de los voicings', () => {
  const song = song5();
  const { voicing } = addCard(song, 'm1');
  voicing.tonality = { text: 'Do mayor', family: 'major' };
  song.showTonalities = false;
  assert.equal(tonalitiesVisible(song), false);
  const reopened = parseSongJson(serializeSong(song)).song;
  assert.deepEqual(reopened.measures[0].chordEvents.at(-1).voicings[0].tonality, { text: 'Do mayor', family: 'major' });
});

const units = (n, extra = {}) => Array.from({ length: n }, (_, i) => ({ measureId: `m${i}`, label: String(i), atoms: [{}], ...(extra[i] || {}) }));
const run = (list, options = {}) => paginate({
  units: list, measureFragment: () => ({ width: 100, height: 50 }), content: { width: 1000, height: 600 }, headerHeight: 40, columnGap: 6, ...options,
});

test('máximo por línea: automático reproduce el reparto de siempre y un tope nunca se supera', () => {
  const list = units(9);
  const auto = run(list);
  assert.deepEqual(auto.pages[0].rows.map((r) => r.fragments.length), [9]);
  assert.deepEqual(run(list, { maxPerRow: 0 }).pages[0].rows.map((r) => r.fragments.length), [9]);
  for (const cap of [1, 2, 4]) {
    const rows = run(list, { maxPerRow: cap }).pages[0].rows;
    assert.ok(rows.every((r) => r.fragments.length <= cap), `tope ${cap}`);
    assert.deepEqual(rows.flatMap((r) => r.fragments.map((f) => f.unitIndex)), list.map((_, i) => i), 'orden y cantidad intactos');
  }
  const narrow = run(list, { maxPerRow: 20, content: { width: 350, height: 600 } });
  assert.ok(narrow.pages[0].rows.every((r) => r.fragments.length <= 3), 'el ancho sigue mandando');
});

test('pareja de repetición: sus dos destinos van siempre en la misma fila, también con un tope de 1', () => {
  const list = units(8, { 3: { repeatPair: 'first' }, 4: { repeatPair: 'second' } });
  for (const options of [{ content: { width: 450, height: 600 } }, { maxPerRow: 1 }, { maxPerRow: 3, content: { width: 450, height: 600 } }]) {
    const rows = run(list, options).pages[0].rows;
    const rowOf = (ui) => rows.findIndex((r) => r.fragments.some((f) => f.unitIndex === ui));
    assert.equal(rowOf(3), rowOf(4), JSON.stringify(options));
    assert.ok(rows.flatMap((r) => r.fragments).length === 8);
  }
  const rows = run(list, { content: { width: 450, height: 600 } }).pages[0].rows;
  assert.deepEqual(rows.map((r) => r.fragments.map((f) => f.unitIndex)), [[0, 1, 2], [3, 4, 5, 6], [7]]);
});

/* ---------- Ancho por compás y ajuste de línea ---------- */
import { setLineFill, setMeasureWidth } from '../src/model/song.js';

const cols = (n) => Array.from({ length: n }, () => 50);
const sized = (n) => () => ({ width: n * 50 + (n - 1) * 4, height: 50, columns: cols(n) });
const wunits = (specs) => specs.map((s, i) => ({ measureId: `m${i}`, label: String(i + 1), ...s, atoms: Array.from({ length: s.atoms ?? 2 }) }));
const runW = (list, options = {}) => paginate({
  units: list, measureFragment: (ui) => sized(list[ui].atoms.length)(), content: { width: 1000, height: 600 }, headerHeight: 40, columnGap: 6, ...options,
});

test('ancho manual: porcentaje del ancho útil, nunca por debajo del contenido, y avisa', () => {
  const list = wunits([{ widthPercent: 50 }, {}, { widthPercent: 10 }]);
  const plan = runW(list);
  const [row] = plan.pages[0].rows;
  const [a, b, c] = row.fragments;
  assert.equal(a.width, 500);
  assert.equal(b.width, 104, 'automático: su ancho natural');
  assert.equal(c.width, 104, 'el 10 % (100 px) no cabe: se usa el mínimo');
  assert.equal(plan.notices.length, 1);
  assert.match(plan.notices[0].message, /ancho del 10 %/);
  assert.equal(a.tracks.reduce((s, n) => s + n, 0) + 4 <= 500.01, true);
  assert.ok(a.tracks.every((n) => n > 50), 'las pistas crecen proporcionalmente');
  assert.equal(b.tracks, undefined, 'el compás automático conserva su límite de expansión');
});

test('ancho manual: caben menos compases en la línea, respetando el máximo configurado', () => {
  const list = wunits(Array.from({ length: 4 }, () => ({ widthPercent: 40 })));
  const rows = runW(list).pages[0].rows;
  assert.deepEqual(rows.map((r) => r.fragments.length), [2, 2]);
  const capped = runW(wunits(Array.from({ length: 4 }, () => ({ widthPercent: 20 }))), { maxPerRow: 3 }).pages[0].rows;
  assert.deepEqual(capped.map((r) => r.fragments.length), [3, 1]);
});

test('ajustar línea al ancho: llega al margen derecho sin comprimir ninguna columna y solo en esa línea', () => {
  const list = wunits([{}, { fillToEdge: true }, {}, { atoms: 1 }, {}, {}, {}, {}, {}, {}, {}, {}]);
  const rows = runW(list, { content: { width: 700, height: 600 } }).pages[0].rows;
  const filled = rows.find((r) => r.fill);
  assert.ok(filled);
  const total = filled.fragments.reduce((s, f) => s + f.drawWidth, 0) + 6 * (filled.fragments.length - 1);
  assert.ok(Math.abs(total - 700) < 0.01, `la línea llega al margen (${total})`);
  for (const f of filled.fragments) {
    assert.ok(f.tracks.every((t, i) => t >= f.columns[i]), 'ninguna columna baja de su ancho natural');
  }
  assert.ok(rows.filter((r) => !r.fill).every((r) => r.fragments.every((f) => f.tracks === undefined)), 'el resto sigue en automático');
  const plain = runW(wunits([{}, {}, {}]), { content: { width: 700, height: 600 } }).pages[0].rows[0];
  assert.equal(plain.fill, false);
});

test('filas ajustadas con cuatro compases alinean verticalmente las tarjetas', () => {
  const widths = [
    [140, 180, 130, 160],
    [175, 135, 155, 145],
    [125, 155, 185, 145],
  ];
  const units = widths.flatMap((row, rowIndex) => row.map((width, columnIndex) => ({
    measureId: `m${rowIndex}-${columnIndex}`,
    label: String(rowIndex * 4 + columnIndex + 1),
    atoms: [{}],
    fillToEdge: true,
  })));
  const plan = paginate({
    units,
    measureFragment: (ui) => {
      const naturalWidth = widths[Math.floor(ui / 4)][ui % 4];
      return { width: naturalWidth, height: 50, columns: [naturalWidth] };
    },
    content: { width: 800, height: 600 },
    headerHeight: 40,
    safety: 0,
    columnGap: 6,
    maxPerRow: 4,
  });
  const rows = plan.pages[0].rows;
  assert.equal(rows.length, 3);
  assert.ok(rows.every((row) => row.aligned));
  const positions = rows.map((row) => {
    let x = 0;
    return row.fragments.map((fragment) => {
      const left = x;
      x += fragment.drawWidth + 6;
      return [left, x];
    });
  });
  for (let column = 0; column < 4; column++) {
    for (let row = 1; row < rows.length; row++) {
      assert.ok(Math.abs(positions[row][column][0] - positions[0][column][0]) < 0.01, `inicio de tarjeta ${column + 1}`);
      assert.ok(Math.abs(positions[row][column][1] - positions[0][column][1]) < 0.01, `final de tarjeta ${column + 1}`);
    }
  }
  assert.ok(rows.every((row) => Math.abs(row.fragments.reduce((n, f) => n + f.drawWidth, 0) + 18 - 800) < 0.01));
  for (const row of rows) {
    row.fragments.forEach((fragment) => assert.ok(fragment.tracks[0] >= fragment.columns[0]));
  }
});

test('si no cabe la cuadrícula alineada, conserva el reparto individual sin comprimir', () => {
  const widths = [
    [300, 100, 100, 100],
    [100, 300, 100, 100],
    [100, 100, 300, 100],
  ];
  const units = widths.flatMap((row, rowIndex) => row.map((width, columnIndex) => ({
    measureId: `wide-${rowIndex}-${columnIndex}`,
    label: String(rowIndex * 4 + columnIndex + 1),
    atoms: [{}],
    fillToEdge: true,
  })));
  const plan = paginate({
    units,
    measureFragment: (ui) => {
      const naturalWidth = widths[Math.floor(ui / 4)][ui % 4];
      return { width: naturalWidth, height: 50, columns: [naturalWidth] };
    },
    content: { width: 800, height: 600 },
    headerHeight: 40,
    safety: 0,
    columnGap: 6,
    maxPerRow: 4,
  });
  const rows = plan.pages[0].rows;
  assert.equal(rows.length, 3);
  assert.ok(rows.every((row) => !row.aligned));
  assert.ok(rows.every((row) => row.fragments.every((fragment) => fragment.tracks[0] >= fragment.columns[0])));
});

test('ancho y ajuste de línea: modelo, validación y compatibilidad', () => {
  const song = song5();
  const m = song.measures[1];
  setMeasureWidth(m, '35');
  assert.equal(m.widthPercent, 35);
  for (const bad of ['', '9', '101', '12.5', 'abc', null]) { setMeasureWidth(m, bad); assert.equal('widthPercent' in m, false, String(bad)); }
  setMeasureWidth(m, 40);
  setLineFill(song, ['m1', 'm2', 'm3'], true);
  assert.deepEqual(song.measures.map((x) => x.fillToEdge === true), [true, false, false, false, false]);
  assert.deepEqual(validateSong(song).errors, []);
  const reopened = parseSongJson(serializeSong(song)).song;
  assert.equal(reopened.measures[1].widthPercent, 40);
  setLineFill(song, ['m1', 'm2', 'm3'], false);
  assert.equal(song.measures.some((x) => 'fillToEdge' in x), false, 'volver a automático quita el campo');
  for (const [key, value] of [['widthPercent', 9], ['widthPercent', 101], ['widthPercent', 50.5], ['widthPercent', '50'], ['fillToEdge', 'si'], ['fillToEdge', 1]]) {
    const copy = clone(song);
    copy.measures[0][key] = value;
    assert.ok(validateSong(copy).errors.length, `${key}=${value}`);
  }
  assert.doesNotMatch(serializeSong(song5()), /widthPercent|fillToEdge/);
});
