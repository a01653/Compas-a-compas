import test from 'node:test';
import assert from 'node:assert/strict';
import { addCard, copyCard, flatCards, moveCard, pasteCard, pasteFingering, canMoveCard } from '../src/model/cards.js';
import { findDuplicateIds, listIds } from '../src/model/ids.js';
import {
  canMoveMeasures, canReplaceMeasures, canSwapMeasures, copyMeasures, deleteMeasures, duplicateMeasures, expandToUnits,
  fixRepeatReferences, insertEmptyMeasure, insertionPoint, measureUnits, moveMeasures, numberingStart, pasteMeasures,
  renumberEnabled, renumberLabels, replaceMeasures, runStructural, setRenumberMeasures, swapMeasures,
} from '../src/model/measureOps.js';
import { parseSongJson, serializeSong } from '../src/model/serialize.js';
import { addMeasure, createEmptySong, setRepeatPrevious, setRepeatPreviousTwo } from '../src/model/song.js';
import { checkStructure, measureConsequences } from '../src/model/structure.js';
import { validateSong } from '../src/model/validate.js';
import { createStore, targetMeasureIds } from '../src/store.js';
import { clone, loadDemo } from './helpers.js';

const order = (song) => song.measures.map((m) => m.id);
const labels = (song) => song.measures.map((m) => m.label);
const repeatWarnings = (song) => checkStructure(song).filter((w) => w.kind === 'repeat');
const valid = (song) => assert.deepEqual(validateSong(song).errors, []);

/** m1..m6 con una tarjeta en m1, m2 y m3. */
function song6() {
  const song = createEmptySong();
  for (let i = 0; i < 5; i++) addMeasure(song);
  addCard(song, 'm1', null, 'C'); addCard(song, 'm2', null, 'D'); addCard(song, 'm3', null, 'E');
  return song;
}

/* ---------- Renumeración ---------- */

test('renumeración: activada por defecto, solo se guarda false', () => {
  const song = createEmptySong();
  assert.equal(renumberEnabled(song), true);
  setRenumberMeasures(song, false);
  assert.equal(song.renumberMeasures, false);
  valid(song);
  setRenumberMeasures(song, true);
  assert.equal('renumberMeasures' in song, false);
  assert.ok(validateSong({ ...createEmptySong(), renumberMeasures: 'no' }).errors.some((e) => e.path === 'renumberMeasures'));
});

test('renumerar conserva el número inicial y las etiquetas no numéricas', () => {
  const song = song6();
  song.measures.forEach((m, i) => { m.label = ['17', 'Intro', '19', '23', '12a', '30'][i]; });
  assert.equal(numberingStart(song), 17);
  const changed = renumberLabels(song);
  assert.deepEqual(labels(song), ['17', 'Intro', '18', '19', '12a', '20']);
  assert.deepEqual(changed, ['m3', 'm4', 'm6']);
});

test('insertar renumera los siguientes y, sin renumeración, conserva los números originales', () => {
  const song = song6();
  const result = runStructural(song, () => insertEmptyMeasure(song, ['m2'], 'after'));
  assert.deepEqual(labels(song), ['1', '2', '3', '4', '5', '6', '7']);
  assert.equal(song.measures[2].id, result.ids[0]);
  assert.equal(result.relabeled, 4, 'm3..m6 cambian de etiqueta');

  const kept = song6();
  setRenumberMeasures(kept, false);
  const before = runStructural(kept, () => insertEmptyMeasure(kept, ['m1'], 'before'));
  assert.equal(kept.measures[0].id, before.ids[0]);
  assert.deepEqual(labels(kept), ['7', '1', '2', '3', '4', '5', '6']);
  assert.equal(before.relabeled, 0);
});

test('borrar el primer compás no cambia el número inicial', () => {
  const song = song6();
  song.measures.forEach((m, i) => { m.label = String(i + 5); });
  const result = runStructural(song, () => deleteMeasures(song, ['m1']));
  assert.deepEqual(labels(song), ['5', '6', '7', '8', '9']);
  assert.equal(result.neighbourId, 'm2');
});

/* ---------- Insertar, borrar ---------- */

test('insertar antes y después de una selección múltiple', () => {
  const song = song6();
  insertEmptyMeasure(song, ['m4', 'm2'], 'before');
  assert.equal(order(song)[1].startsWith('m'), true);
  assert.equal(song.measures[2].id, 'm2');
  const after = insertEmptyMeasure(song, ['m2', 'm4'], 'after');
  assert.equal(order(song).indexOf(after.ids[0]), order(song).indexOf('m4') + 1);
  assert.deepEqual(findDuplicateIds(song), []);
});

