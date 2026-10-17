import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/store.js';
import { findDuplicateIds } from '../src/model/ids.js';
import { effectiveText } from '../src/model/song.js';
import { addCard, duplicateCard, findCard, flatCards, isolateCard, removeCard, selectionOf, setCardTextValue } from '../src/model/cards.js';
import { deriveTonalityContext } from '../src/model/tonality.js';
import { validateSong } from '../src/model/validate.js';
import { parseSongJson, serializeSong } from '../src/model/serialize.js';
import { clone, loadDemo } from './helpers.js';

/** Archivo antiguo: e1 agrupa tres voicings que compartían nombre y calidad; e2 es una tarjeta pendiente. */
function legacy() {
  return {
    schemaVersion: 1,
    title: 'Antigua',
    key: 'Do mayor',
    measures: [
      { id: 'm1', label: '1', chordEvents: [
        { id: 'e1', chordName: 'Dm7', family: 'minor', aboveText: 'Intro', insideText: 'Drop 2', voicings: [
          { id: 'v1', frets: [null, 5, 7, 5, 6, 5] },
          { id: 'v2', frets: [null, 5, 3, 5, 3, null], insideText: '' },
          { id: 'v3', frets: [10, 12, 10, 10, null, null], aboveText: 'Otro', voicingDegree: 'ii', tonality: { text: 'Re menor', family: 'minor' } },
        ] },
        { id: 'e2', chordName: 'G7', family: 'dominant', voicings: [] },
      ] },
      { id: 'm2', label: '2', chordEvents: [
        { id: 'e3', chordName: 'Cmaj7', family: 'major', voicings: [{ id: 'v4', frets: [null, 3, 2, 0, 0, 0] }] },
      ] },
    ],
    structure: {
      repeats: [{ id: 'r1', startMeasureId: 'm1', endMeasureId: 'm2', times: 2 }],
      endings: [],
      markers: [{ id: 'k1', type: 'segno', measureId: 'm2', edge: 'before' }],
      jumps: [],
    },
  };
}

/** Todo lo que el lector ve de cada tarjeta, sea cual sea el acorde que la contenga. */
function snapshot(song) {
  const map = {};
  for (const measure of song.measures) {
    for (const event of measure.chordEvents) {
      if (!event.voicings.length) {
        map[`e:${event.id}`] = { name: event.chordName, family: event.family, above: effectiveText(event, null, 'aboveText'), inside: effectiveText(event, null, 'insideText') };
      }
      for (const v of event.voicings) {
        map[`v:${v.id}`] = {
          name: event.chordName, family: event.family, above: effectiveText(event, v, 'aboveText'), inside: effectiveText(event, v, 'insideText'),
          frets: v.frets, degree: v.voicingDegree, tonality: v.tonality,
        };
      }
    }
  }
  return map;
}
const keys = measure => flatCards(measure).map(card => card.key);
const eventShape = measure => measure.chordEvents.map(e => e.voicings.map(v => v.id));
const valid = song => { assert.deepEqual(validateSong(song).errors, []); assert.deepEqual(findDuplicateIds(song), []); };

test('el selector plano cuenta cada voicing y cada acorde sin voicings, con claves que no se confunden', () => {
  const song = legacy();
  assert.deepEqual(keys(song.measures[0]), ['v:v1', 'v:v2', 'v:v3', 'e:e2']);
  assert.deepEqual(keys(song.measures[1]), ['v:v4']);
  assert.equal(findCard(song.measures[0], 'e:e2').voicing, null);
  assert.deepEqual(selectionOf(findCard(song.measures[0], 'e:e2')), { eventId: 'e2', voicingId: null });
  assert.equal(findCard(song.measures[0], 'v:e2'), null);
});

test('abrir, derivar y guardar un archivo antiguo no lo migra ni lo cambia', () => {
  const song = legacy();
  const text = JSON.stringify(song);
  flatCards(song.measures[0]); deriveTonalityContext(song);
  assert.equal(JSON.stringify(song), text);
  const result = parseSongJson(serializeSong(song));
  assert.equal(result.ok, true);
  assert.deepEqual(result.song, song);
  assert.equal(result.song.measures[0].chordEvents[0].voicings.length, 3);
});

