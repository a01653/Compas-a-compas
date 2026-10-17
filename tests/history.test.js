import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, selectedEvent, selectedVoicing } from '../src/store.js';
import { addMeasure, deleteMeasure, setCardText, effectiveText } from '../src/model/song.js';
import { addMark, deleteMark } from '../src/model/marks.js';
import { checkStructure } from '../src/model/structure.js';
import { validateSong } from '../src/model/validate.js';
import { clone, loadDemo } from './helpers.js';

const demoStore = options => createStore(clone(loadDemo()), options);
function title(store, value) { store.state.song.title = value; store.emit('text'); }

test('deshacer y rehacer texto conserva el documento original, sus IDs y el guardado', () => {
  const store = demoStore();
  const original = JSON.stringify(store.state.song);
  title(store, 'Corregido');
  assert.equal(store.state.canUndo, true);
  assert.equal(store.undo(), true);
  assert.equal(JSON.stringify(store.state.song), original);
  assert.equal(store.state.dirty, false);
  assert.equal(store.state.canRedo, true);
  assert.equal(store.redo(), true);
  assert.equal(store.state.song.title, 'Corregido');
  assert.equal(store.state.dirty, true);
  assert.deepEqual(validateSong(store.state.song).errors, []);
  assert.equal('history' in store.state.song, false);
});

test('la escritura de un campo es un paso y otro campo empieza un paso distinto', () => {
  const store = demoStore();
  const original = store.state.song.title;
  store.beginEdit(); title(store, 'A'); title(store, 'AB'); title(store, 'ABC'); store.endEdit();
  store.beginEdit(); store.state.song.key = 'Re menor'; store.emit('text'); store.endEdit();
  store.undo(); assert.equal(store.state.song.title, 'ABC');
  store.undo(); assert.equal(store.state.song.title, original);
  assert.equal(store.state.canUndo, false);
  store.redo(); assert.equal(store.state.song.title, 'ABC');
});

test('cancelar una escritura dentro del grupo no deja un paso vacío', () => {
  const store = demoStore();
  const original = store.state.song.title;
  store.beginEdit(); title(store, 'X'); title(store, original);
  assert.equal(store.state.canUndo, false);
  title(store, 'Y'); store.undo();
  assert.equal(store.state.song.title, original);
});

test('navegar y ampliar no crean pasos; deshacer vuelve a la tarjeta editada', () => {
  const store = demoStore();
  store.selectVoicing('v2');
  selectedVoicing(store.state).insideText = 'Invertido'; store.emit('text');
  store.selectMeasure('m3'); store.setZoom(0.8);
  store.undo();
  assert.equal(store.state.selection.voicingId, 'v2');
  assert.equal(store.state.zoom, 0.8);
  store.redo(); assert.equal(store.state.selection.voicingId, 'v2');
  assert.equal(selectedVoicing(store.state).insideText, 'Invertido');
});

test('deshacer y rehacer una coda conserva su ID y restaura referencias al borrar', () => {
  const store = demoStore();
  const coda = addMark(store.state.song, 'marker', { type: 'coda', measureId: 'm1', edge: 'after' });
  store.commit('structure');
  const after = JSON.stringify(store.state.song);
  store.undo(); assert.equal(store.state.song.structure.markers.some(m => m.id === coda.id), false);
  store.redo(); assert.equal(JSON.stringify(store.state.song), after);
  deleteMark(store.state.song, coda.id); store.commit('structure');
  store.undo(); assert.equal(JSON.stringify(store.state.song), after);
});

test('deshacer el borrado de un compás restaura el contenido y los destinos musicales', () => {
  const store = demoStore();
  store.selectMeasure('m2');
  const original = JSON.stringify(store.state.song);
  const warnings = checkStructure(store.state.song);
  deleteMeasure(store.state.song, 'm2'); store.commit('structure');
  store.undo();
  assert.equal(JSON.stringify(store.state.song), original);
  assert.equal(store.state.selection.measureId, 'm2');
  assert.deepEqual(checkStructure(store.state.song), warnings);
  store.redo(); assert.equal(store.state.song.measures.some(m => m.id === 'm2'), false);
});

