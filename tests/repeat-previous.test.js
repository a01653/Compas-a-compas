import test from 'node:test';
import assert from 'node:assert/strict';
import { addCard } from '../src/model/cards.js';
import { buildUnits } from '../src/layout/atoms.js';
import { checkStructure, measureConsequences } from '../src/model/structure.js';
import { parseSongJson, serializeSong } from '../src/model/serialize.js';
import { validateSong } from '../src/model/validate.js';
import { createIdFactory } from '../src/model/ids.js';
import {
  addEvent, addMeasure, clearRepeatPrevious, createEmptySong, deleteMeasure, duplicateMeasure, fixRepeatPrevious,
  moveMeasure, setRepeatPrevious,
} from '../src/model/song.js';
import { clone, loadDemo } from './helpers.js';

function song3() {
  const song = createEmptySong();
  addMeasure(song); addMeasure(song);
  addCard(song, 'm1');
  return song;
}
const warnings = (song) => checkStructure(song).filter((w) => w.kind === 'repeat');

test('repetir: guarda solo el ID del predecesor inmediato y deja las tarjetas vacías', () => {
  const song = song3();
  assert.equal(setRepeatPrevious(song, 'm1'), false, 'el primer compás no tiene anterior');
  assert.equal('repeatPrevious' in song.measures[0], false);
  assert.equal(setRepeatPrevious(song, song.measures[1].id), true);
  const [first, second] = song.measures;
  assert.deepEqual(second.repeatPrevious, { sourceMeasureId: first.id });
  assert.deepEqual(second.chordEvents, []);
  assert.equal(first.chordEvents.length, 1, 'el origen no se copia ni se altera');
  assert.deepEqual(validateSong(song), { errors: [], warnings: [] });
  assert.equal(buildUnits(song)[1].repeatPrevious, true);
  assert.equal(buildUnits(song)[1].atoms.length, 0);
});

test('convertir un compás con tarjetas las sustituye y conserva marcas y etiqueta; quitar vuelve a un compás vacío', () => {
  const song = clone(loadDemo());
  const target = song.measures[2];
  const label = target.label;
  const structure = JSON.stringify(song.structure);
  assert.ok(target.chordEvents.length);
  setRepeatPrevious(song, target.id);
  assert.equal(target.label, label);
  assert.equal(JSON.stringify(song.structure), structure);
  assert.equal(clearRepeatPrevious(song, target.id), true);
  assert.equal('repeatPrevious' in target, false);
  assert.deepEqual(target.chordEvents, []);
  assert.equal(clearRepeatPrevious(song, target.id), false);
});

test('varios compases de repetición seguidos son válidos y cada uno apunta a su predecesor', () => {
  const song = song3();
  setRepeatPrevious(song, 'm2'); setRepeatPrevious(song, 'm3');
  assert.deepEqual(song.measures.map((m) => m.repeatPrevious?.sourceMeasureId), [undefined, 'm1', 'm2']);
  assert.deepEqual(warnings(song), []);
});

test('un archivo sin repeatPrevious se abre y se guarda sin añadir campos', () => {
  const text = serializeSong(loadDemo());
  const parsed = parseSongJson(text);
  assert.equal(parsed.ok, true);
  assert.equal(serializeSong(parsed.song), text);
  assert.doesNotMatch(text, /repeatPrevious/);
});

test('validación: repeatPrevious con tarjetas, campos extra o ID vacío se rechazan', () => {
  const song = song3();
  setRepeatPrevious(song, 'm2');
  const withCards = clone(song);
  addEvent(withCards, 'm2');
  assert.match(validateSong(withCards).errors[0].message, /incompatible con chordEvents/);
  for (const bad of [{}, { sourceMeasureId: '' }, { sourceMeasureId: 1 }, { sourceMeasureId: 'm1', extra: true }, 'm1', null]) {
    const copy = clone(song);
    copy.measures[1].repeatPrevious = bad;
    assert.ok(validateSong(copy).errors.length, JSON.stringify(bad));
  }
});

test('referencias rotas: inexistente, a sí mismo, no inmediata y ciclo avisan sin redirigir', () => {
  const missing = song3();
  setRepeatPrevious(missing, 'm2');
  deleteMeasure(missing, 'm1');
  assert.equal(missing.measures[0].repeatPrevious.sourceMeasureId, 'm1', 'la referencia se conserva');
  assert.match(warnings(missing)[0].message, /ya no existe/);
  assert.deepEqual(validateSong(missing).errors, [], 'se abre con aviso');

  const self = song3();
  self.measures[1].repeatPrevious = { sourceMeasureId: 'm2' };
  assert.match(warnings(self)[0].message, /sí mismo/);

  const far = song3();
  far.measures[2].repeatPrevious = { sourceMeasureId: 'm1' };
  assert.match(warnings(far)[0].message, /inmediatamente anterior/);

  const loop = song3();
  loop.measures[0].chordEvents = [];
  loop.measures[0].repeatPrevious = { sourceMeasureId: 'm2' };
  loop.measures[1].repeatPrevious = { sourceMeasureId: 'm1' };
  assert.ok(warnings(loop).some((w) => /ciclo/.test(w.message)));
  assert.equal(validateSong(loop).errors.length, 0);
});

