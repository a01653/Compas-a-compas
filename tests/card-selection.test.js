import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canReplaceCards, canReplaceFingerings, copyCards, duplicateCards, flatCards, pasteCards, removeCards, replaceCards,
  replaceFingerings, selectionKey, songCards,
} from '../src/model/cards.js';
import { findDuplicateIds } from '../src/model/ids.js';
import { parseSongJson, serializeSong } from '../src/model/serialize.js';
import { effectiveText } from '../src/model/song.js';
import { validateSong } from '../src/model/validate.js';
import { createStore, selectionTarget, targetCardKeys, targetMeasureIds } from '../src/store.js';
import { clone, loadDemo } from './helpers.js';

// Demo: m1 = Cm7 [v1, v2] (un acorde con dos tarjetas) · m2 = F7 [v3], Bbmaj7 [v4] · m3 = E5 [v5] · m4 vacío.
const valid = (song) => assert.deepEqual(validateSong(song).errors, []);
const keysOf = (measure) => flatCards(measure).map((card) => card.key);
const names = (measure) => flatCards(measure).map((card) => card.event.chordName);

/* ---------- Modelo ---------- */

test('copiar tarjetas salteadas las devuelve en orden escrito, sin las de en medio', () => {
  const song = clone(loadDemo());
  const payloads = copyCards(song, ['v:v5', 'v:v1', 'v:v4']);
  assert.deepEqual(payloads.map((p) => p.voicing.id), ['v1', 'v4', 'v5']);
  assert.deepEqual(payloads.map((p) => p.event.chordName), ['Cm7', 'Bbmaj7', 'E5']);
  payloads[0].voicing.frets[0] = 9;
  assert.notEqual(song.measures[0].chordEvents[0].voicings[0].frets[0], 9, 'copia profunda');
});

test('pegar varias tarjetas después y antes de una que comparte acorde, con IDs nuevos y textos intactos', () => {
  const song = clone(loadDemo());
  const payloads = copyCards(song, ['v:v3', 'v:v5']);
  const after = pasteCards(song, 'm1', { eventId: 'e1', voicingId: 'v1' }, payloads, 'after');
  assert.equal(after.length, 2);
  assert.deepEqual(names(song.measures[0]), ['Cm7', 'F7', 'E5', 'Cm7']);
  assert.equal(keysOf(song.measures[0])[3], 'v:v2', 'v2 sigue después de lo pegado');
  assert.ok(after.every((sel) => sel.measureId === 'm1' && !['v3', 'v5'].includes(sel.voicingId)));
  const before = pasteCards(song, 'm1', { eventId: song.measures[0].chordEvents.at(-1).id, voicingId: 'v2' }, payloads.slice(0, 1), 'before');
  assert.deepEqual(names(song.measures[0]), ['Cm7', 'F7', 'E5', 'F7', 'Cm7']);
  assert.equal(flatCards(song.measures[0])[3].voicing.id, before[0].voicingId);
  assert.equal(effectiveText(song.measures[0].chordEvents.at(-1), song.measures[0].chordEvents.at(-1).voicings[0], 'aboveText'), 'Otra posición');
  assert.deepEqual(findDuplicateIds(song), []);
  valid(song);
});

test('sin tarjeta de referencia, pegar va al principio o al final del compás (también vacío)', () => {
  const song = clone(loadDemo());
  const payloads = copyCards(song, ['v:v5']);
  pasteCards(song, 'm2', null, payloads, 'before');
  pasteCards(song, 'm2', null, payloads, 'after');
  assert.deepEqual(names(song.measures[1]), ['E5', 'F7', 'Bbmaj7', 'E5']);
  pasteCards(song, 'm4', null, payloads, 'before');
  assert.deepEqual(names(song.measures[3]), ['E5']);
  valid(song);
});

test('quitar tarjetas salteadas: solo esas, y la siguiente ocupa el lugar de la primera', () => {
  const song = clone(loadDemo());
  pasteCards(song, 'm2', null, copyCards(song, ['v:v5']), 'after');
  const [, , third] = flatCards(song.measures[1]);
  const result = removeCards(song, ['v:v3', third.key]);
  assert.equal(result.removed, 2);
  assert.deepEqual(names(song.measures[1]), ['Bbmaj7']);
  assert.deepEqual(result.next, { eventId: 'e3', voicingId: 'v4' });
  assert.equal(result.measureId, 'm2');
  const shared = removeCards(song, ['v:v1', 'v:v2']);
  assert.equal(song.measures[0].chordEvents.length, 0, 'un acorde sin tarjetas desaparece');
  assert.equal(shared.next, null);
  valid(song);
});