test('añadir y rehacer reutiliza la misma identidad y selección; una edición nueva descarta rehacer', () => {
  const store = demoStore();
  const measure = addMeasure(store.state.song);
  store.commit('structure', { measureId: measure.id });
  store.undo(); store.redo();
  assert.equal(store.state.selection.measureId, measure.id);
  store.undo(); title(store, 'Otra rama');
  assert.equal(store.state.canRedo, false);
  assert.equal(store.redo(), false);
});

test('guardar mantiene el historial y calcula los pendientes respecto al último archivo', () => {
  const store = demoStore();
  title(store, 'Guardado'); store.markSaved('tema.json');
  assert.equal(store.state.canUndo, true);
  store.undo(); assert.equal(store.state.dirty, true);
  assert.equal(store.state.fileName, 'tema.json');
  store.redo(); assert.equal(store.state.dirty, false);
  assert.equal(store.state.fileName, 'tema.json');
});

test('abrir, nueva canción y recuperación inician un historial independiente', () => {
  const store = demoStore(); title(store, 'Anterior'); store.undo();
  store.replaceSong(clone(loadDemo()), { fileName: 'nuevo.json', dirty: true });
  assert.equal(store.undo(), false); assert.equal(store.redo(), false);
  assert.equal(store.state.dirty, true);
  title(store, 'Recuperado'); store.undo();
  assert.equal(store.state.dirty, true);
  assert.equal(store.state.fileName, 'nuevo.json');
});

test('el historial está limitado por pasos y tamaño, y notifica sin crear otra acción', () => {
  for (const options of [{ historyLimit: 2 }, { historyBudget: 1 }]) {
    const store = demoStore(options);
    title(store, 'Uno'); title(store, 'Dos'); title(store, 'Tres');
    const scopes = []; store.subscribe((s, scope) => scopes.push(scope));
    store.undo();
    assert.equal(store.state.song.title, 'Dos');
    if (options.historyLimit) { store.undo(); assert.equal(store.state.song.title, 'Uno'); }
    assert.equal(store.undo(), false);
    assert.ok(scopes.every(scope => scope === 'history'));
  }
});

test('editar el texto visible de una posición no toca las otras ni los valores comunes', () => {
  const store = demoStore();
  const event = selectedEvent(store.state), [first, second] = event.voicings;
  event.insideText = 'Común'; second.insideText = 'Propio';
  setCardText(event, first, 'insideText', 'Nuevo');
  assert.equal(effectiveText(event, first, 'insideText'), 'Nuevo');
  assert.equal(effectiveText(event, second, 'insideText'), 'Propio');
  assert.equal(event.insideText, 'Común');
  setCardText(event, first, 'insideText', '');
  assert.equal(effectiveText(event, first, 'insideText'), '');
  assert.equal(event.insideText, 'Común');
});

test('aplicar un campo a todas sustituye sus excepciones y deja el otro campo intacto; se puede deshacer', () => {
  const store = demoStore();
  const original = JSON.stringify(store.state.song);
  const event = selectedEvent(store.state), voicing = selectedVoicing(store.state);
  const above = event.voicings.map(v => effectiveText(event, v, 'aboveText'));
  setCardText(event, voicing, 'insideText', 'Compartido', true); store.emit('text');
  assert.ok(event.voicings.every(v => effectiveText(event, v, 'insideText') === 'Compartido'));
  assert.deepEqual(event.voicings.map(v => effectiveText(event, v, 'aboveText')), above);
  store.undo(); assert.equal(JSON.stringify(store.state.song), original);
  store.redo();
  const restored = selectedEvent(store.state);
  setCardText(restored, selectedVoicing(store.state), 'insideText', '', true); store.emit('text');
  assert.ok(restored.voicings.every(v => effectiveText(restored, v, 'insideText') === ''));
});