test('aislar la tarjeta central separa solo esa: orden, IDs, textos efectivos y digitaciones intactos', () => {
  const song = legacy();
  const before = snapshot(song);
  const order = keys(song.measures[0]);
  const measure = song.measures[0];
  const event = isolateCard(song, measure, measure.chordEvents[0], measure.chordEvents[0].voicings[1]);
  assert.deepEqual(eventShape(measure), [['v1'], ['v2'], ['v3'], []]);
  assert.equal(measure.chordEvents[0].id, 'e1', 'el primer fragmento conserva el ID');
  assert.equal(event, measure.chordEvents[1]);
  assert.ok(!['e1', 'e2', 'e3'].includes(event.id) && event.id !== measure.chordEvents[2].id);
  assert.equal(measure.chordEvents[3].id, 'e2');
  assert.deepEqual(keys(measure), order);
  assert.deepEqual(snapshot(song), before);
  assert.equal(effectiveText(event, event.voicings[0], 'insideText'), '', 'la cadena vacía sigue ocultando la anotación');
  assert.deepEqual(song.structure, legacy().structure);
  valid(song);
});

test('aislar la primera conserva el ID en ella y deja el resto agrupado; aislar la última, al revés', () => {
  const first = legacy();
  const beforeFirst = snapshot(first);
  isolateCard(first, first.measures[0], first.measures[0].chordEvents[0], first.measures[0].chordEvents[0].voicings[0]);
  assert.deepEqual(eventShape(first.measures[0]), [['v1'], ['v2', 'v3'], []]);
  assert.equal(first.measures[0].chordEvents[0].id, 'e1');
  assert.deepEqual(snapshot(first), beforeFirst);
  valid(first);

  const last = legacy();
  const beforeLast = snapshot(last);
  const solo = isolateCard(last, last.measures[0], last.measures[0].chordEvents[0], last.measures[0].chordEvents[0].voicings[2]);
  assert.deepEqual(eventShape(last.measures[0]), [['v1', 'v2'], ['v3'], []]);
  assert.equal(last.measures[0].chordEvents[0].id, 'e1');
  assert.notEqual(solo.id, 'e1');
  assert.deepEqual(snapshot(last), beforeLast);
  valid(last);
});

test('aislar una tarjeta que ya está sola, pendiente o sin voicing no cambia nada', () => {
  const song = legacy();
  const text = JSON.stringify(song);
  const [m1, m2] = song.measures;
  assert.equal(isolateCard(song, m2, m2.chordEvents[0], m2.chordEvents[0].voicings[0]), m2.chordEvents[0]);
  assert.equal(isolateCard(song, m1, m1.chordEvents[1], null), m1.chordEvents[1]);
  assert.equal(JSON.stringify(song), text);
});

test('cambiar nombre o calidad tras aislar no toca a las demás tarjetas', () => {
  const song = legacy();
  const measure = song.measures[0];
  const event = isolateCard(song, measure, measure.chordEvents[0], measure.chordEvents[0].voicings[1]);
  event.chordName = 'Am7'; event.family = 'minor';
  const after = snapshot(song);
  assert.equal(after['v:v2'].name, 'Am7');
  assert.equal(after['v:v1'].name, 'Dm7');
  assert.equal(after['v:v3'].name, 'Dm7');
  assert.equal(after['e:e2'].name, 'G7');
  event.family = 'dominant';
  assert.equal(snapshot(song)['v:v1'].family, 'minor');
  valid(song);
});

