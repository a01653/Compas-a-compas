import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, selectedEvent, selectedMeasure, selectedVoicing } from '../src/store.js';
import { createRecovery } from '../src/persist/recovery.js';
import { parseSongJson } from '../src/model/serialize.js';
import { addMeasure, deleteMeasure, createEmptySong } from '../src/model/song.js';
import { clone, loadDemo } from './helpers.js';

function demoStore() {
  return createStore(clone(loadDemo()));
}

test('la selección inicial apunta al primer compás, acorde y voicing', () => {
  const store = demoStore();
  assert.deepEqual(store.state.selection, { measureId: 'm1', eventId: 'e1', voicingId: 'v1' });
});

test('seleccionar compás, acorde y voicing mantiene la selección coherente', () => {
  const store = demoStore();
  store.selectMeasure('m2');
  assert.deepEqual(store.state.selection, { measureId: 'm2', eventId: 'e2', voicingId: 'v3' });
  store.selectEvent('e3');
  assert.equal(selectedEvent(store.state).chordName, 'Bbmaj7');
  store.selectMeasure('m1');
  store.selectVoicing('v2');
  assert.equal(selectedVoicing(store.state).id, 'v2');
  store.selectMeasure('m4'); // compás vacío
  assert.deepEqual(store.state.selection, { measureId: 'm4', eventId: null, voicingId: null });
  store.selectMeasure('no-existe');
  assert.equal(selectedMeasure(store.state).id, 'm1', 'un ID inexistente se normaliza al primer compás');
});

test('cambios pendientes: se detectan, se revierten al escribir lo mismo y se limpian al guardar', () => {
  const store = demoStore();
  assert.equal(store.state.dirty, false);
  const original = store.state.song.title;
  store.state.song.title = 'Otro título';
  store.emit('text');
  assert.equal(store.state.dirty, true);
  store.state.song.title = original;
  store.emit('text');
  assert.equal(store.state.dirty, false);

  store.state.song.key = 'Re menor';
  store.emit('text');
  assert.equal(store.state.dirty, true);
  const events = [];
  store.subscribe((state, scope) => events.push(scope));
  store.markSaved('x.json');
  assert.equal(store.state.dirty, false);
  assert.equal(store.state.fileName, 'x.json');
  assert.deepEqual(events, ['status']);
});

test('seleccionar o cambiar el zoom no cuenta como cambio', () => {
  const store = demoStore();
  store.selectMeasure('m3');
  store.setZoom(0.8);
  assert.equal(store.state.dirty, false);
});

test('emitir con scope text no reordena ni cambia la selección', () => {
  const store = demoStore();
  store.selectVoicing('v2');
  store.state.song.measures[0].chordEvents[0].chordName = 'Cm9';
  store.emit('text');
  assert.equal(store.state.selection.voicingId, 'v2');
});

test('borrar el compás seleccionado deja la selección en uno existente', () => {
  const store = demoStore();
  store.selectMeasure('m2');
  deleteMeasure(store.state.song, 'm2');
  store.commit('structure');
  assert.equal(store.state.selection.measureId, 'm1');
  assert.equal(store.state.dirty, true);
});

test('borrar todos los compases deja selección vacía sin errores', () => {
  const store = createStore(createEmptySong());
  deleteMeasure(store.state.song, 'm1');
  store.commit('structure');
  assert.deepEqual(store.state.selection, { measureId: null, eventId: null, voicingId: null });
  const m = addMeasure(store.state.song);
  store.commit('structure', { measureId: m.id });
  assert.equal(store.state.selection.measureId, m.id);
});

test('replaceSong sustituye la canción, limpia pendientes y avisa con document', () => {
  const store = demoStore();
  store.state.song.title = 'Cambiado';
  store.emit('text');
  const scopes = [];
  store.subscribe((state, scope) => scopes.push(scope));
  store.replaceSong(createEmptySong());
  assert.deepEqual(scopes, ['document']);
  assert.equal(store.state.dirty, false);
  assert.equal(store.state.song.title, '');
  assert.equal(store.state.selection.measureId, 'm1');
});

test('replaceSong con dirty: true (recuperación) queda como pendiente', () => {
  const store = demoStore();
  store.replaceSong(createEmptySong(), { dirty: true });
  assert.equal(store.state.dirty, true);
});

/* ---------- Recuperación en almacenamiento ---------- */

function fakeStorage() {
  const data = new Map();
  return {
    setItem: (k, v) => data.set(k, v),
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    removeItem: (k) => data.delete(k),
  };
}

test('recuperación: guarda, carga una canción que vuelve a validar y borra', () => {
  const recovery = createRecovery(() => fakeStorage());
  const storage = fakeStorage();
  const r = createRecovery(() => storage);
  assert.equal(r.load(), null);
  assert.equal(r.save(loadDemo(), new Date('2026-10-16T10:00:00Z')), true);
  const loaded = r.load();
  assert.equal(loaded.savedAt, '2026-10-16T10:00:00.000Z');
  const parsed = parseSongJson(loaded.json);
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.song, loadDemo());
  assert.equal(r.clear(), true);
  assert.equal(r.load(), null);
  assert.ok(recovery);
});

test('recuperación: sin almacenamiento o con fallos no lanza y devuelve false/null', () => {
  const none = createRecovery(() => undefined);
  assert.equal(none.save(loadDemo()), false);
  assert.equal(none.load(), null);
  assert.equal(none.clear(), false);

  const throwing = createRecovery(() => { throw new Error('SecurityError'); });
  assert.equal(throwing.save(loadDemo()), false);
  assert.equal(throwing.load(), null);

  const full = createRecovery(() => ({ setItem() { throw new Error('QuotaExceededError'); }, getItem: () => null, removeItem() {} }));
  assert.equal(full.save(loadDemo()), false);

  const corrupt = createRecovery(() => ({ getItem: () => '{no json', setItem() {}, removeItem() {} }));
  assert.equal(corrupt.load(), null);
});
