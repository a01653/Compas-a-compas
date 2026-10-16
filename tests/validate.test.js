import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSong } from '../src/model/validate.js';
import { parseSongJson, serializeSong, suggestFileName } from '../src/model/serialize.js';
import { clone, loadDemo } from './helpers.js';

test('el ejemplo del repositorio es válido y sin avisos', () => {
  const { errors, warnings } = validateSong(loadDemo());
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
});

test('guardar y abrir conserva datos, IDs, orden y estructura', () => {
  const demo = loadDemo();
  const result = parseSongJson(serializeSong(demo));
  assert.equal(result.ok, true);
  assert.deepEqual(result.song, demo);
  assert.deepEqual(result.song.measures.map((m) => m.id), ['m1', 'm2', 'm3', 'm4']);
  assert.deepEqual(result.song.structure, demo.structure);
});

test('versión de esquema desconocida: error legible', () => {
  const data = clone(loadDemo());
  data.schemaVersion = 2;
  const { errors } = validateSong(data);
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /no soportada/);
  const missing = clone(loadDemo());
  delete missing.schemaVersion;
  assert.match(validateSong(missing).errors[0].message, /falta schemaVersion/);
});

test('campos no permitidos no se descartan en silencio: bloquean', () => {
  const data = clone(loadDemo());
  data.extra = true;
  data.measures[0].chordEvents[0].voicings[0].color = 'rojo';
  const paths = validateSong(data).errors.map((e) => e.path);
  assert.ok(paths.includes('extra'));
  assert.ok(paths.includes('measures[0].chordEvents[0].voicings[0].color'));
});

test('digitación con menos o más de 6 cuerdas, o con valores inválidos', () => {
  for (const frets of [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4, 5, -1], [1, 2, 3, 4, 5, 1.5], [1, 2, 3, 4, 5, 'x']]) {
    const data = clone(loadDemo());
    data.measures[0].chordEvents[0].voicings[0].frets = frets;
    assert.ok(validateSong(data).errors.length > 0, JSON.stringify(frets));
  }
});

test('tipos incorrectos y campos obligatorios', () => {
  const data = clone(loadDemo());
  data.title = 3;
  delete data.structure;
  data.measures[1].chordEvents[0].chordName = '';
  data.measures[2].label = '';
  const paths = validateSong(data).errors.map((e) => e.path);
  assert.ok(paths.includes('title'));
  assert.ok(paths.includes('structure'));
  assert.ok(paths.includes('measures[1].chordEvents[0].chordName'));
  assert.ok(paths.includes('measures[2].label'));
});

test('IDs duplicados en cualquier parte del documento bloquean la apertura', () => {
  const data = clone(loadDemo());
  data.measures[1].chordEvents[0].voicings[0].id = 'm1';
  const { errors } = validateSong(data);
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /«m1» está repetido/);
});

test('referencias musicales incompletas abren con avisos y se conservan', () => {
  const data = clone(loadDemo());
  data.measures.splice(3, 1); // desaparece m4, que aloja Coda y Fine
  data.structure.jumps[1].segnoMarkerId = 'no-existe';
  const result = parseSongJson(serializeSong(data));
  assert.equal(result.ok, true);
  assert.ok(result.warnings.length >= 3);
  assert.deepEqual(result.song.structure, data.structure);
  assert.ok(result.warnings.some((w) => w.objectId === 'coda1' || w.objectId === 'jump1'));
});

test('estructura con forma inválida bloquea la apertura', () => {
  const data = clone(loadDemo());
  data.structure.repeats[0].times = 1;
  data.structure.endings[0].passes = [1, 1];
  data.structure.jumps[0].type = 'otro';
  const paths = validateSong(data).errors.map((e) => e.path);
  assert.ok(paths.includes('structure.repeats[0].times'));
  assert.ok(paths.includes('structure.endings[0].passes'));
  assert.ok(paths.includes('structure.jumps[0].type'));
});

test('JSON corrupto: error legible, sin excepción', () => {
  const result = parseSongJson('{ no es json');
  assert.equal(result.ok, false);
  assert.match(result.errors[0].message, /no es un JSON válido/);
  assert.equal(parseSongJson('[]').ok, false);
  assert.equal(parseSongJson('null').ok, false);
});

test('nombre de archivo sugerido', () => {
  assert.equal(suggestFileName({ title: 'Canción de Prueba ¡Ñandú!' }), 'cancion-de-prueba-nandu.json');
  assert.equal(suggestFileName({ title: '' }), 'cancion.json');
});
