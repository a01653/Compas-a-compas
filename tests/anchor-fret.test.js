import test from 'node:test';
import assert from 'node:assert/strict';
import { findUndrawableVoicings, layoutFretboard } from '../src/geometry/fretboard.js';
import { loadDemo } from './helpers.js';
import { setAnchorFret } from '../src/model/tonality.js';
import { parseSongJson, serializeSong } from '../src/model/serialize.js';
import { validateSong } from '../src/model/validate.js';

const firstVoicing = (song) => song.measures[0].chordEvents[0].voicings[0];

test('anchorFret se edita como entero positivo y vacío lo elimina', () => {
  const voicing = firstVoicing(loadDemo());
  assert.equal(setAnchorFret(voicing, '12'), true);
  assert.equal(voicing.anchorFret, 12);
  assert.equal(setAnchorFret(voicing, ''), true);
  assert.equal('anchorFret' in voicing, false);
  for (const invalid of ['0', '-1', '2.5', 'abc', '9007199254740992']) {
    assert.equal(setAnchorFret(voicing, invalid), false, invalid);
    assert.equal('anchorFret' in voicing, false, invalid);
  }
});

test('anchorFret valida, serializa y vuelve a abrirse en el JSON', () => {
  const song = loadDemo();
  firstVoicing(song).anchorFret = 12;
  assert.deepEqual(validateSong(song).errors, []);
  const reopened = parseSongJson(serializeSong(song));
  assert.equal(reopened.ok, true);
  assert.equal(firstVoicing(reopened.song).anchorFret, 12);
  for (const invalid of [0, -1, 1.5, '12', null]) {
    firstVoicing(song).anchorFret = invalid;
    assert.ok(validateSong(song).errors.some(error => error.path.endsWith('.anchorFret')), String(invalid));
  }
});

test('la digitación se amplía al traste de anclaje y conserva el límite dibujable', () => {
  const song = loadDemo();
  firstVoicing(song).anchorFret = 40;
  const result = findUndrawableVoicings(song);
  assert.equal(result.length, 1);
  assert.match(result[0].message, /trastes y no se puede dibujar/);
  const layout = layoutFretboard(firstVoicing(song).frets, firstVoicing(song).degrees, 40);
  assert.equal(layout.drawable, false);
  assert.equal(layout.anchor, null);
});
