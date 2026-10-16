import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDegrees, degreeColor, degreeDisplay, degreesFromInputs, degreesToInputs } from '../src/model/degrees.js';
import { describeTextMode, setEventDefault, textState } from '../src/model/song.js';
import { validateSong } from '../src/model/validate.js';
import { parseSongJson, serializeSong } from '../src/model/serialize.js';
import { clone, loadDemo } from './helpers.js';

test('seis campos → seis grados; vacío o solo espacios es null; nada se inventa', () => {
  assert.deepEqual(degreesFromInputs(['1', '', ' b3 ', '   ', '5', 'b7']), ['1', null, 'b3', null, '5', 'b7']);
  assert.equal(degreesFromInputs(['', '  ', '', '', '', '']), undefined);
  assert.equal(degreesFromInputs([]), undefined);
  assert.deepEqual(degreesFromInputs(['1']), ['1', null, null, null, null, null], 'se completa a seis con null');
  assert.equal(degreesFromInputs(['1', 2, null, undefined, {}, []])[1], null, 'valores que no son texto no cuentan');
});

test('grados guardados → campos de entrada', () => {
  assert.deepEqual(degreesToInputs(undefined), ['', '', '', '', '', '']);
  assert.deepEqual(degreesToInputs([null, '3', null, '5', null, '7']), ['', '3', '', '5', '', '7']);
  assert.deepEqual(degreesToInputs('no es lista'), ['', '', '', '', '', '']);
});

test('aplicar grados conserva frets, textos e IDs; vaciarlos elimina el campo', () => {
  const song = clone(loadDemo());
  const voicing = song.measures[0].chordEvents[0].voicings[1]; // v2, con aboveText e insideText propios
  const frets = [...voicing.frets];
  applyDegrees(voicing, ['1', '', '', '', '5', 'b7']);
  assert.deepEqual(voicing.degrees, ['1', null, null, null, '5', 'b7']);
  assert.deepEqual(voicing.frets, frets);
  assert.equal(voicing.aboveText, 'Otra posición');
  assert.equal(voicing.insideText, 'Posición 2');
  assert.equal(voicing.id, 'v2');
  assert.deepEqual(validateSong(song).errors, [], 'sigue cumpliendo el esquema');

  const other = song.measures[0].chordEvents[0].voicings[0];
  assert.equal('degrees' in other, false, 'las demás tarjetas no cambian');

  applyDegrees(voicing, ['', '', '', '', '', '']);
  assert.equal('degrees' in voicing, false);
});

test('los grados sobreviven a guardar y abrir', () => {
  const song = clone(loadDemo());
  applyDegrees(song.measures[2].chordEvents[0].voicings[0], ['1', '5', '1', '3', '5', '1']);
  const reopened = parseSongJson(serializeSong(song));
  assert.equal(reopened.ok, true);
  assert.deepEqual(reopened.song.measures[2].chordEvents[0].voicings[0].degrees, ['1', '5', '1', '3', '5', '1']);
});

test('colores definidos por la plantilla; ♭ y ♯ equivalen a b y #', () => {
  assert.equal(degreeColor('1').bg, '#E11D48');
  assert.equal(degreeColor('b3').bg, degreeColor('3').bg);
  assert.equal(degreeColor('♭3'), degreeColor('b3'));
  assert.equal(degreeColor('♯11'), degreeColor('#11'));
  assert.equal(degreeColor(' 5 '), degreeColor('5'));
  assert.equal(degreeColor('b7').fg, '#3d2f00');
  assert.equal(degreeColor('9').bg, '#7C3AED');
});

test('etiquetas sin color definido o inválidas no inventan color', () => {
  for (const label of ['Δ', 'Tónica', '', '  ', null, undefined, 7, 'constructor', '__proto__', 'toString']) {
    assert.equal(degreeColor(label), null, String(label));
  }
});

test('etiquetas largas: se abrevian al dibujar, el dato no cambia', () => {
  assert.deepEqual(degreeDisplay('1'), { text: '1', fontSize: 10.5, truncated: false });
  assert.deepEqual(degreeDisplay('b3'), { text: 'b3', fontSize: 10.5, truncated: false });
  assert.deepEqual(degreeDisplay('b13'), { text: 'b13', fontSize: 8.5, truncated: false });
  const long = degreeDisplay('Fundamental');
  assert.equal(long.truncated, true);
  assert.equal(long.text, 'Fu…');
  assert.ok([...long.text].length <= 3);

  const voicing = { id: 'v', frets: [null, 3, 5, 3, 4, 3] };
  applyDegrees(voicing, ['', 'Fundamental muy larga', '', '', '', '']);
  assert.equal(voicing.degrees[1], 'Fundamental muy larga');
  assert.equal(degreeDisplay('😀😀😀😀').text, '😀😀…', 'no corta pares sustitutos');
});

test('ayuda de herencia: refleja el valor actual del acorde', () => {
  const event = { id: 'e', chordName: 'Cm', aboveText: 'Intro', voicings: [] };
  const voicing = { id: 'v', frets: [null, 3, 5, 3, 4, 3] };
  const help = () => describeTextMode(textState(event, voicing, 'aboveText').mode, textState(event, voicing, 'aboveText').inherited);
  assert.match(help(), /«Intro»/);
  setEventDefault(event, 'aboveText', 'Puente');
  assert.match(help(), /«Puente»/, 'la ayuda se recalcula con el valor nuevo');
  setEventDefault(event, 'aboveText', '');
  assert.match(help(), /no define este texto/);
  assert.match(describeTextMode('hidden', ''), /oculto/);
  assert.match(describeTextMode('custom', 'x'), /equivale a ocultar/);
});