test('los textos de una tarjeta se editan solo en ella, también en un acorde antiguo sin separar', () => {
  const song = legacy();
  const event = song.measures[0].chordEvents[0];
  setCardTextValue(event, event.voicings[0], 'aboveText', 'Solo la primera');
  const after = snapshot(song);
  assert.equal(after['v:v1'].above, 'Solo la primera');
  assert.equal(after['v:v2'].above, 'Intro');
  assert.equal(after['v:v3'].above, 'Otro');
  setCardTextValue(event, event.voicings[1], 'insideText', 'Nueva');
  assert.equal(snapshot(song)['v:v1'].inside, 'Drop 2');
  const pending = song.measures[0].chordEvents[1];
  setCardTextValue(pending, null, 'aboveText', 'Pendiente');
  assert.equal(pending.aboveText, 'Pendiente');
  setCardTextValue(pending, null, 'aboveText', '');
  assert.equal('aboveText' in pending, false);
});

test('añadir tarjeta: acorde independiente con una digitación vacía, justo después de la seleccionada', () => {
  const song = legacy();
  const before = snapshot(song);
  const created = addCard(song, 'm1', { eventId: 'e1', voicingId: 'v1' });
  const measure = song.measures[0];
  assert.deepEqual(eventShape(measure), [['v1'], [created.voicing.id], ['v2', 'v3'], []]);
  assert.equal(measure.chordEvents[0].id, 'e1');
  assert.equal(created.event.chordName, 'Acorde nuevo');
  assert.deepEqual(created.voicing.frets, [null, null, null, null, null, null]);
  const after = snapshot(song);
  for (const key of Object.keys(before)) assert.deepEqual(after[key], before[key], key);
  assert.deepEqual(keys(measure).slice(0, 3), ['v:v1', `v:${created.voicing.id}`, 'v:v2']);
  valid(song);
});

test('añadir tarjeta al final, tras una pendiente, sin selección y en un compás vacío', () => {
  const song = legacy();
  const last = addCard(song, 'm1', { eventId: 'e2', voicingId: null });
  assert.equal(song.measures[0].chordEvents.at(-1).id, last.event.id);
  const end = addCard(song, 'm1', { eventId: 'e1', voicingId: 'v3' });
  assert.deepEqual(eventShape(song.measures[0]).slice(0, 3).map(ids => ids.length), [3, 1, 0]);
  assert.equal(song.measures[0].chordEvents[1].id, end.event.id);
  const none = addCard(song, 'm2');
  assert.equal(song.measures[1].chordEvents.at(-1).id, none.event.id);
  song.measures.push({ id: 'm3', label: '3', chordEvents: [] });
  const empty = addCard(song, 'm3', null);
  assert.deepEqual(keys(song.measures[2]), [`v:${empty.voicing.id}`]);
  assert.equal(addCard(song, 'no-existe'), null);
  valid(song);
});

test('duplicar crea una tarjeta independiente y fiel justo después, con IDs nuevos', () => {
  const song = legacy();
  const before = snapshot(song);
  const copy = duplicateCard(song, 'm1', 'e1', 'v2');
  const measure = song.measures[0];
  assert.deepEqual(eventShape(measure), [['v1', 'v2'], [copy.voicing.id], ['v3'], []]);
  assert.ok(!['e1', 'e2', 'e3', 'v1', 'v2', 'v3', 'v4'].includes(copy.event.id));
  assert.ok(!['v1', 'v2', 'v3', 'v4'].includes(copy.voicing.id));
  const after = snapshot(song);
  assert.deepEqual(after[`v:${copy.voicing.id}`], { ...before['v:v2'] });
  assert.equal(after[`v:${copy.voicing.id}`].inside, '', 'la cadena vacía se copia como vacía');
  for (const key of Object.keys(before)) assert.deepEqual(after[key], before[key], key);
  copy.event.chordName = 'Otra';
  copy.voicing.frets[0] = 9;
  assert.equal(snapshot(song)['v:v2'].name, 'Dm7');
  assert.equal(snapshot(song)['v:v2'].frets[0], null);
  valid(song);
});