test('insertar dentro de una pareja de repetición se desplaza fuera de ella', () => {
  const song = song6();
  setRepeatPreviousTwo(song, 'm3'); // m3 y m4 repiten m1 y m2
  assert.deepEqual(insertionPoint(song, ['m3'], 'after'), { index: 4, shifted: true });
  assert.deepEqual(insertionPoint(song, ['m4'], 'before'), { index: 2, shifted: true });
  const result = insertEmptyMeasure(song, ['m3'], 'after');
  assert.equal(result.shifted, true);
  assert.deepEqual(order(song).slice(2, 5), ['m3', 'm4', result.ids[0]]);
  assert.deepEqual(repeatWarnings(song), []);
});

test('borrar varios compases avisa de las consecuencias de todo el bloque, sin las relaciones internas', () => {
  const song = clone(loadDemo());
  const consequences = measureConsequences(song, ['m1', 'm2']);
  assert.ok(consequences.some((c) => /×3 empieza en el compás 1/.test(c)));
  assert.ok(consequences.some((c) => /×3 termina en el compás 2/.test(c)));
  assert.ok(consequences.some((c) => /To Coda está en el compás 2/.test(c)));
  assert.ok(consequences.some((c) => /D\.S\. al Coda apunta a una marca de los compases borrados/.test(c)));
  const pair = song6();
  setRepeatPrevious(pair, 'm3');
  pair.measures[2].chordEvents = []; // m3 repite m2
  assert.deepEqual(measureConsequences(pair, ['m2', 'm3']), [], 'm3 se borra con su origen');
  assert.equal(measureConsequences(pair, ['m2']).length, 1);
  const result = deleteMeasures(song, ['m2', 'm1']);
  assert.deepEqual(order(song), ['m3', 'm4']);
  assert.deepEqual(result.removed.map((m) => m.id), ['m1', 'm2']);
  assert.equal(result.neighbourId, 'm3');
  assert.ok(checkStructure(song).some((w) => w.objectId === 'rep1' && w.kind === 'missing'), 'las marcas se conservan pendientes');
});

/* ---------- Mover e intercambiar ---------- */

test('mover un compás: IDs y marcas viajan con él', () => {
  const song = clone(loadDemo());
  const before = new Set(listIds(song).map(([id]) => id));
  const result = moveMeasures(song, ['m3'], -1);
  assert.equal(result.moved, true);
  assert.deepEqual(order(song), ['m1', 'm3', 'm2', 'm4']);
  assert.deepEqual(new Set(listIds(song).map(([id]) => id)), before);
  assert.equal(song.structure.jumps.find((j) => j.id === 'jump2').measureId, 'm3');
  assert.equal(canMoveMeasures(song, ['m1'], -1), false);
  assert.equal(moveMeasures(song, ['m1'], -1).moved, false);
});

test('mover varios compases no contiguos conserva su orden', () => {
  const song = song6();
  moveMeasures(song, ['m2', 'm3', 'm5'], 1);
  assert.deepEqual(order(song), ['m1', 'm4', 'm2', 'm3', 'm6', 'm5']);
  moveMeasures(song, ['m2', 'm3', 'm5'], -1);
  assert.deepEqual(order(song), ['m1', 'm2', 'm3', 'm4', 'm5', 'm6']);
  assert.equal(canMoveMeasures(song, ['m3', 'm6'], 1), false, 'el último ya está al final');
});

test('mover avisa de tramos invertidos y de repeticiones sin su origen inmediato', () => {
  const song = clone(loadDemo());
  const result = moveMeasures(song, ['m2'], -1); // m2, m1: la repetición m1→m2 queda invertida
  assert.deepEqual(result.inversions.map((w) => w.objectId), ['rep1']);
  assert.equal(song.structure.repeats[0].startMeasureId, 'm1', 'el tramo no se recoloca');
  const rep = song6();
  setRepeatPrevious(rep, 'm4'); // m4 repite m3
  const moved = moveMeasures(rep, ['m3'], -1);
  assert.deepEqual(moved.repeats.map((w) => w.objectId), ['m4']);
  assert.equal(rep.measures.find((m) => m.id === 'm4').repeatPrevious.sourceMeasureId, 'm3', 'no se redirige');
  const renumbered = song6();
  setRepeatPrevious(renumbered, 'm4');
  const relabeled = runStructural(renumbered, () => moveMeasures(renumbered, ['m3'], -1));
  assert.match(relabeled.repeats[0].message, /apunta al compás 2\)/, 'el aviso usa las etiquetas ya renumeradas');
  assert.equal(fixRepeatReferences(rep, ['m4']), 1, 'la corrección es una acción expresa');
  assert.equal(rep.measures.find((m) => m.id === 'm4').repeatPrevious.sourceMeasureId, 'm2');
  assert.deepEqual(repeatWarnings(rep), []);
});

