import test from 'node:test';
import assert from 'node:assert/strict';
import { familyStyle, tonalityBandStyle, familyBackground, familyForeground, foreground, isColor, paletteDegreeColor, paletteFamilyStyle, setPaletteColor, resetPaletteColor } from '../src/model/palette.js';
import { degreeColor } from '../src/model/degrees.js';
import { validateSong } from '../src/model/validate.js';
import { parseSongJson, serializeSong } from '../src/model/serialize.js';
import { clone, loadDemo } from './helpers.js';

test('paleta opcional: los archivos anteriores permanecen válidos y sin cambios', () => {
  const song = loadDemo();const original = serializeSong(song);
  assert.equal(parseSongJson(original).ok,true);assert.equal('palette' in song,false);
  for(const family of ['major','minor','dominant','half-diminished','diminished','other'])assert.equal(paletteFamilyStyle(family),familyStyle(family));
  assert.equal(serializeSong(song),original);
});
test('colores por calidad y grado sobreviven a JSON sin alterar notas ni estructura', () => {
  const song=clone(loadDemo());const measures=structuredClone(song.measures);const structure=structuredClone(song.structure);
  setPaletteColor(song,'families','minor','#f0eedd');setPaletteColor(song,'degrees','♭3','#123456');setPaletteColor(song,'note','', '#554433');
  const result=parseSongJson(serializeSong(song));assert.equal(result.ok,true);
  assert.deepEqual(result.song.palette,{families:{minor:'#f0eedd'},degrees:{b3:'#123456'},note:'#554433'});
  assert.deepEqual(result.song.measures,measures);assert.deepEqual(result.song.structure,structure);
});
test('naturales, bemoles, sostenidos y dobles alteraciones de 1 a 13 tienen color', () => {
  for(let n=1;n<=13;n++)for(const prefix of ['', 'b','#','bb','##'])assert.ok(degreeColor(prefix+n),prefix+n);
  assert.equal(degreeColor('b7').bg,'#EDBC07');assert.equal(degreeColor('3').bg,'#0284C7');
});
test('personalizar b3 no modifica 3 ni otros grados de la misma paleta original', () => {
  const song=clone(loadDemo());setPaletteColor(song,'degrees','b3','#112233');
  assert.equal(degreeColor('♭3',song.palette).bg,'#112233');assert.equal(degreeColor('3',song.palette).bg,'#0284C7');
  setPaletteColor(song,'degrees','R','#44aa22');assert.equal(degreeColor('R',song.palette).bg,'#44aa22');
});
test('texto y rejilla con contraste automático sin colorear títulos exteriores', () => {
  assert.equal(foreground('#000000'),'#ffffff');assert.equal(foreground('#ffffff'),'#14183a');
  assert.equal(foreground('#777777'),'#000000');
  const palette={families:{minor:'#000000'}};
  assert.match(paletteFamilyStyle('minor',palette,true),/--ink-deep:#ffffff/);
  assert.doesNotMatch(paletteFamilyStyle('minor',palette),/--ink-/);
  assert.equal(familyBackground('minor',palette),'#000000');
  assert.equal(familyForeground(undefined,{families:{other:'#000000'}}),'#ffffff');
});
test('restaurar un color conserva el resto y elimina las secciones vacías', () => {
  const song=clone(loadDemo());setPaletteColor(song,'families','minor','#112233');setPaletteColor(song,'degrees','5','#445566');
  resetPaletteColor(song,'families','minor');assert.deepEqual(song.palette,{degrees:{'5':'#445566'}});
  resetPaletteColor(song,'degrees','5');assert.equal('palette' in song,false);
});
test('colores o propiedades inválidas bloquean la apertura del JSON', () => {
  for(const palette of [null,[],{other:1},{note:'red'},{note:'#123'},{note:'#123456\n'},{families:{alien:'#123456'}},{families:{minor:'url(x)'}},{degrees:{'5':'#fff; color:red'}},{degrees:{'': '#123456'}},{degrees:{['x'.repeat(33)]:'#123456'}}]){
    const song=clone(loadDemo());song.palette=palette;assert.ok(validateSong(song).errors.length,JSON.stringify(palette));
  }
  const song=clone(loadDemo());song.palette=JSON.parse('{"degrees":{"__proto__":"#112233"}}');assert.ok(validateSong(song).errors.length);
});
test('las API de paleta rechazan CSS arbitrario y claves reservadas', () => {
  const song=clone(loadDemo());
  for(const color of ['#123','red','#1234567','#123456\n',null,'#ffffff;--x:1'])assert.equal(isColor(color),false);
  assert.equal(setPaletteColor(song,'degrees','__proto__','#112233'),false);
  assert.equal(setPaletteColor(song,'families','constructor','#112233'),false);
  assert.equal(setPaletteColor(song,'degrees','1','red'),false);assert.equal('palette' in song,false);
  assert.equal(paletteDegreeColor('1',{degrees:{'1':'url(x)'}}).bg,'#E11D48');
  assert.equal(setPaletteColor(song,'degrees',null,'#112233'),false);
  assert.equal(setPaletteColor(song,'degrees','😀'.repeat(33),'#112233'),false);
  assert.equal(setPaletteColor(song,'degrees','😀'.repeat(32),'#112233'),true);
  assert.deepEqual(validateSong(song).errors,[]);
});

test('franjas tonales: calidad independiente, paleta y contraste sobre fondo tenue', () => {
  const song = clone(loadDemo());
  const original = serializeSong(song);
  function luminance(hex) {
    const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return c[0] * .2126 + c[1] * .7152 + c[2] * .0722;
  }
  for (const color of ['#ffffff', '#ffff00', '#eeeeee', '#000000', '#ff0000', '#00ff00', '#111111']) {
    const style = tonalityBandStyle('minor', { families: { minor: color } });
    const vars = Object.fromEntries(style.split(';').map(x => x.split(':')));
    assert.equal(vars['--tonal-color'], color);
    assert.ok((luminance(vars['--tonal-bg']) + .05) / (luminance(vars['--tonal-ink']) + .05) >= 4.5);
  }
  assert.notEqual(tonalityBandStyle('minor'), tonalityBandStyle('major'));
  assert.equal(tonalityBandStyle('constructor'), tonalityBandStyle('other'));
  assert.doesNotMatch(tonalityBandStyle('minor', { families: { minor: 'url(x)' } }), /url/);
  assert.equal(serializeSong(song), original);
});

import { defaultNoteColor, inkColor, neutralNote } from '../src/model/palette.js';

test('texto por grado: independiente del fondo, blanco por defecto y sin sustituir la elección del usuario', () => {
  const song = clone(loadDemo());
  setPaletteColor(song, 'degrees', 'b3', '#14183a');
  assert.deepEqual(paletteDegreeColor('♭3', song.palette), { bg: '#14183a', fg: '#ffffff' });
  setPaletteColor(song, 'degreeText', '♭3', '#000000');
  assert.equal(paletteDegreeColor('b3', song.palette).fg, '#000000');
  assert.deepEqual(paletteDegreeColor('3', song.palette), { bg: '#0284C7', fg: '#ffffff' });
  assert.deepEqual(paletteDegreeColor('#3', song.palette), { bg: '#0284C7', fg: '#ffffff' });
  setPaletteColor(song, 'degreeText', '1', '#001122');
  assert.deepEqual(paletteDegreeColor('1', song.palette), { bg: '#E11D48', fg: '#001122' });
  setPaletteColor(song, 'degreeText', 'R', '#123456');
  assert.deepEqual(paletteDegreeColor('R', song.palette), { bg: defaultNoteColor(), fg: '#123456' });
  setPaletteColor(song, 'degrees', 'bb7', '#445566');
  assert.deepEqual(paletteDegreeColor('bb7', song.palette), { bg: '#445566', fg: '#ffffff' });
  assert.deepEqual(paletteDegreeColor('##4', song.palette), paletteDegreeColor('##4', {}));
  for (const label of ['1', 'b3', '3', '5', 'b5', '9', '11', '#9', '#11']) assert.equal(paletteDegreeColor(label, {}).fg, '#ffffff', label);
  for (const label of ['b7', '7', '13', 'b13', '6']) assert.deepEqual(paletteDegreeColor(label, {}), { bg: '#EDBC07', fg: '#3d2f00' }, label);
  assert.deepEqual(paletteDegreeColor('b7', { degrees: { b7: '#112233' } }), { bg: '#112233', fg: '#ffffff' }, 'fondo propio: texto blanco');
  assert.deepEqual(paletteDegreeColor('b7', { degreeText: { b7: '#000000' } }), { bg: '#EDBC07', fg: '#000000' }, 'texto propio respetado');
});

test('fondo neutro: gris claro de serie, #14183a explícito se respeta y la tinta no cambia', () => {
  assert.equal(defaultNoteColor(), '#d1d5db');
  assert.equal(inkColor(), '#14183a');
  assert.deepEqual(neutralNote(undefined), { bg: '#d1d5db', fg: '#14183a' });
  assert.deepEqual(neutralNote({ degrees: {} }), { bg: '#d1d5db', fg: '#14183a' });
  assert.deepEqual(neutralNote({ note: '#14183a' }), { bg: '#14183a', fg: '#ffffff' });
  assert.deepEqual(neutralNote({ note: '#14183a', noteText: '#ffcc00' }), { bg: '#14183a', fg: '#ffcc00' });
  assert.equal(foreground('#eeeeee'), '#14183a');
});

test('texto por grado: guardado, restauración y validación', () => {
  const song = clone(loadDemo());
  setPaletteColor(song, 'degreeText', 'b3', '#112233');
  setPaletteColor(song, 'noteText', '', '#445566');
  const parsed = parseSongJson(serializeSong(song));
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.song.palette, { degreeText: { b3: '#112233' }, noteText: '#445566' });
  resetPaletteColor(song, 'degreeText', 'b3');
  resetPaletteColor(song, 'noteText', '');
  assert.equal('palette' in song, false);
  for (const palette of [{ degreeText: { '5': 'red' } }, { degreeText: { '': '#112233' } }, { noteText: '#12' }, { degreeText: [] }]) {
    const bad = clone(loadDemo()); bad.palette = palette;
    assert.ok(validateSong(bad).errors.length, JSON.stringify(palette));
  }
  const proto = clone(loadDemo()); proto.palette = JSON.parse('{"degreeText":{"__proto__":"#112233"}}');
  assert.ok(validateSong(proto).errors.length);
  assert.equal(setPaletteColor(song, 'degreeText', 'constructor', '#112233'), false);
  assert.equal(setPaletteColor(song, 'degreeText', '1', 'url(x)'), false);
});