test('sustituir la tarjeta entera: textos, nombre, calidad, grado, tonalidad y digitación; conserva sitio e ID', () => {
  const song = clone(loadDemo());
  const [source] = copyCards(song, ['v:v2']);
  const result = replaceCards(song, ['v:v4'], [source]);
  assert.deepEqual(result, [{ measureId: 'm2', eventId: 'e3', voicingId: 'v4' }]);
  const event = song.measures[1].chordEvents[1];
  const voicing = event.voicings[0];
  assert.equal(event.chordName, 'Cm7');
  assert.equal(event.family, song.measures[0].chordEvents[0].family);
  assert.equal(effectiveText(event, voicing, 'aboveText'), 'Otra posición');
  const original = song.measures[0].chordEvents[0].voicings[1];
  assert.deepEqual({ ...voicing, id: original.id }, original);
  assert.deepEqual(names(song.measures[1]), ['F7', 'Cm7'], 'misma posición');
  valid(song);
});

test('sustituir tarjetas que comparten acorde las separa sin tocar a sus vecinas', () => {
  const song = clone(loadDemo());
  const sources = copyCards(song, ['v:v3', 'v:v5']);
  const before = flatCards(song.measures[0])[0];
  const kept = { name: before.event.chordName, above: effectiveText(before.event, before.voicing, 'aboveText') };
  replaceCards(song, ['v:v2'], sources.slice(0, 1));
  assert.deepEqual(names(song.measures[0]), ['Cm7', 'F7']);
  const first = flatCards(song.measures[0])[0];
  assert.deepEqual({ name: first.event.chordName, above: effectiveText(first.event, first.voicing, 'aboveText') }, kept);
  assert.equal(canReplaceCards(3, sources), false, 'dos copiadas no sustituyen a tres');
  assert.deepEqual(replaceCards(song, ['v:v1', 'v:v4', 'v:v5'], sources), [], 'sin cambios si no cuadran');
  const pair = replaceCards(song, ['v:v4', 'v:v1'], sources);
  assert.deepEqual(pair.map((sel) => sel.voicingId), ['v1', 'v4'], 'en orden escrito');
  assert.deepEqual(names(song.measures[0]), ['F7', 'F7']);
  assert.deepEqual(names(song.measures[1]), ['F7', 'E5']);
  assert.deepEqual(findDuplicateIds(song), []);
  valid(song);
});

test('sustituir digitación en varias tarjetas: una copiada para todas, o una por tarjeta', () => {
  const song = clone(loadDemo());
  const sources = copyCards(song, ['v:v5']);
  assert.equal(canReplaceFingerings(2, sources), true);
  replaceFingerings(song, ['v:v1', 'v:v3'], sources);
  const frets = (key) => songCards(song).find((card) => card.key === key).voicing.frets;
  assert.deepEqual(frets('v:v1'), frets('v:v5'));
  assert.deepEqual(frets('v:v3'), frets('v:v5'));
  assert.equal(song.measures[0].chordEvents[0].chordName, 'Cm7', 'el nombre no cambia');
  song.measures[3].chordEvents.push({ id: 'ep', chordName: 'G', voicings: [] });
  const [pending] = replaceFingerings(song, ['e:ep'], sources);
  assert.equal(pending.eventId, 'ep');
  assert.ok(pending.voicingId, 'la tarjeta pendiente recibe digitación');
  assert.equal(canReplaceFingerings(1, [{ event: { chordName: 'X' }, voicing: null }]), false);
  valid(song);
});

test('duplicar tarjetas salteadas: las copias van tras la última seleccionada de cada compás', () => {
  const song = clone(loadDemo());
  pasteCards(song, 'm2', null, copyCards(song, ['v:v5']), 'after');
  const created = duplicateCards(song, ['v:v3', flatCards(song.measures[1])[2].key, 'v:v1']);
  assert.equal(created.length, 3);
  assert.deepEqual(names(song.measures[0]), ['Cm7', 'Cm7', 'Cm7']);
  assert.equal(keysOf(song.measures[0])[0], 'v:v1');
  assert.equal(keysOf(song.measures[0])[2], 'v:v2', 'la copia de v1 va justo tras v1, la última marcada de su compás');
  assert.deepEqual(names(song.measures[1]), ['F7', 'Bbmaj7', 'E5', 'F7', 'E5']);
  assert.deepEqual(findDuplicateIds(song), []);
  const parsed = parseSongJson(serializeSong(song));
  assert.deepEqual(parsed.song, song);
  valid(song);
});

