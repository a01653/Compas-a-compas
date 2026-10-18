import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/store.js';
import { addEvent, addMeasure, addVoicing, duplicateVoicing, moveMeasure, removeVoicing } from '../src/model/song.js';
import {
  deriveTonalityContext, describeTonality, setKeyFamily, setShowTonalities, setTonality, setTonalityFamily,
  setVoicingDegree, tonalitiesVisible,
} from '../src/model/tonality.js';
import { FAMILY_KEYS, validateSong } from '../src/model/validate.js';
import { TONALITY_FAMILIES } from '../src/model/tonality.js';import { parseSongJson, serializeSong } from '../src/model/serialize.js';
import { songSample } from '../src/layout/fonts.js';
import { clone, loadDemo } from './helpers.js';

/** Canción con tres compases y una posición por acorde: ids v1..v4 en orden escrito. */
function build(key = 'Do mayor') {
  const song = loadDemo();
  song.key = key;
  song.measures = [];
  song.structure = { repeats: [], endings: [], markers: [], jumps: [] };
  for (const name of ['m1', 'm2', 'm3']) {
    const measure = addMeasure(song);
    measure.id = name;
  }
  const make = (measure, id) => {
    const event = addEvent(song, measure, 'C');
    const voicing = addVoicing(song, event);
    return { event, voicing: Object.assign(voicing, { id }) };
  };
  const a = make('m1', 'v1');
  const b = make('m1', 'v2');
  const c = make('m2', 'v3');
  const d = make('m3', 'v4');
  return { song, v: { v1: a.voicing, v2: b.voicing, v3: c.voicing, v4: d.voicing }, events: [a.event, b.event, c.event, d.event] };
}
const ctx = song => deriveTonalityContext(song);

test('las seis calidades coinciden con las familias del validador', () => {
  assert.deepEqual(TONALITY_FAMILIES, FAMILY_KEYS);
});

test('sin cambios locales todas heredan la tonalidad general; solo la primera imprime etiqueta', () => {
  const { song } = build('Do mayor');
  const map = ctx(song);
  assert.deepEqual([...map.keys()], ['v1', 'v2', 'v3', 'v4']);
  assert.deepEqual(map.get('v1'), { text: 'Do mayor', family: 'other', explicit: false, show: true, source: 'key' });
  for (const id of ['v2', 'v3', 'v4']) {
    assert.equal(map.get(id).text, 'Do mayor');
    assert.equal(map.get(id).explicit, false);
    assert.equal(map.get(id).show, false);
  }
});

test('la calidad general sale de keyFamily y por defecto es «other»; no se infiere del texto', () => {
  const { song } = build('La menor');
  assert.equal(ctx(song).get('v1').family, 'other');
  setKeyFamily(song, 'minor');
  assert.equal(song.keyFamily, 'minor');
  assert.equal(ctx(song).get('v3').family, 'minor');
  setKeyFamily(song, 'other');
  assert.equal('keyFamily' in song, false);
});

test('un cambio explícito se hereda en el orden escrito, cruzando acordes y compases', () => {
  const { song, v } = build();
  setTonality(v.v2, 'Sol mayor', 'major');
  const map = ctx(song);
  assert.equal(map.get('v1').text, 'Do mayor');
  assert.deepEqual(map.get('v2'), { text: 'Sol mayor', family: 'major', explicit: true, show: true, source: 'v2' });
  for (const id of ['v3', 'v4']) {
    assert.deepEqual(map.get(id), { text: 'Sol mayor', family: 'major', explicit: false, show: false, source: 'v2' });
  }
  assert.match(describeTonality(map.get('v3')), /Hereda «Sol mayor» de una tarjeta anterior/);
  assert.match(describeTonality(map.get('v1')), /de la tonalidad general/);
  assert.match(describeTonality(map.get('v2')), /Esta tarjeta cambia la tonalidad a «Sol mayor»/);
});

