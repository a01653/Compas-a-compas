import test from 'node:test';
import assert from 'node:assert/strict';
import { canSwapCards, flatCards, swapCards } from '../src/model/cards.js';
import { findDuplicateIds } from '../src/model/ids.js';
import { duplicateMeasures } from '../src/model/measureOps.js';
import { effectiveText, toggleBreakBefore } from '../src/model/song.js';
import { validateSong } from '../src/model/validate.js';
import { buildUnits } from '../src/layout/atoms.js';
import { paginate } from '../src/layout/paginate.js';
import { clone, loadDemo } from './helpers.js';

// Demo: m1 = Cm7 [v1, v2] (un acorde con dos tarjetas) · m2 = F7 [v3], Bbmaj7 [v4] · m3 = E5 [v5] · m4 vacío.
const valid = (song) => {
  assert.deepEqual(validateSong(song).errors, []);
  assert.deepEqual(findDuplicateIds(song), []);
};
const keysOf = (measure) => flatCards(measure).map((card) => card.key);
const names = (measure) => flatCards(measure).map((card) => card.event.chordName);
const texts = (song, voicingId) => {
  const card = song.measures.flatMap((m) => flatCards(m)).find((c) => c.voicing?.id === voicingId);
  return ['aboveText', 'insideText'].map((key) => effectiveText(card.event, card.voicing, key));
};

/* ---------- Intercambiar dos tarjetas ---------- */

test('intercambiar dos tarjetas de compases distintos: cada una viaja con sus datos y quedan en orden escrito', () => {
  const song = clone(loadDemo());
  const before = { v3: texts(song, 'v3'), v5: texts(song, 'v5') };
  const result = swapCards(song, ['v:v5', 'v:v3']);
  assert.deepEqual(names(song.measures[1]), ['E5', 'Bbmaj7']);
  assert.deepEqual(names(song.measures[2]), ['F7']);
  assert.deepEqual(result.map((sel) => [sel.measureId, sel.voicingId]), [['m2', 'v5'], ['m3', 'v3']]);
  assert.deepEqual(texts(song, 'v3'), before.v3);
  assert.deepEqual(texts(song, 'v5'), before.v5);
  valid(song);
});

test('intercambiar dos tarjetas de un mismo acorde reordena sus posiciones sin cambiar sus textos efectivos', () => {
  const song = clone(loadDemo());
  const before = { v1: texts(song, 'v1'), v2: texts(song, 'v2') };
  swapCards(song, ['v:v1', 'v:v2']);
  assert.deepEqual(keysOf(song.measures[0]), ['v:v2', 'v:v1']);
  assert.deepEqual(texts(song, 'v1'), before.v1);
  assert.deepEqual(texts(song, 'v2'), before.v2);
  valid(song);
});

test('una tarjeta que comparte acorde se separa antes de intercambiarse; la otra posición del acorde no se mueve', () => {
  const song = clone(loadDemo());
  const before = { v1: texts(song, 'v1'), v2: texts(song, 'v2'), v4: texts(song, 'v4') };
  swapCards(song, ['v:v2', 'v:v4']);
  assert.deepEqual(keysOf(song.measures[0]), ['v:v1', 'v:v4']);
  assert.deepEqual(keysOf(song.measures[1]), ['v:v3', 'v:v2']);
  assert.deepEqual(names(song.measures[1]), ['F7', 'Cm7']);
  for (const id of ['v1', 'v2', 'v4']) assert.deepEqual(texts(song, id), before[id], id);
  valid(song);
});

test('una tarjeta pendiente (sin digitación) también se intercambia', () => {
  const song = clone(loadDemo());
  song.measures[3].chordEvents.push({ id: 'e9', chordName: 'A7', family: 'dominant', voicings: [] });
  const result = swapCards(song, ['e:e9', 'v:v5']);
  assert.deepEqual(names(song.measures[2]), ['A7']);
  assert.deepEqual(names(song.measures[3]), ['E5']);
  assert.deepEqual(result.map((sel) => sel.eventId), ['e9', 'e4']);
  valid(song);
});

