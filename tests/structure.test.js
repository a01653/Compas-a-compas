import test from 'node:test';
import assert from 'node:assert/strict';
import { checkStructure, measureConsequences } from '../src/model/structure.js';
import { deleteMeasure, moveMeasure } from '../src/model/song.js';
import { clone, loadDemo } from './helpers.js';

test('borrar un compás no redirige nada y deja avisos', () => {
  const song = clone(loadDemo());
  const before = JSON.stringify(song.structure);
  const consequences = measureConsequences(song, 'm4');
  assert.ok(consequences.some((c) => c.includes('Coda')));
  assert.ok(consequences.some((c) => c.includes('Fine')));
  assert.ok(consequences.some((c) => /apunta a una marca de este compás/.test(c)));

  deleteMeasure(song, 'm4');
  assert.equal(JSON.stringify(song.structure), before, 'la estructura no se toca');
  const warnings = checkStructure(song);
  assert.ok(warnings.some((w) => w.objectId === 'coda1' && w.kind === 'missing'));
  assert.equal(song.structure.jumps[0].codaMarkerId, 'coda1');
});

test('borrar un compás sin marcas no tiene consecuencias', () => {
  assert.deepEqual(measureConsequences(loadDemo(), 'nuevo'), []);
});

test('mover un compás avisa de tramos invertidos nuevos', () => {
  const song = clone(loadDemo());
  assert.deepEqual(checkStructure(song), []);
  const result = moveMeasure(song, 'm1', 1); // m1 pasa tras m2: repetición m1→m2 queda invertida
  assert.equal(result.moved, true);
  assert.ok(result.inversions.some((w) => w.objectId === 'rep1'));
  assert.deepEqual(song.measures.map((m) => m.id), ['m2', 'm1', 'm3', 'm4']);
  assert.deepEqual(song.structure.repeats[0], loadDemo().structure.repeats[0], 'las asociaciones siguen por ID');
});

test('mover más allá de los extremos no hace nada', () => {
  const song = clone(loadDemo());
  assert.equal(moveMeasure(song, 'm1', -1).moved, false);
  assert.equal(moveMeasure(song, 'm4', 1).moved, false);
  assert.equal(moveMeasure(song, 'zz', 1).moved, false);
});

test('requisitos de saltos y casillas incompatibles', () => {
  const song = clone(loadDemo());
  song.structure.jumps.push({ id: 'j9', type: 'ds-al-fine', measureId: 'm3', edge: 'after' });
  song.structure.endings[0].passes = [1, 4];
  const messages = checkStructure(song).map((w) => w.message).join('\n');
  assert.match(messages, /D\.S\. al Fine: falta el destino Segno/);
  assert.match(messages, /D\.S\. al Fine: falta el destino Fine/);
  assert.match(messages, /supera las 3/);
});
