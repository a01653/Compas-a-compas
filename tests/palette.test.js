import test from 'node:test';
import assert from 'node:assert/strict';
import { familyBackground, familyForeground, foreground, isColor, paletteDegreeColor, paletteFamilyStyle, setPaletteColor, resetPaletteColor } from '../src/model/palette.js';
import { degreeColor } from '../src/model/degrees.js';
import { familyStyle } from '../src/model/families.js';
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
