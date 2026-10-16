import test from 'node:test';
import assert from 'node:assert/strict';
import { projectMarks, fragmentMarks, hasMarks } from '../src/model/marksProjection.js';

function song(structure = {}) {
  return {
    measures: ['a', 'b', 'c', 'd', 'e'].map((id, i) => ({ id, label: String(i + 1), chordEvents: [] })),
    structure: { repeats: [], endings: [], markers: [], jumps: [], ...structure },
  };
}

test('repetición: barras en los extremos, continuidad en el medio y compases sin expandir', () => {
  const s = song({ repeats: [{ id: 'r', startMeasureId: 'b', endMeasureId: 'd', times: 3 }] });
  const { byMeasure, undrawn } = projectMarks(s);
  assert.deepEqual(undrawn, []);
  assert.equal(byMeasure.size, 5, 'un resultado por compás escrito');
  assert.deepEqual(byMeasure.get('a').spans, []);
  assert.deepEqual(byMeasure.get('b').repeatStarts, [{ id: 'r', times: 3 }]);
  assert.deepEqual(byMeasure.get('b').repeatEnds, []);
  assert.deepEqual(byMeasure.get('c').repeatStarts, []);
  assert.deepEqual(byMeasure.get('c').spans[0], { id: 'r', times: 3, continuesBefore: true, continuesAfter: true });
  assert.deepEqual(byMeasure.get('d').repeatEnds, [{ id: 'r', times: 3 }]);
  assert.equal(byMeasure.get('e').spans.length, 0);
  assert.equal(s.measures.length, 5, 'la proyección no duplica ni expande compases');
});

test('casilla de varias pasadas: abre y cierra en sus extremos y continúa entre medias', () => {
  const s = song({ endings: [{ id: 'e1', startMeasureId: 'b', endMeasureId: 'd', passes: [1, 2, 3] }] });
  const { byMeasure } = projectMarks(s);
  const get = (id) => fragmentMarks(byMeasure.get(id)).endings[0];
  assert.equal(get('b').label, '1.–3.');
  assert.deepEqual([get('b').continuesBefore, get('b').continuesAfter], [false, true]);
  assert.deepEqual([get('c').continuesBefore, get('c').continuesAfter], [true, true]);
  assert.deepEqual([get('d').continuesBefore, get('d').continuesAfter], [true, false]);
  assert.equal(fragmentMarks(byMeasure.get('a')).endings.length, 0);
});

test('varias casillas y marcas sobre el mismo compás se conservan todas', () => {
  const s = song({
    endings: [
      { id: 'e1', startMeasureId: 'c', endMeasureId: 'c', passes: [1] },
      { id: 'e2', startMeasureId: 'c', endMeasureId: 'd', passes: [2, 3] },
    ],
    markers: [
      { id: 'k1', type: 'segno', measureId: 'c', edge: 'before' },
      { id: 'k2', type: 'coda', measureId: 'c', edge: 'before' },
      { id: 'k3', type: 'fine', measureId: 'c', edge: 'after' },
    ],
    jumps: [{ id: 'j1', type: 'ds-al-coda', measureId: 'c', edge: 'after', segnoMarkerId: 'k1', codaMarkerId: 'k2' }],
  });
  const f = fragmentMarks(projectMarks(s).byMeasure.get('c'));
  assert.deepEqual(f.endings.map((e) => e.id), ['e1', 'e2']);
  assert.deepEqual(f.before.map((m) => m.type), ['segno', 'coda']);
  assert.deepEqual(f.after.map((m) => m.text), ['Fine', 'D.S. al Coda']);
  assert.equal(hasMarks(f), true);
  assert.equal(hasMarks(fragmentMarks(projectMarks(s).byMeasure.get('a'))), false);
});

test('los siete saltos y los tres marcadores tienen texto propio', () => {
  const types = ['dc', 'ds', 'dc-al-coda', 'ds-al-coda', 'dc-al-fine', 'ds-al-fine', 'to-coda'];
  const s = song({
    markers: ['segno', 'coda', 'fine'].map((type, i) => ({ id: `k${i}`, type, measureId: 'a', edge: 'before' })),
    jumps: types.map((type, i) => ({ id: `j${i}`, type, measureId: 'e', edge: 'after' })),
  });
  const { byMeasure } = projectMarks(s);
  assert.deepEqual(byMeasure.get('a').before.map((m) => m.text), ['Segno', 'Coda', 'Fine']);
  assert.deepEqual(byMeasure.get('e').after.map((m) => m.text), ['D.C.', 'D.S.', 'D.C. al Coda', 'D.S. al Coda', 'D.C. al Fine', 'D.S. al Fine', 'To Coda']);
});

