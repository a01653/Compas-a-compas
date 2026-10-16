import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addMark, updateMark, deleteMark, findMark, validateMark, markConsequences, listMarks, describeMark,
  formatPasses, measureOptions, markerOptions, withPending, jumpNeeds, JUMP_TYPES, defaultFields, fieldsFromMark,
} from '../src/model/marks.js';
import { checkStructure } from '../src/model/structure.js';
import { findDuplicateIds } from '../src/model/ids.js';

function song() {
  const m = (id, label, chords = []) => ({ id, label, chordEvents: chords.map((c, i) => ({ id: `${id}e${i}`, chordName: c, voicings: [] })) });
  return {
    measures: [m('a', '1', ['Cm7']), m('b', '2', ['F7', 'Bb']), m('c', '3'), m('d', '4')],
    structure: { repeats: [], endings: [], markers: [], jumps: [] },
  };
}
const add = (s, kind, fields) => {
  const r = validateMark(s, kind, fields);
  assert.equal(r.ok, true, r.errors.join(' '));
  return addMark(s, kind, r.value);
};

test('CRUD de repeticiones con IDs únicos y estables', () => {
  const s = song();
  const r1 = add(s, 'repeat', { startMeasureId: 'a', endMeasureId: 'b', times: '3' });
  const r2 = add(s, 'repeat', { startMeasureId: 'c', endMeasureId: 'c', times: 2 });
  assert.notEqual(r1.id, r2.id);
  assert.equal(r1.times, 3);
  assert.deepEqual(findDuplicateIds(s), []);

  const edited = validateMark(s, 'repeat', { startMeasureId: 'a', endMeasureId: 'c', times: '4' });
  updateMark(s, r1.id, edited.value);
  assert.deepEqual(s.structure.repeats[0], { id: r1.id, startMeasureId: 'a', endMeasureId: 'c', times: 4 });

  assert.equal(deleteMark(s, r1.id), true);
  assert.equal(deleteMark(s, r1.id), false);
  assert.deepEqual(s.structure.repeats.map((r) => r.id), [r2.id]);
  const r3 = add(s, 'repeat', { startMeasureId: 'a', endMeasureId: 'a', times: '2' });
  assert.notEqual(r3.id, r2.id, 'no reutiliza un ID vivo');
  assert.deepEqual(findDuplicateIds(s), []);
});

test('un ID de marca borrada con referencias pendientes no se reutiliza', () => {
  const s = song();
  const first = add(s, 'marker', { type: 'segno', measureId: 'a', edge: 'before' });
  add(s, 'jump', { type: 'ds', measureId: 'd', edge: 'after', segnoMarkerId: first.id });
  deleteMark(s, first.id);
  for (let i = 0; i < 6; i++) {
    const again = add(s, 'marker', { type: 'segno', measureId: 'b', edge: 'after' });
    assert.notEqual(again.id, first.id, 'el salto seguiría pendiente, no enlazado a la marca nueva');
    deleteMark(s, again.id);
  }
});

test('repeticiones: pasadas, enteros y tramo', () => {
  const s = song();
  const bad = (times) => validateMark(s, 'repeat', { startMeasureId: 'a', endMeasureId: 'b', times });
  for (const t of ['1', '', 'dos', '2.5', '-3', '0', '3x']) assert.equal(bad(t).ok, false, `times=${t}`);
  assert.equal(bad(' 5 ').ok, true);
  const inverted = validateMark(s, 'repeat', { startMeasureId: 'c', endMeasureId: 'a', times: 2 });
  assert.equal(inverted.ok, false);
  assert.match(inverted.errors.join(), /invertido/);
});

test('casillas: pasadas enteras, únicas y compatibles con su repetición', () => {
  const s = song();
  const rep = add(s, 'repeat', { startMeasureId: 'a', endMeasureId: 'd', times: 3 });
  const end = (passes, extra = {}) => validateMark(s, 'ending', { startMeasureId: 'b', endMeasureId: 'c', passes, ...extra });
  assert.equal(end([]).ok, false);
  assert.equal(end([1, 1]).ok, false);
  assert.equal(end([0]).ok, false);
  assert.equal(end([1.5]).ok, false);
  assert.equal(end(['x']).ok, false);
  assert.equal(end([1, 4], { repeatId: rep.id }).ok, false, 'supera las pasadas de la repetición');
  const ok = end([3, 1, 2], { repeatId: rep.id });
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.value.passes, [1, 2, 3], 'ordenadas');
  assert.equal(end([1, 7]).ok, true, 'sin repetición asociada no hay tope');
  assert.equal(end([1], { startMeasureId: 'c', endMeasureId: 'b' }).ok, false);
});