test('una pareja de repetición se mueve entera y no se separa', () => {
  const song = song6();
  setRepeatPreviousTwo(song, 'm3');
  assert.deepEqual(measureUnits(song), [['m1'], ['m2'], ['m3', 'm4'], ['m5'], ['m6']]);
  assert.deepEqual(expandToUnits(song, ['m4']), ['m3', 'm4']);
  const result = moveMeasures(song, ['m4'], 1);
  assert.deepEqual(result.ids, ['m3', 'm4']);
  assert.deepEqual(order(song), ['m1', 'm2', 'm5', 'm3', 'm4', 'm6']);
  assert.ok(result.repeats.some((w) => w.objectId === 'm3'), 'las fuentes dejan de ser inmediatas: se avisa');
  moveMeasures(song, ['m5'], 1); // m5 salta la pareja completa
  assert.deepEqual(order(song), ['m1', 'm2', 'm3', 'm4', 'm5', 'm6']);
  assert.deepEqual(repeatWarnings(song), []);
});

test('intercambiar dos compases conserva todos sus datos', () => {
  const song = clone(loadDemo());
  const m1 = clone(song.measures[0]);
  const m3 = clone(song.measures[2]);
  assert.equal(canSwapMeasures(song, ['m1']), false);
  assert.equal(canSwapMeasures(song, ['m1', 'm3']), true);
  const result = swapMeasures(song, ['m3', 'm1']);
  assert.equal(result.swapped, true);
  assert.deepEqual(order(song), ['m3', 'm2', 'm1', 'm4']);
  assert.deepEqual(song.measures[0], m3);
  assert.deepEqual(song.measures[2], m1);
  assert.equal(canSwapMeasures(song, ['m1', 'm2', 'm3']), false);
});

/* ---------- Copiar, pegar, duplicar ---------- */

test('copiar y pegar un bloque: IDs nuevos, contenido idéntico y original intacto', () => {
  const song = clone(loadDemo());
  const original = clone(song);
  const copied = copyMeasures(song, ['m2', 'm1']);
  assert.deepEqual(copied.map((m) => m.id), ['m1', 'm2'], 'orden escrito');
  const result = pasteMeasures(song, copied, 4, { renumber: true });
  assert.equal(result.ids.length, 2);
  assert.deepEqual(song.measures.slice(0, 4), original.measures);
  const [a, b] = song.measures.slice(4);
  assert.deepEqual(a.chordEvents.map((e) => e.voicings.map((v) => v.frets)), original.measures[0].chordEvents.map((e) => e.voicings.map((v) => v.frets)));
  assert.equal(a.chordEvents[0].voicings[1].aboveText, original.measures[0].chordEvents[0].voicings[1].aboveText);
  assert.notEqual(a.chordEvents[0].id, 'e1');
  assert.notEqual(b.chordEvents[1].voicings[0].id, 'v4');
  assert.deepEqual(findDuplicateIds(song), []);
  assert.deepEqual(song.structure, original.structure, 'la estructura no se copia ni cambia');
  valid(song);
});

test('las copias se marcan «(copia)» sin renumeración y se numeran con ella', () => {
  const kept = song6();
  setRenumberMeasures(kept, false);
  runStructural(kept, ({ renumber }) => duplicateMeasures(kept, ['m2', 'm3'], { renumber }));
  assert.deepEqual(labels(kept), ['1', '2', '3', '2 (copia)', '3 (copia)', '4', '5', '6']);
  const renumbered = song6();
  runStructural(renumbered, ({ renumber }) => duplicateMeasures(renumbered, ['m2', 'm3'], { renumber }));
  assert.deepEqual(labels(renumbered), ['1', '2', '3', '4', '5', '6', '7', '8']);
});

