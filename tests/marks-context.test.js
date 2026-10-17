import test from 'node:test';
import assert from 'node:assert/strict';
import { marksForMeasure } from '../src/model/marksContext.js';

function song() {
  return { measures: ['a', 'b', 'c', 'd'].map(id => ({ id, label: id, chordEvents: [] })),
    structure: { repeats: [{ id: 'r', startMeasureId: 'a', endMeasureId: 'c', times: 2 }],
      endings: [{ id: 'e', startMeasureId: 'b', endMeasureId: 'c', passes: [1] }],
      markers: [{ id: 'coda', type: 'coda', measureId: 'd', edge: 'before' }],
      jumps: [{ id: 'jump', type: 'to-coda', measureId: 'b', edge: 'after', codaMarkerId: 'coda' }] } };
}
const ids = (s, id) => marksForMeasure(s, id).map(m => m.item.id).sort();
test('el contexto incluye extremos e interior de los tramos, y saltos donde están escritos', () => {
  const s = song();
  assert.deepEqual(ids(s, 'a'), ['r']);
  assert.deepEqual(ids(s, 'b'), ['e', 'jump', 'r']);
  assert.deepEqual(ids(s, 'c'), ['e', 'r']);
  assert.deepEqual(ids(s, 'd'), ['coda']);
});
test('reordenar consulta los IDs en el orden actual sin alterar las marcas', () => {
  const s = song(); const original = JSON.stringify(s.structure);
  s.measures = [s.measures[0], s.measures[3], s.measures[1], s.measures[2]];
  assert.deepEqual(ids(s, 'd'), ['coda', 'r']);
  assert.equal(JSON.stringify(s.structure), original);
});
test('extremos pendientes se conservan y siguen localizables desde el extremo existente', () => {
  const s = song(); const original = JSON.stringify(s.structure);
  s.measures = s.measures.filter(m => m.id !== 'a');
  assert.deepEqual(ids(s, 'b'), ['e', 'jump']);
  assert.deepEqual(ids(s, 'c'), ['e', 'r']);
  assert.equal(JSON.stringify(s.structure), original);
});
test('un contexto ausente o vacío no captura marcas de otro compás', () => {
  const s = song();
  assert.deepEqual(ids(s, 'no-existe'), []);
  s.measures = []; assert.deepEqual(ids(s, 'a'), []);
});