/* ---------- Selección en el store ---------- */

test('Ctrl+clic: la tarjeta marca la tarjeta, el resto del compás marca el compás, y nunca a la vez', () => {
  const store = createStore(clone(loadDemo()));
  store.select({ measureId: 'm1', eventId: 'e1', voicingId: 'v1' }, { kind: 'card' });
  assert.equal(selectionTarget(store.state), 'card');
  store.toggleMarkedCard({ measureId: 'm1', eventId: 'e1', voicingId: 'v2' }, { withActive: true });
  assert.deepEqual(store.state.markedCards, ['v:v1', 'v:v2'], 'incluye la tarjeta activa');
  store.toggleMarkedCard({ measureId: 'm3', eventId: 'e4', voicingId: 'v5' }, { withActive: true });
  assert.deepEqual(targetCardKeys(store.state), ['v:v1', 'v:v2', 'v:v5']);
  assert.equal(store.state.selection.voicingId, 'v5');
  store.toggleMarkedCard({ measureId: 'm1', eventId: 'e1', voicingId: 'v2' }, { withActive: true });
  assert.deepEqual(store.state.markedCards, ['v:v1', 'v:v5'], 'salteadas');

  store.toggleMarked('m1', { withActive: true });
  assert.deepEqual(store.state.markedCards, [], 'marcar el compás quita sus tarjetas');
  assert.deepEqual(store.state.marked, ['m1'], 'y no añade el compás activo: lo señalado antes era una tarjeta');
  assert.equal(selectionTarget(store.state), 'measure');
  store.toggleMarkedCard({ measureId: 'm2', eventId: 'e2', voicingId: 'v3' }, { withActive: true });
  assert.deepEqual(store.state.marked, []);
  assert.deepEqual(store.state.markedCards, ['v:v3'], 'no añade la tarjeta activa: lo señalado antes era un compás');
  assert.deepEqual(targetMeasureIds(store.state), ['m2']);
  assert.equal(store.state.canUndo, false, 'seleccionar no crea pasos');
});

test('Mayús+clic en una tarjeta marca las tarjetas intermedias en orden escrito; Esc lo quita todo', () => {
  const store = createStore(clone(loadDemo()));
  store.select({ measureId: 'm1', eventId: 'e1', voicingId: 'v2' }, { kind: 'card' });
  store.markCardRange({ measureId: 'm3', eventId: 'e4', voicingId: 'v5' });
  assert.deepEqual(store.state.markedCards, ['v:v2', 'v:v3', 'v:v4', 'v:v5']);
  assert.equal(store.state.selection.voicingId, 'v2', 'la activa no cambia');
  store.setMarked([]);
  assert.deepEqual([store.state.marked, store.state.markedCards], [[], []]);
  store.selectMeasure('m2');
  store.markCardRange({ measureId: 'm3', eventId: 'e4', voicingId: 'v5' });
  assert.deepEqual(store.state.markedCards, ['v:v5'], 'sin tarjeta señalada, marca solo la pulsada');
});

test('las tarjetas marcadas se limpian si desaparecen y sobreviven a deshacer', () => {
  const store = createStore(clone(loadDemo()));
  store.setMarkedCards(['v:v5', 'v:v1'], { measureId: 'm1', eventId: 'e1', voicingId: 'v1' });
  assert.deepEqual(store.state.markedCards, ['v:v1', 'v:v5'], 'orden escrito');
  removeCards(store.state.song, ['v:v5']);
  store.commit('structure');
  assert.deepEqual(store.state.markedCards, ['v:v1']);
  store.undo();
  assert.deepEqual(store.state.markedCards, ['v:v1']);
  const pasted = pasteCards(store.state.song, 'm4', null, copyCards(store.state.song, ['v:v1', 'v:v3']));
  store.commit('structure', pasted[0], { markedCards: pasted.map(selectionKey), kind: 'card' });
  assert.equal(store.state.markedCards.length, 2);
  store.undo();
  assert.deepEqual(store.state.markedCards, [], 'lo pegado ya no existe');
  assert.equal(JSON.stringify(store.state.song).includes('markedCards'), false);
  store.replaceSong(clone(loadDemo()));
  assert.equal(store.state.selectionKind, 'measure');
});