test('duplicar conserva acordes, voicings, textos, tonalidad, grados y ancho', () => {
  const song = song6();
  const m2 = song.measures[1];
  m2.widthPercent = 40;
  m2.fillToEdge = true;
  Object.assign(m2.chordEvents[0].voicings[0], {
    frets: [null, 3, 5, 3, 4, 3], degrees: [null, '1', '5', 'b7', 'b3', '5'], anchorFret: 3,
    voicingDegree: 'ii', tonality: { text: 'Bb', family: 'major' }, aboveText: 'Puente', insideText: 'Drop 2',
  });
  const result = duplicateMeasures(song, ['m2']);
  const copy = song.measures[2];
  assert.equal(copy.id, result.ids[0]);
  assert.equal(copy.widthPercent, 40);
  assert.equal('fillToEdge' in copy, false, 'el ajuste de línea pertenece a la línea del original');
  const { id: _a, ...voicing } = copy.chordEvents[0].voicings[0];
  const { id: _b, ...source } = m2.chordEvents[0].voicings[0];
  assert.deepEqual(voicing, source);
  assert.equal(copy.chordEvents[0].chordName, 'D');
  valid(song);
});

test('duplicar «repite el anterior» apunta al compás que queda delante; una pareja se rehace con IDs nuevos', () => {
  const song = song6();
  setRepeatPrevious(song, 'm4'); // m4 repite m3
  const single = duplicateMeasures(song, ['m4']);
  const copy = song.measures.find((m) => m.id === single.ids[0]);
  assert.deepEqual(copy.repeatPrevious, { sourceMeasureId: 'm4' });
  assert.deepEqual(repeatWarnings(song), []);

  const pair = song6();
  setRepeatPreviousTwo(pair, 'm3'); // m3 y m4 repiten m1 y m2
  const block = duplicateMeasures(pair, ['m1', 'm2', 'm3', 'm4']);
  const [c1, c2, c3, c4] = block.ids;
  assert.deepEqual(order(pair).slice(4, 8), [c1, c2, c3, c4]);
  assert.deepEqual(pair.measures[6].repeatPreviousTwo, { sourceMeasureIds: [c1, c2], targetMeasureIds: [c3, c4] });
  assert.deepEqual(repeatWarnings(pair), []);
  valid(pair);
});

test('copiar solo un destino de una pareja no copia la marca y no separa la original', () => {
  const song = song6();
  setRepeatPreviousTwo(song, 'm3');
  const result = duplicateMeasures(song, ['m3']);
  assert.equal(result.notes.length, 1);
  const copy = song.measures.find((m) => m.id === result.ids[0]);
  assert.equal('repeatPreviousTwo' in copy, false);
  assert.deepEqual(order(song).slice(2, 5), ['m3', 'm4', copy.id], 'se coloca después de la pareja');
  assert.deepEqual(repeatWarnings(song), []);
  const atStart = createEmptySong();
  const pasted = pasteMeasures(atStart, [{ id: 'mx', label: '9', chordEvents: [], repeatPrevious: { sourceMeasureId: 'mz' } }], 0);
  assert.equal('repeatPrevious' in atStart.measures[0], false, 'al principio no hay anterior');
  assert.equal(pasted.notes.length, 1);
});

test('pegar en otra canción no reutiliza IDs aunque estén libres y evita colisiones', () => {
  const source = clone(loadDemo());
  const target = createEmptySong();
  const pasted = pasteMeasures(target, copyMeasures(source, ['m1', 'm2', 'm3', 'm4']), 1);
  assert.equal(pasted.reused, 0);
  assert.deepEqual(findDuplicateIds(target), []);
  assert.equal(new Set(listIds(target).map(([id]) => id)).size, listIds(target).length);
  valid(target);
});

test('cortar y pegar en la misma canción conserva los IDs libres: las marcas vuelven a encontrar el compás', () => {
  const song = clone(loadDemo());
  const cut = copyMeasures(song, ['m4']);
  deleteMeasures(song, ['m4']);
  assert.ok(checkStructure(song).some((w) => w.objectId === 'coda1' && w.kind === 'missing'));
  const result = pasteMeasures(song, cut, 1, { reuseIds: true });
  assert.equal(result.reused, 1);
  assert.deepEqual(order(song), ['m1', 'm4', 'm2', 'm3']);
  assert.equal(checkStructure(song).some((w) => w.objectId === 'coda1'), false);
  const again = pasteMeasures(song, cut, 4, { reuseIds: true });
  assert.equal(again.reused, 0, 'el segundo pegado ya es una copia');
  assert.deepEqual(findDuplicateIds(song), []);
});

/* ---------- Sustituir ---------- */

