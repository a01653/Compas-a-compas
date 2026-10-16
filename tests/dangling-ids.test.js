import test from 'node:test';
import assert from 'node:assert/strict';
import { addMeasure, deleteMeasure } from '../src/model/song.js';
import { checkStructure } from '../src/model/structure.js';

test('marcas con IDs pendientes tras eliminar compás', () => {
  const song = {
    schemaVersion: 1,
    title: '',
    key: '',
    measures: [{ id: 'm2', label: '1', chordEvents: [] }],
    structure: {
      repeats: [],
      endings: [],
      markers: [{ id: 'seg1', type: 'segno', measureId: 'm2', edge: 'before' }],
      jumps: []
    }
  };

  deleteMeasure(song, 'm2');
  assert.ok(checkStructure(song).length, 'checkStructure debe mostrar errores tras eliminar compás referenciado');

  const added = addMeasure(song);
  assert.notEqual(added.id, 'm2', 'ID nuevo debe diferir de m2');
  assert.equal(song.structure.markers[0].measureId, 'm2', 'marker.measureId no cambia al añadir medida nueva');
  assert.ok(checkStructure(song).length, 'checkStructure sigue mostrando errores (ID pendiente)');
});