test('mover el origen avisa, conserva la referencia y la acción expresa la corrige', () => {
  const song = song3();
  setRepeatPrevious(song, 'm2');
  const result = moveMeasure(song, 'm1', 1); // m2, m1: m2 pasa a ser el primero
  assert.equal(result.moved, true);
  assert.equal(result.repeats.length, 1);
  assert.deepEqual(song.measures[0].repeatPrevious, { sourceMeasureId: 'm1' });
  assert.equal(fixRepeatPrevious(song, 'm2'), false, 'el primer compás no tiene anterior que fijar');

  const other = song3();
  setRepeatPrevious(other, 'm3');
  moveMeasure(other, 'm2', -1); // m2, m1, m3: m3 sigue repitiendo m2, que ya no es su anterior
  assert.equal(warnings(other).length, 1);
  assert.deepEqual(other.measures[2].repeatPrevious, { sourceMeasureId: 'm2' });
  assert.equal(fixRepeatPrevious(other, 'm3'), true);
  assert.deepEqual(other.measures[2].repeatPrevious, { sourceMeasureId: 'm1' });
  assert.deepEqual(warnings(other), []);
});

test('borrar el origen lo anuncia en las consecuencias y no redirige', () => {
  const song = song3();
  setRepeatPrevious(song, 'm2');
  assert.ok(measureConsequences(song, 'm1').some((c) => /repite este compás/.test(c)));
  assert.deepEqual(measureConsequences(song, 'm3'), []);
});

test('duplicar un compás de repetición apunta, de forma explícita, al original que queda justo antes', () => {
  const song = song3();
  setRepeatPrevious(song, 'm2');
  const copy = duplicateMeasure(song, 'm2');
  assert.deepEqual(copy.repeatPrevious, { sourceMeasureId: 'm2' });
  assert.notEqual(copy.id, 'm2');
  assert.deepEqual(song.measures[1].repeatPrevious, { sourceMeasureId: 'm1' }, 'el original no cambia');
  assert.deepEqual(warnings(song), []);
  assert.deepEqual(validateSong(song), { errors: [], warnings: [] });
});

test('un ID de origen borrado no se reutiliza para un compás nuevo', () => {
  const song = song3();
  setRepeatPrevious(song, 'm2');
  deleteMeasure(song, 'm1');
  assert.notEqual(createIdFactory(song)('m'), 'm1');
});

test('tarjeta nueva sin nombre de prueba; un nombre vacío es válido y los existentes no se tocan', () => {
  const song = createEmptySong();
  const { event } = addCard(song, 'm1');
  assert.equal(event.chordName, '');
  assert.equal(addEvent(song, 'm1').chordName, '');
  assert.deepEqual(validateSong(song), { errors: [], warnings: [] });
  const legacy = clone(song);
  legacy.measures[0].chordEvents[0].chordName = 'Acorde nuevo';
  assert.equal(parseSongJson(serializeSong(legacy)).song.measures[0].chordEvents[0].chordName, 'Acorde nuevo');
});

import { readFileSync } from 'node:fs';
import { paginate } from '../src/layout/paginate.js';

test('esquema JSON: repeatPrevious, chordName vacío y texto por grado', () => {
  const schema = JSON.parse(readFileSync(new URL('../schemas/song.schema.json', import.meta.url), 'utf8'));
  assert.deepEqual(schema.$defs.repeatPrevious.required, ['sourceMeasureId']);
  assert.equal(schema.$defs.repeatPrevious.additionalProperties, false);
  assert.equal(schema.$defs.measure.properties.repeatPrevious.$ref, '#/$defs/repeatPrevious');
  assert.equal(schema.$defs.measure.allOf[0].then.properties.chordEvents.maxItems, 0);
  assert.deepEqual(schema.$defs.repeatPreviousTwo.required, ["sourceMeasureIds", "targetMeasureIds"]);
  assert.equal(schema.properties.maxMeasuresPerRow.minimum, 1);
  assert.equal(schema.$defs.chordEvent.properties.chordName.minLength, undefined);
  assert.ok(schema.$defs.palette.properties.degreeText && schema.$defs.palette.properties.noteText);
  assert.equal(schema.$defs.palette.additionalProperties, false);
});

test('reparto: el tamaño medido de cada columna llega a la fila para limitar su crecimiento', () => {
  const units = [0, 1].map((i) => ({ measureId: `m${i}`, label: String(i), atoms: [{}, {}] }));
  const plan = paginate({
    units, measureFragment: () => ({ width: 200, height: 100, columns: [90, 100] }), content: { width: 1000, height: 600 }, headerHeight: 40, columnGap: 6,
  });
  const [row] = plan.pages[0].rows;
  assert.deepEqual(row.fragments.flatMap((f) => f.columns), [90, 100, 90, 100]);
  assert.equal(row.width, 406);
});