test('sustituir el contenido conserva ID, etiqueta y marcas del compás', () => {
  const song = clone(loadDemo());
  const source = copyMeasures(song, ['m3']);
  const result = replaceMeasures(song, ['m1'], source);
  assert.equal(result.replaced, true);
  const m1 = song.measures[0];
  assert.equal(m1.id, 'm1');
  assert.equal(m1.label, '1');
  assert.deepEqual(m1.chordEvents.map((e) => e.chordName), song.measures[2].chordEvents.map((e) => e.chordName));
  assert.notEqual(m1.chordEvents[0].id, song.measures[2].chordEvents[0].id);
  assert.equal(song.structure.markers.find((m) => m.id === 'seg1').measureId, 'm1');
  assert.deepEqual(findDuplicateIds(song), []);
  valid(song);
});

test('sustituir: una fuente para varios compases, o tantas fuentes como compases', () => {
  const song = song6();
  const one = copyMeasures(song, ['m1']);
  const two = copyMeasures(song, ['m1', 'm2']);
  assert.equal(canReplaceMeasures(song, ['m4', 'm5', 'm6'], one), true);
  assert.equal(canReplaceMeasures(song, ['m4', 'm5', 'm6'], two), false);
  replaceMeasures(song, ['m5', 'm4'], two);
  assert.equal(song.measures[3].chordEvents[0].chordName, 'C');
  assert.equal(song.measures[4].chordEvents[0].chordName, 'D');
});

test('sustituir un destino de pareja quita la pareja; con «repite el anterior» apunta al anterior', () => {
  const song = song6();
  setRepeatPreviousTwo(song, 'm3');
  const result = replaceMeasures(song, ['m4'], copyMeasures(song, ['m1']));
  assert.equal(result.notes.length, 1);
  assert.equal('repeatPreviousTwo' in song.measures[2], false);
  assert.equal(song.measures[3].chordEvents[0].chordName, 'C');
  setRepeatPrevious(song, 'm2');
  replaceMeasures(song, ['m6'], copyMeasures(song, ['m2']));
  assert.deepEqual(song.measures[5].repeatPrevious, { sourceMeasureId: 'm5' });
  assert.deepEqual(song.measures[5].chordEvents, []);
  valid(song);
});

/* ---------- Tarjetas y voicings ---------- */

test('copiar una tarjeta y pegarla en otro compás crea una tarjeta independiente', () => {
  const song = clone(loadDemo());
  const payload = copyCard(song.measures[0], 'e1', 'v2');
  const created = pasteCard(song, 'm4', null, payload);
  assert.equal(song.measures[3].chordEvents.length, 1);
  assert.equal(created.event.chordName, song.measures[0].chordEvents[0].chordName);
  assert.deepEqual(created.voicing.frets, song.measures[0].chordEvents[0].voicings[1].frets);
  assert.equal(created.voicing.aboveText, 'Otra posición');
  assert.notEqual(created.voicing.id, 'v2');
  created.voicing.frets[0] = 9;
  assert.notEqual(song.measures[0].chordEvents[0].voicings[1].frets[0], 9, 'sin referencias compartidas');
  assert.deepEqual(findDuplicateIds(song), []);
  valid(song);
});

test('pegar una tarjeta después de una que comparte acorde separa solo lo necesario', () => {
  const song = clone(loadDemo());
  const payload = copyCard(song.measures[2], 'e4', 'v5');
  const created = pasteCard(song, 'm1', { eventId: 'e1', voicingId: 'v1' }, payload);
  assert.deepEqual(flatCards(song.measures[0]).map((c) => c.voicing.id), ['v1', created.voicing.id, 'v2']);
  valid(song);
});

test('sustituir la digitación cambia trastes, grados y traste de referencia, y nada más', () => {
  const song = clone(loadDemo());
  const event = song.measures[2].chordEvents[0];
  const target = event.voicings[0];
  const keep = { chordName: event.chordName, aboveText: target.aboveText, insideText: target.insideText, tonality: target.tonality };
  const source = { id: 'vx', frets: [8, 10, 8, 9, 8, 8], degrees: ['1', '5', 'b7', '3', '5', '1'], anchorFret: 8 };
  pasteFingering(song, event, target, source);
  assert.deepEqual(target.frets, source.frets);
  assert.deepEqual(target.degrees, source.degrees);
  assert.equal(target.anchorFret, 8);
  assert.notEqual(target.id, 'vx');
  assert.deepEqual({ chordName: event.chordName, aboveText: target.aboveText, insideText: target.insideText, tonality: target.tonality }, keep);
  pasteFingering(song, event, target, { frets: [null, 3, 2, 0, 1, 0] });
  assert.equal('degrees' in target, false, 'una digitación sin grados quita los anteriores');
  assert.equal('anchorFret' in target, false);
  const pending = { id: 'ep', chordName: 'G', voicings: [] };
  song.measures[3].chordEvents.push(pending);
  const filled = pasteFingering(song, pending, null, source);
  assert.deepEqual(pending.voicings, [filled]);
  valid(song);
});