test('fragmentos de un compás partido: los signos de borde solo van en el borde correcto', () => {
  const s = song({
    repeats: [{ id: 'r', startMeasureId: 'c', endMeasureId: 'c', times: 2 }],
    endings: [{ id: 'e1', startMeasureId: 'c', endMeasureId: 'c', passes: [1] }],
    markers: [{ id: 'k', type: 'segno', measureId: 'c', edge: 'before' }, { id: 'k2', type: 'coda', measureId: 'c', edge: 'after' }],
  });
  const marks = projectMarks(s).byMeasure.get('c');

  const first = fragmentMarks(marks, { isFirst: true, isLast: false });
  assert.equal(first.repeatStarts.length, 1);
  assert.equal(first.repeatEnds.length, 0, 'el final de repetición no se dibuja a mitad de compás');
  assert.deepEqual(first.before.map((m) => m.type), ['segno']);
  assert.equal(first.after.length, 0);
  assert.deepEqual([first.endings[0].continuesBefore, first.endings[0].continuesAfter], [false, true]);
  assert.equal(first.spans[0].continuesAfter, true);

  const middle = fragmentMarks(marks, { isFirst: false, isLast: false });
  assert.equal(middle.repeatStarts.length + middle.repeatEnds.length + middle.before.length + middle.after.length, 0);
  assert.deepEqual([middle.endings[0].continuesBefore, middle.endings[0].continuesAfter], [true, true]);
  assert.equal(hasMarks(middle), true, 'la continuidad sigue visible');

  const last = fragmentMarks(marks, { isFirst: false, isLast: true });
  assert.equal(last.repeatStarts.length, 0, 'el inicio de repetición no se repite en el último fragmento');
  assert.equal(last.repeatEnds.length, 1);
  assert.equal(last.before.length, 0);
  assert.deepEqual(last.after.map((m) => m.type), ['coda']);
  assert.deepEqual([last.endings[0].continuesBefore, last.endings[0].continuesAfter], [true, false]);

  const whole = fragmentMarks(marks);
  assert.deepEqual([whole.repeatStarts.length, whole.repeatEnds.length], [1, 1]);
  assert.deepEqual([whole.endings[0].continuesBefore, whole.endings[0].continuesAfter], [false, false]);
  assert.deepEqual(marks.before.map((m) => m.type), ['segno'], 'fragmentMarks no modifica la proyección');
});

test('tramos con compases ausentes o invertidos no se dibujan pero se listan', () => {
  const s = song({
    repeats: [{ id: 'r1', startMeasureId: 'd', endMeasureId: 'b', times: 2 }, { id: 'r2', startMeasureId: 'zz', endMeasureId: 'b', times: 2 }],
    endings: [{ id: 'e1', startMeasureId: 'a', endMeasureId: 'gone', passes: [1] }],
    markers: [{ id: 'k', type: 'coda', measureId: 'gone', edge: 'after' }],
  });
  const { byMeasure, undrawn } = projectMarks(s);
  assert.deepEqual(undrawn.map((u) => u.id).sort(), ['e1', 'k', 'r1', 'r2']);
  for (const m of byMeasure.values()) assert.equal(hasMarks(fragmentMarks(m)), false);
  assert.equal(hasMarks(fragmentMarks(undefined)), false);
});

test('mover un compás cambia la proyección sin cambiar los IDs de la estructura', () => {
  const s = song({ repeats: [{ id: 'r', startMeasureId: 'a', endMeasureId: 'b', times: 2 }] });
  s.measures.splice(2, 0, s.measures.shift()); // a pasa a la posición 3: el tramo queda invertido
  assert.equal(projectMarks(s).undrawn[0].id, 'r');
  assert.deepEqual(s.structure.repeats[0], { id: 'r', startMeasureId: 'a', endMeasureId: 'b', times: 2 });
});