test('vacío borra la tonalidad propia y la posición vuelve a heredar sin etiqueta nueva', () => {
  const { song, v } = build();
  setTonality(v.v2, 'Sol mayor', 'major');
  setTonality(v.v2, '   ', 'major');
  assert.equal('tonality' in v.v2, false);
  assert.equal(ctx(song).get('v2').explicit, false);
  assert.equal(ctx(song).get('v2').show, false);
  assert.equal(ctx(song).get('v4').text, 'Do mayor');
});

test('sin tonalidad general no se inventa contexto hasta el primer cambio', () => {
  const { song, v } = build('  ');
  assert.equal(ctx(song).get('v1'), null);
  assert.equal(describeTonality(ctx(song).get('v1')), 'Sin tonalidad: no hay tonalidad general ni cambios anteriores.');
  setTonality(v.v3, 'Fa mayor', 'major');
  const map = ctx(song);
  assert.equal(map.get('v1'), null);
  assert.equal(map.get('v2'), null);
  assert.equal(map.get('v3').show, true);
  assert.equal(map.get('v4').text, 'Fa mayor');
  assert.equal(map.get('v4').show, false);
});

test('si la primera posición cambia, imprime su cambio y no repite la tonalidad general', () => {
  const { song, v } = build();
  setTonality(v.v1, 'Re menor', 'minor');
  const map = ctx(song);
  assert.equal(map.get('v1').text, 'Re menor');
  assert.equal(map.get('v1').show, true);
  assert.equal(map.get('v2').show, false);
});

test('reordenar compases cambia lo heredado; borrar la posición que fija el contexto lo devuelve al anterior', () => {
  const { song, v, events } = build();
  setTonality(v.v3, 'Sol mayor', 'major'); // compás m2
  assert.equal(ctx(song).get('v4').text, 'Sol mayor');
  moveMeasure(song, 'm2', -1); // m2 pasa a ser el primero
  const map = ctx(song);
  assert.deepEqual([...map.keys()], ['v3', 'v1', 'v2', 'v4']);
  assert.equal(map.get('v1').text, 'Sol mayor');
  assert.equal(map.get('v1').explicit, false);
  removeVoicing(events[2], 'v3');
  assert.equal(ctx(song).get('v1').text, 'Do mayor');
});

test('duplicar una posición conserva su grado y su tonalidad propia (es una copia fiel)', () => {
  const { song, v, events } = build();
  setTonality(v.v2, 'Sol mayor', 'major');
  setVoicingDegree(v.v2, 'V7');
  const copy = duplicateVoicing(song, events[1], 'v2');
  assert.deepEqual(copy.tonality, { text: 'Sol mayor', family: 'major' });
  assert.equal(copy.voicingDegree, 'V7');
  copy.tonality.text = 'otra';
  assert.equal(v.v2.tonality.text, 'Sol mayor', 'la copia no comparte objetos con el original');
  assert.deepEqual(validateSong(song).errors, []);
});

test('la calidad de la tonalidad es independiente de la familia del acorde', () => {
  const { song, v, events } = build();
  events[1].family = 'dominant';
  setTonality(v.v2, 'Sol mayor', 'minor');
  assert.equal(ctx(song).get('v2').family, 'minor');
  events[1].family = 'diminished';
  assert.equal(ctx(song).get('v2').family, 'minor');
  assert.equal(setTonalityFamily(v.v2, 'minor'), false);
  assert.equal(setTonalityFamily(v.v2, 'major'), true);
  assert.equal(events[1].family, 'diminished');
  assert.equal(setTonalityFamily(v.v1, 'major'), false, 'sin tonalidad propia no hay nada que guardar');
  assert.equal('tonality' in v.v1, false);
});

test('el grado del voicing se recorta y vacío lo borra', () => {
  const { v } = build();
  setVoicingDegree(v.v1, '  ii7 ');
  assert.equal(v.v1.voicingDegree, 'ii7');
  setVoicingDegree(v.v1, '');
  assert.equal('voicingDegree' in v.v1, false);
});

test('mostrar tonalidades: visible por defecto, solo se guarda el valor oculto', () => {
  const { song } = build();
  assert.equal(tonalitiesVisible(song), true);
  setShowTonalities(song, false);
  assert.equal(song.showTonalities, false);
  assert.equal(tonalitiesVisible(song), false);
  setShowTonalities(song, true);
  assert.equal('showTonalities' in song, false);
});