test('mover una tarjeta dentro de un acorde reordena sus voicings; entre acordes, separa e intercambia', () => {
  const song = clone(loadDemo());
  const m1 = song.measures[0];
  assert.equal(canMoveCard(m1, 'e1', 'v1', -1), false);
  assert.deepEqual(moveCard(song, 'm1', 'e1', 'v1', 1), { eventId: 'e1', voicingId: 'v1' });
  assert.deepEqual(m1.chordEvents[0].voicings.map((v) => v.id), ['v2', 'v1']);
  const m2 = song.measures[1];
  const texts = flatCards(m2).map((c) => [c.event.chordName, c.voicing.id]);
  const moved = moveCard(song, 'm2', 'e2', 'v3', 1);
  assert.equal(moved.voicingId, 'v3');
  assert.deepEqual(flatCards(m2).map((c) => [c.event.chordName, c.voicing.id]), [texts[1], texts[0]]);
  assert.deepEqual(findDuplicateIds(song), []);
  valid(song);
});

/* ---------- JSON y selección múltiple con historial ---------- */

test('guardar y abrir conserva exactamente el resultado de las operaciones', () => {
  const song = clone(loadDemo());
  setRenumberMeasures(song, false);
  runStructural(song, ({ renumber }) => duplicateMeasures(song, ['m1', 'm2'], { renumber }));
  runStructural(song, () => moveMeasures(song, ['m4'], -1));
  runStructural(song, () => swapMeasures(song, ['m1', 'm3']));
  pasteCard(song, 'm4', null, copyCard(song.measures.find((m) => m.id === 'm1'), 'e1', 'v2'));
  const parsed = parseSongJson(serializeSong(song));
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.song, song);
  valid(parsed.song);
});

test('selección múltiple: orden escrito, sin IDs inexistentes y fuera de la canción y del historial', () => {
  const store = createStore(song6());
  store.toggleMarked('m4', { withActive: true });
  assert.deepEqual(store.state.marked, ['m1', 'm4']);
  assert.equal(store.state.selection.measureId, 'm4');
  store.markRange('m2');
  assert.deepEqual(store.state.marked, ['m2', 'm3', 'm4']);
  assert.deepEqual(targetMeasureIds(store.state), ['m2', 'm3', 'm4']);
  assert.equal(store.state.canUndo, false, 'seleccionar no crea pasos');

  const song = store.state.song;
  const result = runStructural(song, () => moveMeasures(song, store.state.marked, 1));
  store.commit('structure', null, { marked: result.ids });
  assert.deepEqual(order(store.state.song), ['m1', 'm5', 'm2', 'm3', 'm4', 'm6']);
  assert.equal(JSON.stringify(store.state.song).includes('marked'), false);
  store.undo();
  assert.deepEqual(order(store.state.song), ['m1', 'm2', 'm3', 'm4', 'm5', 'm6']);
  assert.deepEqual(labels(store.state.song), ['1', '2', '3', '4', '5', '6']);
  assert.deepEqual(store.state.marked, ['m2', 'm3', 'm4'], 'los IDs siguen existiendo');
  store.redo();
  assert.deepEqual(order(store.state.song), ['m1', 'm5', 'm2', 'm3', 'm4', 'm6']);
  assert.deepEqual(labels(store.state.song), ['1', '2', '3', '4', '5', '6'], 'etiquetas renumeradas en el mismo paso');

  const pasted = runStructural(store.state.song, () => pasteMeasures(store.state.song, copyMeasures(store.state.song, ['m1']), 0));
  store.commit('structure', { measureId: pasted.ids[0] }, { marked: pasted.ids });
  store.undo();
  assert.deepEqual(store.state.marked, [], 'lo pegado ya no existe tras deshacer');
  store.select({ measureId: 'm2' }, { clearMarked: true });
  assert.deepEqual(store.state.marked, []);
  store.replaceSong(createEmptySong());
  assert.equal(store.state.documentId, 1);
});
