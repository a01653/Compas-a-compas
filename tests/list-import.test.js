import test from 'node:test';
import assert from 'node:assert/strict';
import { parseList } from '../src/model/listImport.js';
import { parseFrets, formatFrets } from '../src/model/frets.js';
import { appendParsedMeasures, createEmptySong } from '../src/model/song.js';
import { validateSong } from '../src/model/validate.js';

const EXAMPLE = `1 | Cm7 @ x 3 5 3 4 3 / 8 10 8 8 8 8
2 | F7 @ 1 3 1 2 1 1 ; Bbmaj7 @ x 1 3 2 3 1
3 |`;

test('lista de ejemplo de DATOS.md: compases, acordes y voicings alternativos', () => {
  const { measures, errors } = parseList(EXAMPLE);
  assert.deepEqual(errors, []);
  assert.equal(measures.length, 3);
  assert.deepEqual(measures[0].events[0].voicings, [[null, 3, 5, 3, 4, 3], [8, 10, 8, 8, 8, 8]]);
  assert.equal(measures[1].events.length, 2);
  assert.equal(measures[1].events[1].chordName, 'Bbmaj7');
  assert.deepEqual(measures[2].events, []);
});

test('el bajo con barra (C/E) no se confunde con un separador de voicings', () => {
  const { measures, errors } = parseList('1 | C/E @ 0 3 2 0 1 0 ; G/B @ x 2 0 0 3 3 / x 2 0 0 0 3');
  assert.deepEqual(errors, []);
  assert.equal(measures[0].events[0].chordName, 'C/E');
  assert.equal(measures[0].events[0].voicings.length, 1);
  assert.equal(measures[0].events[1].chordName, 'G/B');
  assert.equal(measures[0].events[1].voicings.length, 2);
});

test('trastes de dos cifras con separadores y compacto de seis caracteres', () => {
  const { measures, errors } = parseList('1 | A @ x 10 12 10 11 10\n2 | B @ x35343');
  assert.deepEqual(errors, []);
  assert.deepEqual(measures[0].events[0].voicings[0], [null, 10, 12, 10, 11, 10]);
  assert.deepEqual(measures[1].events[0].voicings[0], [null, 3, 5, 3, 4, 3]);
});

test('acorde sin digitación queda pendiente', () => {
  const { measures, errors } = parseList('1 | Dm');
  assert.deepEqual(errors, []);
  assert.deepEqual(measures[0].events, [{ chordName: 'Dm', voicings: [] }]);
});

test('errores por línea con número y motivo; las líneas válidas no se importan solas', () => {
  const text = [
    '1 | Cm7 @ x 3 5 3 4 3',
    'sin barra',
    ' | Am @ 0 0 2 2 1 0',
    '4 | F7 @ 1 3 1 2 1',
    '5 | Em @ 022000x1',
    '6 | G @ ',
    '7 | ; D @ x x 0 2 3 2',
    '8 | Bm @ 2 2 4 4 3 2 / 1 2',
  ].join('\n');
  const { measures, errors } = parseList(text);
  const lines = new Set(errors.map((e) => e.lineNo));
  assert.deepEqual([...lines].sort((a, b) => a - b), [2, 3, 4, 5, 6, 7, 8]);
  assert.ok(errors.every((e) => e.message.length > 0));
  assert.equal(measures.length, 1, 'solo la línea válida se analiza; quien aplica rechaza todo si hay errores');
  assert.ok(errors.length > 0);
});

test('líneas en blanco se ignoran y la numeración de errores respeta la línea real', () => {
  const { errors } = parseList('1 | C @ x 3 2 0 1 0\n\n\n2 | G @ 3 2 0');
  assert.equal(errors.length, 1);
  assert.equal(errors[0].lineNo, 4);
});

test('aplicar una lista válida añade compases con IDs únicos y canción válida', () => {
  const song = createEmptySong();
  const { measures } = parseList(EXAMPLE);
  const created = appendParsedMeasures(song, measures);
  assert.equal(created.length, 3);
  assert.equal(song.measures.length, 4);
  assert.deepEqual(song.measures.slice(1).map((m) => m.label), ['1', '2', '3']);
  assert.equal(song.measures[1].chordEvents[0].voicings.length, 2);
  assert.deepEqual(validateSong(song).errors, []);
});

test('parseFrets: x es muda, 0 es al aire, entrada ambigua no se interpreta', () => {
  assert.deepEqual(parseFrets('x02X10').frets, [null, 0, 2, null, 1, 0]);
  assert.deepEqual(parseFrets('x 10 12 10 11 10').frets, [null, 10, 12, 10, 11, 10]);
  assert.ok(parseFrets('x1012101110').error, 'más de seis caracteres sin separadores');
  assert.ok(parseFrets('x 3 5').error);
  assert.ok(parseFrets('x 3 5 3 4 y').error);
  assert.ok(parseFrets('').error);
  assert.equal(formatFrets([null, 0, 12, 3, 4, 5]), 'x 0 12 3 4 5');
});