test('solo se intercambian exactamente dos tarjetas distintas', () => {
  const song = clone(loadDemo());
  const original = JSON.stringify(song);
  assert.equal(canSwapCards(song, ['v:v1']), false);
  assert.equal(canSwapCards(song, ['v:v1', 'v:v1']), false);
  assert.equal(canSwapCards(song, ['v:v1', 'v:v3', 'v:v5']), false);
  assert.equal(canSwapCards(song, ['v:v1', 'v:no-existe']), false);
  assert.equal(canSwapCards(song, ['v:v1', 'v:v3']), true);
  assert.deepEqual(swapCards(song, ['v:v1', 'v:v3', 'v:v5']), []);
  assert.equal(JSON.stringify(song), original);
});

/* ---------- Salto de línea forzado ---------- */

// Área útil 1000 × 600 sin cabecera; cada compás mide 220 × 120: caben cuatro por fila.
const units = (song) => buildUnits(song);
const layout = (song) => paginate({
  units: units(song), measureFragment: () => ({ width: 220, height: 120 }),
  content: { width: 1000, height: 600 }, headerHeight: 0, columnGap: 10, rowGap: 10,
});
const rows = (song) => layout(song).pages.flatMap((page) => page.rows.map((row) => row.fragments.map((f) => song.measures[f.unitIndex].label)));
const fourMeasures = () => {
  const song = clone(loadDemo());
  song.structure = { repeats: [], endings: [], markers: [], jumps: [] };
  return song;
};

test('un compás con salto de línea empieza otra línea aunque quepa en la anterior', () => {
  const song = fourMeasures();
  assert.deepEqual(rows(song), [['1', '2', '3', '4']]);
  toggleBreakBefore(song, ['m3']);
  assert.equal(song.measures[2].breakBefore, true);
  assert.equal(units(song)[2].breakBefore, true);
  assert.deepEqual(rows(song), [['1', '2'], ['3', '4']]);
  valid(song);
});

test('el salto de línea en el primer compás no crea una línea vacía', () => {
  const song = fourMeasures();
  song.measures[0].breakBefore = true;
  assert.deepEqual(rows(song), [['1', '2', '3', '4']]);
});

test('el segundo compás de una repetición de dos compases sigue junto al primero aunque lleve salto de línea', () => {
  const song = fourMeasures();
  song.measures[3].chordEvents = [];
  song.measures[2].chordEvents = [];
  song.measures[2].repeatPreviousTwo = { sourceMeasureIds: ['m1', 'm2'], targetMeasureIds: ['m3', 'm4'] };
  valid(song);
  song.measures[3].breakBefore = true;
  assert.deepEqual(rows(song), [['1', '2', '3', '4']]);
  song.measures[2].breakBefore = true;
  assert.deepEqual(rows(song), [['1', '2'], ['3', '4']]);
});

test('activar y quitar el salto de línea de varios compases a la vez', () => {
  const song = fourMeasures();
  song.measures[1].breakBefore = true;
  assert.equal(toggleBreakBefore(song, ['m2', 'm4']).on, true, 'si falta en alguno, se activa en todos');
  assert.deepEqual(song.measures.map((m) => m.breakBefore === true), [false, true, false, true]);
  assert.equal(toggleBreakBefore(song, ['m2', 'm4']).on, false);
  assert.deepEqual(song.measures.map((m) => 'breakBefore' in m), [false, false, false, false], 'quitar no deja el campo a false');
});

test('el salto de línea se valida como booleano y las copias de un compás no lo heredan', () => {
  const song = fourMeasures();
  song.measures[1].breakBefore = 'sí';
  assert.ok(validateSong(song).errors.some((e) => e.path === 'measures[1].breakBefore'));
  song.measures[1].breakBefore = true;
  valid(song);
  const { ids } = duplicateMeasures(song, ['m2'], { renumber: false });
  const copy = song.measures.find((m) => m.id === ids[0]);
  assert.equal('breakBefore' in copy, false);
  assert.equal(song.measures[1].breakBefore, true);
});
