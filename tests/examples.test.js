import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { exampleFileName, readCatalog } from '../src/model/examples.js';
import { createStarterSong } from '../src/model/song.js';
import { validateSong } from '../src/model/validate.js';

const dir = new URL('../examples/', import.meta.url);
const readJson = (file) => JSON.parse(readFileSync(new URL(file, dir), 'utf8'));
const catalogData = readJson('index.json');

/** Rutas relativas de todos los JSON de examples/, salvo el propio catálogo. */
function exampleFiles(sub = '') {
  return readdirSync(new URL(sub, dir), { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return exampleFiles(`${sub}${entry.name}/`);
    return entry.name.endsWith('.json') && `${sub}${entry.name}` !== 'index.json' ? [`${sub}${entry.name}`] : [];
  });
}

test('el catálogo enumera todos los ejemplos de la carpeta y todos son canciones válidas', () => {
  const result = readCatalog(catalogData);
  assert.equal(result.ok, true, result.error);
  assert.deepEqual(result.catalog.examples.map((e) => e.file).sort(), exampleFiles().sort());
  for (const { file } of result.catalog.examples) {
    assert.deepEqual(validateSong(readJson(file)).errors, [], file);
  }
  assert.equal(result.catalog.default, 'ii-v-i-mayor-do.json');
  assert.equal(result.catalog.examples[0].file, result.catalog.default);
});

test('readCatalog rechaza catálogos que no se pueden usar', () => {
  const entry = { file: 'a.json', title: 'A' };
  assert.equal(readCatalog(null).ok, false);
  assert.equal(readCatalog({ examples: [] }).ok, false);
  assert.equal(readCatalog({ examples: [{ file: '../a.json', title: 'A' }] }).ok, false);
  assert.equal(readCatalog({ examples: [{ file: 'a.txt', title: 'A' }] }).ok, false);
  assert.equal(readCatalog({ examples: [{ file: 'a.json', title: ' ' }] }).ok, false);
  assert.equal(readCatalog({ examples: [entry, entry] }).ok, false);
  assert.equal(readCatalog({ default: 'b.json', examples: [entry] }).ok, false);
  // Sin «default» se abre el primero.
  assert.equal(readCatalog({ examples: [entry, { file: 'sub/b.json', title: 'B' }] }).catalog.default, 'a.json');
  assert.equal(exampleFileName('ii-v-i/II-V-I_mayores_Drop2_Set1_Do.json'), 'II-V-I_mayores_Drop2_Set1_Do.json');
});

/* ---------- Ejemplo inicial: II–V–I mayor en Do, Drop 2 Set 1 ---------- */

const OPEN = [40, 45, 50, 55, 59, 64]; // sexta → primera
const ROOT = { Dm7: 2, G7: 7, Cmaj7: 0 };
const INTERVAL = { 1: 0, b3: 3, 3: 4, 5: 7, b7: 10, 7: 11 };
const INVERSION = { 1: 'Fundamental', b3: '1ª inversión', 3: '1ª inversión', 5: '2ª inversión', b7: '3ª inversión', 7: '3ª inversión' };

test('el ejemplo inicial es un II–V–I mayor en Do en cuatro compases, sin marcas', () => {
  const song = readJson('ii-v-i-mayor-do.json');
  assert.equal(song.title, 'Nombre del tema');
  assert.equal(song.key, 'Tonalidad');
  assert.deepEqual(song.measures.map((m) => m.chordEvents.map((e) => e.chordName)), [['Dm7', 'G7'], ['Cmaj7'], ['Dm7', 'G7'], ['Cmaj7']]);
  assert.deepEqual(song.measures.map((m) => m.label), ['1', '2', '3', '4']);
  for (const list of Object.values(song.structure)) assert.deepEqual(list, []);
  const families = { Dm7: 'minor', G7: 'dominant', Cmaj7: 'major' };
  for (const event of song.measures.flatMap((m) => m.chordEvents)) {
    assert.equal(event.family, families[event.chordName]);
    assert.equal(event.voicings.length, 1);
  }
});

test('cada tarjeta del ejemplo inicial es un Drop 2 en las cuerdas 4–1 con grados e inversión correctos', () => {
  const song = readJson('ii-v-i-mayor-do.json');
  for (const event of song.measures.flatMap((m) => m.chordEvents)) {
    const [voicing] = event.voicings;
    const where = `${event.chordName} (${voicing.id})`;
    // Set 1: sexta y quinta mudas; suenan las cuatro primeras cuerdas.
    assert.deepEqual(voicing.frets.slice(0, 2), [null, null], where);
    const pitches = voicing.frets.slice(2).map((fret, i) => OPEN[i + 2] + fret);
    const degrees = voicing.degrees.slice(2);
    degrees.forEach((degree, i) => {
      assert.equal((pitches[i] - ROOT[event.chordName] - INTERVAL[degree] + 120) % 12, 0, `${where}: cuerda ${4 - i} no es ${degree}`);
    });
    assert.deepEqual([...new Set(degrees.map((d) => INTERVAL[d]))].length, 4, `${where}: faltan grados`);
    // Drop 2: el bajo subido una octava vuelve a la posición cerrada como segunda voz desde arriba.
    const [low, a, b, top] = pitches;
    assert.ok(a < b && b < low + 12 && low + 12 < top && top - a < 12, `${where}: no es Drop 2`);
    assert.equal(voicing.insideText, `Drop 2 Set 1 · ${INVERSION[degrees[0]]}`, where);
  }
});

test('Nuevo crea una canción con título y tonalidad provisionales y una tarjeta vacía', () => {
  const song = createStarterSong();
  assert.deepEqual(validateSong(song).errors, []);
  assert.equal(song.title, 'Nombre del tema');
  assert.equal(song.key, 'Tonalidad');
  assert.equal(song.showTonalities, false);
  assert.equal(song.measures.length, 1);
  const [event] = song.measures[0].chordEvents;
  assert.equal(song.measures[0].chordEvents.length, 1);
  assert.equal(event.chordName, '');
  assert.deepEqual(event.voicings, [{ id: 'v1', frets: [null, null, null, null, null, null] }]);
  for (const list of Object.values(song.structure)) assert.deepEqual(list, []);
  // Cada llamada devuelve una canción independiente.
  createStarterSong().title = 'Otra';
  assert.equal(createStarterSong().title, 'Nombre del tema');
});