test('un JSON anterior se abre y se guarda sin campos nuevos', () => {
  const demo = loadDemo();
  const result = parseSongJson(serializeSong(demo));
  assert.equal(result.ok, true);
  assert.equal(JSON.stringify(result.song), JSON.stringify(demo));
  ctx(result.song);
  assert.equal(JSON.stringify(result.song), JSON.stringify(demo), 'derivar el contexto no muta la canción');
  assert.equal(JSON.stringify(demo).includes('tonality'), false);
});

test('JSON con tonalidades hace ida y vuelta exacta y valida', () => {
  const { song, v } = build();
  setKeyFamily(song, 'major');
  setShowTonalities(song, false);
  setTonality(v.v2, 'Sol mayor', 'dominant');
  setVoicingDegree(v.v2, 'V');
  const result = parseSongJson(serializeSong(song));
  assert.equal(result.ok, true);
  assert.deepEqual(result.song, song);
  assert.equal(result.song.measures[0].chordEvents[1].voicings[0].tonality.family, 'dominant');
});

test('el validador rechaza campos, tipos y calidades desconocidos', () => {
  const bad = (mutate, path) => {
    const { song } = build();
    mutate(song);
    const paths = validateSong(song).errors.map(e => e.path);
    assert.ok(paths.includes(path), `${path} en ${JSON.stringify(paths)}`);
  };
  const voicing = song => song.measures[0].chordEvents[0].voicings[0];
  const base = 'measures[0].chordEvents[0].voicings[0]';
  bad(song => { song.keyFamily = 'mayor'; }, 'keyFamily');
  bad(song => { song.showTonalities = 'si'; }, 'showTonalities');
  bad(song => { song.showTonalities = 0; }, 'showTonalities');
  bad(song => { voicing(song).voicingDegree = 5; }, `${base}.voicingDegree`);
  bad(song => { voicing(song).voicingDegree = ''; }, `${base}.voicingDegree`);
  bad(song => { voicing(song).voicingDegree = '  '; }, `${base}.voicingDegree`);
  bad(song => { voicing(song).tonality = 'Do'; }, `${base}.tonality`);
  bad(song => { voicing(song).tonality = { text: 'Do' }; }, `${base}.tonality.family`);
  bad(song => { voicing(song).tonality = { family: 'major' }; }, `${base}.tonality.text`);
  bad(song => { voicing(song).tonality = { text: '', family: 'major' }; }, `${base}.tonality.text`);
  bad(song => { voicing(song).tonality = { text: 'Do', family: 'lidio' }; }, `${base}.tonality.family`);
  bad(song => { voicing(song).tonality = { text: 'Do', family: 'major', color: '#fff' }; }, `${base}.tonality.color`);
  bad(song => { voicing(song).tonality = null; }, `${base}.tonality`);
});

test('el esquema JSON declara los mismos campos nuevos que el validador', async () => {
  const { readFileSync } = await import('node:fs');
  const schema = JSON.parse(readFileSync(new URL('../schemas/song.schema.json', import.meta.url), 'utf8'));
  assert.deepEqual(schema.properties.keyFamily, { $ref: '#/$defs/family' });
  assert.deepEqual(schema.properties.showTonalities, { type: 'boolean' });
  assert.deepEqual(schema.properties.fretboardScalePercent, { type: 'integer', minimum: 60, maximum: 100, description: 'Escala uniforme de los mástiles en las tarjetas. Ausente o 100 = tamaño normal.' });
  assert.deepEqual(schema.$defs.family.enum, FAMILY_KEYS);
  assert.deepEqual(schema.$defs.tonality.required, ['text', 'family']);
  assert.equal(schema.$defs.tonality.additionalProperties, false);
  assert.deepEqual(Object.keys(schema.$defs.voicing.properties).filter(k => ['voicingDegree', 'tonality'].includes(k)), ['voicingDegree', 'tonality']);
  assert.equal(schema.$defs.voicing.additionalProperties, false);
});

/* ---------- Historial real ---------- */

