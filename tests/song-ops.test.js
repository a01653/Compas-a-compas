import test from 'node:test';
import assert from 'node:assert/strict';
import { listIds, findDuplicateIds } from '../src/model/ids.js';
import { validateSong } from '../src/model/validate.js';
import {
  addEvent, addMeasure, addVoicing, createEmptySong, duplicateMeasure, duplicateVoicing, effectiveText,
  moveMeasure, nextLabel, removeEvent, removeVoicing, setEventDefault, setTextMode, textState,
} from '../src/model/song.js';
import { clone, loadDemo } from './helpers.js';

test('canción nueva es válida', () => {
  assert.deepEqual(validateSong(createEmptySong()).errors, []);
});

test('añadir compás: ID nuevo único, etiqueta sin renumerar', () => {
  const song = clone(loadDemo());
  const before = JSON.stringify(song.measures);
  const m = addMeasure(song);
  assert.equal(m.label, '5');
  assert.equal(song.measures.length, 5);
  assert.deepEqual(song.measures.slice(0, 4), JSON.parse(before));
  assert.deepEqual(findDuplicateIds(song), []);
  const inserted = addMeasure(song, 1);
  assert.equal(song.measures[1].id, inserted.id);
  assert.deepEqual(song.measures.map((x) => x.label), ['1', inserted.label, '2', '3', '4', '5']);
});

test('nextLabel ignora etiquetas no numéricas', () => {
  const song = createEmptySong();
  song.measures[0].label = 'Intro';
  assert.equal(nextLabel(song), '2');
});

test('duplicar compás: copia profunda con IDs nuevos y el original intacto', () => {
  const song = clone(loadDemo());
  const original = clone(song.measures[0]);
  const copy = duplicateMeasure(song, 'm1');
  assert.equal(song.measures[1].id, copy.id);
  assert.deepEqual(song.measures[0], original);
  assert.notEqual(copy.chordEvents[0].id, original.chordEvents[0].id);
  assert.notEqual(copy.chordEvents[0].voicings[0].id, original.chordEvents[0].voicings[0].id);
  assert.deepEqual(copy.chordEvents[0].voicings[1].frets, original.chordEvents[0].voicings[1].frets);
  assert.deepEqual(findDuplicateIds(song), []);
  assert.deepEqual(validateSong(song).errors, []);
});

test('reordenar conserva IDs y contenido', () => {
  const song = clone(loadDemo());
  const before = new Set(listIds(song).map(([id]) => id));
  moveMeasure(song, 'm3', -1);
  assert.deepEqual(song.measures.map((m) => m.id), ['m1', 'm3', 'm2', 'm4']);
  assert.deepEqual(new Set(listIds(song).map(([id]) => id)), before);
});

test('varios acordes y varios voicings por compás sin tocar los demás', () => {
  const song = clone(loadDemo());
  const snapshot = clone(song);
  const event = addEvent(song, 'm4', 'G7');
  addVoicing(song, event, [3, 2, 0, 0, 0, 1]);
  const second = addVoicing(song, event);
  addVoicing(song, event);
  assert.equal(event.voicings.length, 3);
  assert.deepEqual(second.frets, [null, null, null, null, null, null], 'voicing nuevo sin notas inventadas');
  assert.deepEqual(song.measures.slice(0, 3), snapshot.measures.slice(0, 3));
  assert.equal(song.measures[3].chordEvents.length, 1);
  assert.deepEqual(validateSong(song).errors, []);

  removeVoicing(event, second.id);
  assert.equal(event.voicings.length, 2);
  removeEvent(song, 'm4', event.id);
  assert.deepEqual(song.measures[3].chordEvents, []);
});

test('duplicar voicing conserva textos y lo coloca tras el original', () => {
  const song = clone(loadDemo());
  const event = song.measures[0].chordEvents[0];
  const copy = duplicateVoicing(song, event, 'v2');
  assert.equal(event.voicings[2].id, copy.id);
  assert.equal(copy.aboveText, 'Otra posición');
  assert.notEqual(copy.id, 'v2');
});

test('texto de tarjeta: heredar, personalizar y ocultar con cadena vacía', () => {
  const song = clone(loadDemo());
  const event = song.measures[0].chordEvents[0]; // aboveText «Introducción»; v1 sin override, v2 con override
  const [v1, v2] = event.voicings;

  assert.equal(effectiveText(event, v1, 'aboveText'), 'Introducción');
  assert.equal(effectiveText(event, v2, 'aboveText'), 'Otra posición');
  assert.equal(textState(event, v1, 'aboveText').mode, 'inherit');
  assert.equal(textState(event, v2, 'aboveText').mode, 'custom');

  // Personalizar v1 no cambia v2 ni el valor del acorde.
  setTextMode(event, v1, 'aboveText', 'custom');
  assert.equal(v1.aboveText, 'Introducción', 'parte del valor heredado');
  v1.aboveText = 'Solo esta';
  assert.equal(effectiveText(event, v2, 'aboveText'), 'Otra posición');
  assert.equal(event.aboveText, 'Introducción');

  // Ocultar es cadena vacía.
  setTextMode(event, v1, 'aboveText', 'hidden');
  assert.equal(v1.aboveText, '');
  assert.equal(effectiveText(event, v1, 'aboveText'), '');
  assert.equal(textState(event, v1, 'aboveText').mode, 'hidden');

  // Quitar override vuelve a heredar.
  setTextMode(event, v2, 'aboveText', 'inherit');
  assert.equal('aboveText' in v2, false);
  assert.equal(effectiveText(event, v2, 'aboveText'), 'Introducción');
});

test('cambiar el valor por defecto del acorde solo afecta a las tarjetas que heredan', () => {
  const song = clone(loadDemo());
  const event = song.measures[0].chordEvents[0];
  const [v1, v2] = event.voicings;
  setEventDefault(event, 'aboveText', 'Nuevo título');
  assert.equal(effectiveText(event, v1, 'aboveText'), 'Nuevo título');
  assert.equal(effectiveText(event, v2, 'aboveText'), 'Otra posición');
  setEventDefault(event, 'aboveText', '');
  assert.equal('aboveText' in event, false);
  assert.equal(effectiveText(event, v1, 'aboveText'), '');
  assert.deepEqual(validateSong(song).errors, []);
});

test('un acorde sin voicings es válido y se conserva', () => {
  const song = createEmptySong();
  const event = addEvent(song, 'm1', 'Am');
  assert.deepEqual(event.voicings, []);
  assert.deepEqual(validateSong(song).errors, []);
});