test('duplicar copia grado y tonalidad propia, y también una tarjeta pendiente', () => {
  const song = legacy();
  const copy = duplicateCard(song, 'm1', 'e1', 'v3');
  assert.deepEqual(copy.voicing.tonality, { text: 'Re menor', family: 'minor' });
  assert.equal(copy.voicing.voicingDegree, 'ii');
  copy.voicing.tonality.text = 'cambiada';
  assert.equal(song.measures[0].chordEvents[0].voicings[2].tonality.text, 'Re menor');
  const pending = duplicateCard(song, 'm1', 'e2', null);
  assert.equal(pending.voicing, null);
  assert.equal(pending.event.chordName, 'G7');
  assert.deepEqual(pending.event.voicings, []);
  assert.equal(duplicateCard(song, 'm1', 'e1', 'v4'), null);
  valid(song);
});

test('quitar elimina solo esa tarjeta, y el acorde cuando se queda sin ninguna', () => {
  const song = legacy();
  const middle = removeCard(song, 'm1', 'e1', 'v2');
  assert.deepEqual(eventShape(song.measures[0]), [['v1', 'v3'], []]);
  assert.deepEqual(middle, { removed: true, next: { eventId: 'e1', voicingId: 'v3' } });
  const pending = removeCard(song, 'm1', 'e2', null);
  assert.deepEqual(eventShape(song.measures[0]), [['v1', 'v3']]);
  assert.deepEqual(pending.next, { eventId: 'e1', voicingId: 'v3' }, 'si era la última, queda seleccionada la anterior');
  const only = removeCard(song, 'm2', 'e3', 'v4');
  assert.deepEqual(song.measures[1].chordEvents, []);
  assert.deepEqual(only, { removed: true, next: null });
  assert.deepEqual(removeCard(song, 'm2', 'e3', 'v4'), { removed: false, next: null });
  valid(song);
});

test('quitar todas las tarjetas deja el compás vacío y válido; la estructura no se toca', () => {
  const song = legacy();
  const structure = clone(song.structure);
  let selection = { eventId: 'e1', voicingId: 'v1' };
  let guard = 0;
  while (selection && guard++ < 10) selection = removeCard(song, 'm1', selection.eventId, selection.voicingId).next;
  assert.deepEqual(song.measures[0].chordEvents, []);
  assert.deepEqual(song.structure, structure);
  assert.deepEqual(validateSong(song).errors, []);
});

test('separar y duplicar conservan las referencias de marcas y el contexto de tonalidad', () => {
  const song = legacy();
  const structure = clone(song.structure);
  const contextBefore = [...deriveTonalityContext(song)];
  const measure = song.measures[0];
  isolateCard(song, measure, measure.chordEvents[0], measure.chordEvents[0].voicings[1]);
  assert.deepEqual(song.structure, structure);
  assert.deepEqual([...deriveTonalityContext(song)], contextBefore, 'mismo orden y mismo contexto por voicing');
  const copy = duplicateCard(song, 'm1', measure.chordEvents[1].id, 'v2');
  const context = deriveTonalityContext(song);
  assert.equal(context.get(copy.voicing.id).text, context.get('v2').text);
  assert.equal(context.get('v3').explicit, true);
  assert.equal(context.get('v3').text, 'Re menor');
  assert.equal(context.get('v4').text, 'Re menor', 'hereda de la última tonalidad explícita en orden escrito');
});

test('con el ejemplo del repositorio: cada tarjeta se puede aislar y el documento sigue válido', () => {
  const song = clone(loadDemo());
  const before = Object.keys(snapshot(song));
  for (const measure of song.measures) {
    // Cada aislamiento deja el resto agrupado en un acorde nuevo; se repite hasta que todas están solas.
    let changed;
    do {
      changed = false;
      for (const event of [...measure.chordEvents]) {
        if (event.voicings.length > 1) { isolateCard(song, measure, event, event.voicings[0]); changed = true; }
      }
    } while (changed);
    assert.ok(measure.chordEvents.every(event => event.voicings.length <= 1));
  }
  assert.deepEqual(Object.keys(snapshot(song)), before);
  valid(song);
});