test('casillas: varias pasadas y rangos legibles', () => {
  assert.equal(formatPasses([1]), '1.');
  assert.equal(formatPasses([2, 1]), '1., 2.');
  assert.equal(formatPasses([1, 2, 3]), '1.–3.');
  assert.equal(formatPasses([1, 2, 3, 5]), '1.–3., 5.');
  assert.equal(formatPasses([1, 3]), '1., 3.');
});

test('marcadores: tipos cerrados y compás obligatorio', () => {
  const s = song();
  assert.equal(validateMark(s, 'marker', { type: 'dc', measureId: 'a', edge: 'before' }).ok, false);
  assert.equal(validateMark(s, 'marker', { type: 'segno', measureId: 'a', edge: 'middle' }).ok, false);
  assert.equal(validateMark(s, 'marker', { type: 'segno', measureId: '', edge: 'before' }).ok, false);
  for (const type of ['segno', 'coda', 'fine']) {
    const mk = add(s, 'marker', { type, measureId: 'b', edge: 'after' });
    assert.ok(mk.id.startsWith(type));
  }
  assert.equal(validateMark(s, 'nada', {}).ok, false);
});

test('los siete saltos exigen exactamente sus destinos', () => {
  assert.deepEqual(JUMP_TYPES, ['dc', 'ds', 'dc-al-coda', 'ds-al-coda', 'dc-al-fine', 'ds-al-fine', 'to-coda']);
  const needs = Object.fromEntries(JUMP_TYPES.map((t) => [t, jumpNeeds(t).map((n) => n.type)]));
  assert.deepEqual(needs, {
    dc: [], ds: ['segno'], 'dc-al-coda': ['coda'], 'ds-al-coda': ['segno', 'coda'],
    'dc-al-fine': ['fine'], 'ds-al-fine': ['segno', 'fine'], 'to-coda': ['coda'],
  });
  const s = song();
  const segno = add(s, 'marker', { type: 'segno', measureId: 'a', edge: 'before' });
  const coda = add(s, 'marker', { type: 'coda', measureId: 'c', edge: 'before' });
  const j = add(s, 'jump', { type: 'ds-al-coda', measureId: 'd', edge: 'after', segnoMarkerId: segno.id, codaMarkerId: coda.id, fineMarkerId: 'sobrante' });
  assert.equal(j.segnoMarkerId, segno.id);
  assert.equal(j.codaMarkerId, coda.id);
  assert.equal('fineMarkerId' in j, false, 'no se escribe un destino que el tipo no usa');
  assert.deepEqual(checkStructure(s), []);
  const dc = add(s, 'jump', { type: 'dc', measureId: 'd', edge: 'after' });
  assert.deepEqual(Object.keys(dc).sort(), ['edge', 'id', 'measureId', 'type']);
  assert.equal(validateMark(s, 'jump', { type: 'salta', measureId: 'd', edge: 'after' }).ok, false);
});

test('salto incompleto se guarda con aviso, sin elegir otro destino', () => {
  const s = song();
  const r = validateMark(s, 'jump', { type: 'ds', measureId: 'd', edge: 'after', segnoMarkerId: '' });
  assert.equal(r.ok, true);
  assert.match(r.warnings.join(), /Falta el destino Segno/);
  assert.equal('segnoMarkerId' in r.value, false);
});

test('destino ausente: opción pendiente al editar, nunca el primer destino', () => {
  const s = song();
  add(s, 'marker', { type: 'segno', measureId: 'a', edge: 'before' });
  const j = add(s, 'jump', { type: 'ds', measureId: 'd', edge: 'after', segnoMarkerId: s.structure.markers[0].id });
  s.structure.markers.length = 0; // el Segno desaparece
  add(s, 'marker', { type: 'segno', measureId: 'c', edge: 'before' }); // existe otro Segno distinto

  const fields = fieldsFromMark('jump', findMark(s, j.id).item);
  const options = withPending(markerOptions(s, 'segno'), fields.segnoMarkerId, 'pendiente');
  assert.equal(options.length, 2);
  assert.equal(options.find((o) => o.pending).value, j.segnoMarkerId);
  assert.notEqual(options[0].value, fields.segnoMarkerId);

  const r = validateMark(s, 'jump', fields);
  assert.equal(r.ok, true);
  assert.equal(r.value.segnoMarkerId, j.segnoMarkerId, 'se conserva el ID ausente');
  assert.match(r.warnings.join(), /pendiente/);
  updateMark(s, j.id, r.value);
  assert.equal(findMark(s, j.id).item.segnoMarkerId, j.segnoMarkerId);

  // lo mismo con compases ausentes
  const rep = add(s, 'repeat', { startMeasureId: 'a', endMeasureId: 'b', times: 2 });
  s.measures.splice(0, 1);
  const f = fieldsFromMark('repeat', findMark(s, rep.id).item);
  const opts = withPending(measureOptions(s), f.startMeasureId, 'pendiente');
  assert.equal(opts[opts.length - 1].value, 'a');
  const saved = validateMark(s, 'repeat', f);
  assert.equal(saved.ok, true);
  assert.equal(saved.value.startMeasureId, 'a');
  assert.equal(withPending(opts, 'a', 'x').length, opts.length, 'no duplica la pendiente');
  assert.equal(withPending(opts, '', 'x').length, opts.length);
});