test('escribir una tonalidad es un paso agrupado y deshacer refresca el contexto heredado', () => {
  const { song, v } = build();
  const store = createStore(song);
  const original = JSON.stringify(store.state.song);
  store.beginEdit();
  for (const text of ['S', 'So', 'Sol']) { setTonality(store.state.song.measures[0].chordEvents[1].voicings[0], text, 'major'); store.emit('text'); }
  store.endEdit();
  assert.equal(ctx(store.state.song).get('v4').text, 'Sol');
  assert.equal(store.undo(), true);
  assert.equal(JSON.stringify(store.state.song), original);
  assert.equal(ctx(store.state.song).get('v4').text, 'Do mayor');
  assert.equal(store.state.canUndo, false);
  assert.equal(store.redo(), true);
  assert.equal(store.state.song.measures[0].chordEvents[1].voicings[0].tonality.text, 'Sol');
  assert.ok(v.v1);
});

test('borrar la tonalidad escrita y cambiar calidad o grado son pasos propios', () => {
  const { song } = build();
  const store = createStore(song);
  const voicing = () => store.state.song.measures[0].chordEvents[0].voicings[0];
  store.beginEdit(); setTonality(voicing(), 'Sol', 'major'); store.emit('text'); store.endEdit();
  store.endEdit(); setTonalityFamily(voicing(), 'minor'); store.emit('text');
  store.beginEdit(); setVoicingDegree(voicing(), 'IV'); store.emit('text'); store.endEdit();
  store.beginEdit(); setTonality(voicing(), '', 'minor'); store.emit('text'); store.endEdit();
  assert.equal('tonality' in voicing(), false);
  store.undo(); assert.equal('tonality' in voicing(), true);
  store.undo(); assert.equal('voicingDegree' in voicing(), false);
  store.undo(); assert.equal(voicing().tonality.family, 'major');
  store.undo(); assert.equal('tonality' in voicing(), false);
  assert.equal(store.state.canUndo, false);
});

test('la casilla y la calidad general son pasos independientes de la escritura de la tonalidad general', () => {
  const { song } = build();
  const store = createStore(song);
  const original = JSON.stringify(store.state.song);
  store.beginEdit(); store.state.song.key = 'Re mayor'; store.emit('text'); store.emit('text');
  // La casilla llega con el campo aún en edición: endEdit separa el paso, como hace el panel.
  store.endEdit(); setShowTonalities(store.state.song, false); store.emit('text');
  store.endEdit(); setKeyFamily(store.state.song, 'major'); store.emit('text');
  assert.equal(store.state.song.showTonalities, false);
  assert.equal(store.state.song.keyFamily, 'major');
  store.undo(); assert.equal('keyFamily' in store.state.song, false);
  assert.equal(store.state.song.showTonalities, false);
  store.undo(); assert.equal('showTonalities' in store.state.song, false);
  assert.equal(store.state.song.key, 'Re mayor');
  store.undo(); assert.equal(JSON.stringify(store.state.song), original);
  store.redo(); store.redo(); store.redo();
  assert.equal(store.state.song.keyFamily, 'major');
  assert.equal(store.state.song.showTonalities, false);
  assert.deepEqual(validateSong(store.state.song).errors, []);
});

test('la muestra de fuentes incluye grados y tonalidades de las posiciones', () => {
  const { song, v } = build();
  setVoicingDegree(v.v1, 'ϟ♭VII');
  setTonality(v.v2, 'Σol', 'major');
  const sample = songSample(song);
  for (const char of 'ϟ♭ΣV') assert.ok(sample.includes(char), char);
});

test('el historial restaura una copia: los campos nuevos viajan en el documento', () => {
  const { song, v } = build();
  setTonality(v.v1, 'Sol', 'major');
  setVoicingDegree(v.v1, 'I');
  const store = createStore(clone(song));
  store.state.song.title = 'x'; store.emit('text'); store.undo();
  const restored = store.state.song.measures[0].chordEvents[0].voicings[0];
  assert.deepEqual(restored.tonality, { text: 'Sol', family: 'major' });
  assert.equal(restored.voicingDegree, 'I');
});