test('historial: separar la tarjeta y escribir su nombre es un solo paso que se deshace y rehace entero', () => {
  const store = createStore(legacy());
  store.select({ measureId: 'm1', eventId: 'e1', voicingId: 'v2' });
  const original = JSON.stringify(store.state.song);
  store.beginEdit();
  // Lo mismo que hace el editor al primer carácter: separa, actualiza la selección y emite sin reconstruir.
  const { song } = store.state;
  const measure = song.measures[0];
  let event = isolateCard(song, measure, measure.chordEvents[0], measure.chordEvents[0].voicings[1]);
  store.state.selection = { ...store.state.selection, eventId: event.id };
  for (const text of ['A', 'Am', 'Am7']) { event.chordName = text; store.emit('text'); }
  store.endEdit();
  const edited = JSON.stringify(store.state.song);
  assert.equal(store.state.selection.voicingId, 'v2');
  assert.notEqual(store.state.selection.eventId, 'e1');
  assert.equal(store.state.song.measures[0].chordEvents[0].chordName, 'Dm7');

  assert.equal(store.undo(), true);
  assert.equal(JSON.stringify(store.state.song), original);
  assert.deepEqual(store.state.selection, { measureId: 'm1', eventId: 'e1', voicingId: 'v2' });
  assert.equal(store.state.canUndo, false, 'separación y escritura forman un único paso');
  assert.equal(store.redo(), true);
  assert.equal(JSON.stringify(store.state.song), edited);
  assert.equal(snapshot(store.state.song)['v:v2'].name, 'Am7');
  assert.equal(snapshot(store.state.song)['v:v1'].name, 'Dm7');
  assert.deepEqual(validateSong(store.state.song).errors, []);
});

test('historial: completar una tarjeta pendiente con su primera digitación se deshace sin dejar rastro', () => {
  const store = createStore(legacy());
  store.select({ measureId: 'm1', eventId: 'e2', voicingId: null });
  assert.deepEqual(store.state.selection, { measureId: 'm1', eventId: 'e2', voicingId: null });
  const original = JSON.stringify(store.state.song);
  store.beginEdit();
  const event = store.state.song.measures[0].chordEvents[1];
  const voicing = { id: 'v9', frets: [null, 3, 2, 0, 1, 0] };
  event.voicings.push(voicing);
  store.state.selection = { ...store.state.selection, voicingId: 'v9' };
  store.emit('text'); store.endEdit();
  assert.deepEqual(keys(store.state.song.measures[0]), ['v:v1', 'v:v2', 'v:v3', 'v:v9']);
  store.undo();
  assert.equal(JSON.stringify(store.state.song), original);
  assert.deepEqual(store.state.selection, { measureId: 'm1', eventId: 'e2', voicingId: null });
});

test('historial: añadir, duplicar y quitar tarjeta son pasos propios', () => {
  const store = createStore(legacy());
  const original = JSON.stringify(store.state.song);
  const added = addCard(store.state.song, 'm2', { eventId: 'e3', voicingId: 'v4' });
  store.commit('structure', { measureId: 'm2', eventId: added.event.id, voicingId: added.voicing.id });
  const copy = duplicateCard(store.state.song, 'm2', added.event.id, added.voicing.id);
  store.commit('structure', { measureId: 'm2', eventId: copy.event.id, voicingId: copy.voicing.id });
  const { next } = removeCard(store.state.song, 'm2', copy.event.id, copy.voicing.id);
  store.commit('structure', { measureId: 'm2', ...next });
  assert.deepEqual(keys(store.state.song.measures[1]), ['v:v4', `v:${added.voicing.id}`]);
  store.undo(); assert.equal(keys(store.state.song.measures[1]).length, 3);
  store.undo(); assert.equal(keys(store.state.song.measures[1]).length, 2);
  store.undo(); assert.equal(JSON.stringify(store.state.song), original);
  store.redo(); store.redo(); store.redo();
  assert.equal(keys(store.state.song.measures[1]).length, 2);
  assert.deepEqual(validateSong(store.state.song).errors, []);
});