test('formulario inválido no pierde ni cambia nada', () => {
  const s = song();
  const rep = add(s, 'repeat', { startMeasureId: 'a', endMeasureId: 'b', times: 3 });
  const before = JSON.stringify(s);
  const fields = { ...fieldsFromMark('repeat', rep), times: 'x', endMeasureId: 'a' };
  const r = validateMark(s, 'repeat', fields);
  assert.equal(r.ok, false);
  assert.equal(JSON.stringify(s), before, 'validar no muta la canción');
  assert.equal(fields.times, 'x', 'el borrador del usuario no se toca');
  assert.equal(updateMark(s, 'inexistente', r.value), null);
  assert.equal(JSON.stringify(s), before);
});

test('consecuencias de borrar: referencias pendientes, nunca redirección', () => {
  const s = song();
  const rep = add(s, 'repeat', { startMeasureId: 'a', endMeasureId: 'd', times: 2 });
  const end = add(s, 'ending', { startMeasureId: 'c', endMeasureId: 'd', passes: [1], repeatId: rep.id });
  const segno = add(s, 'marker', { type: 'segno', measureId: 'a', edge: 'before' });
  const other = add(s, 'marker', { type: 'segno', measureId: 'b', edge: 'before' });
  const j = add(s, 'jump', { type: 'ds', measureId: 'd', edge: 'after', segnoMarkerId: segno.id });

  assert.match(markConsequences(s, rep.id).join(), /casilla 1\./);
  assert.match(markConsequences(s, segno.id).join(), /D\.S\. usa este Segno/);
  assert.deepEqual(markConsequences(s, j.id), ['Ninguna otra marca depende de ésta.']);
  assert.deepEqual(markConsequences(s, 'no-existe'), []);

  deleteMark(s, segno.id);
  assert.equal(findMark(s, j.id).item.segnoMarkerId, segno.id, 'el salto conserva el destino ausente');
  assert.notEqual(findMark(s, j.id).item.segnoMarkerId, other.id);
  deleteMark(s, rep.id);
  assert.equal(findMark(s, end.id).item.repeatId, rep.id);
  const msgs = checkStructure(s).map((w) => w.message).join('\n');
  assert.match(msgs, /ya no existe/);
});

test('etiquetas legibles y lista de marcas', () => {
  const s = song();
  assert.equal(measureOptions(s)[1].label, 'Compás 2 (posición 2) · F7, Bb');
  assert.equal(measureOptions(s)[2].label, 'Compás 3 (posición 3)');
  const seg = add(s, 'marker', { type: 'segno', measureId: 'c', edge: 'before' });
  assert.equal(markerOptions(s, 'segno')[0].label, 'Segno antes del compás 3, posición 3');
  assert.deepEqual(markerOptions(s, 'coda'), []);
  add(s, 'ending', { startMeasureId: 'a', endMeasureId: 'b', passes: [1, 2] });
  const items = listMarks(s);
  assert.deepEqual(items.map((i) => i.kind), ['ending', 'marker']);
  assert.equal(items[0].title, 'Casilla 1., 2.');
  assert.equal(describeMark(s, 'marker', seg).detail, 'antes del compás 3');
  s.measures.splice(2, 1);
  assert.match(describeMark(s, 'marker', seg).detail, /compás desaparecido/);
});

test('valores iniciales del formulario', () => {
  const f = defaultFields('jump', 'b');
  assert.equal(f.type, 'dc');
  assert.equal(f.measureId, 'b');
  assert.equal(f.startMeasureId, 'b');
  assert.equal(defaultFields('marker').type, 'segno');
});
