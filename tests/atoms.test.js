import test from 'node:test';
import assert from 'node:assert/strict';
import { buildUnits, fragmentFlags, groupAtoms } from '../src/layout/atoms.js';
import { projectMarks, fragmentMarks } from '../src/model/marksProjection.js';
import { loadDemo } from './helpers.js';

const voicing = (id) => ({ id, frets: [null, 3, 5, 3, 4, 3] });
const event = (id, voicings) => ({ id, chordName: id.toUpperCase(), voicings: voicings.map(voicing) });

function song() {
  return {
    measures: [
      { id: 'm1', label: '1', chordEvents: [event('ea', ['a1', 'a2', 'a3']), event('eb', ['b1']), event('ec', [])] },
      { id: 'm2', label: '2', chordEvents: [] },
      { id: 'm3', label: '3', chordEvents: [event('ed', ['d1', 'd2'])] },
    ],
    structure: { repeats: [], endings: [], markers: [], jumps: [] },
  };
}

test('una tarjeta por voicing y una pendiente por evento sin digitación, en el orden escrito', () => {
  const units = buildUnits(song());
  assert.deepEqual(units.map((u) => u.measureId), ['m1', 'm2', 'm3']);
  assert.deepEqual(units[0].atoms.map((a) => [a.eventId, a.voicingId]), [
    ['ea', 'a1'], ['ea', 'a2'], ['ea', 'a3'], ['eb', 'b1'], ['ec', null],
  ]);
  assert.deepEqual(units[1].atoms, [], 'compás vacío: sin tarjetas');
});

test('la canción de ejemplo conserva todas sus tarjetas y el orden de sus compases', () => {
  const demo = loadDemo();
  const units = buildUnits(demo);
  assert.deepEqual(units.map((u) => u.measureId), demo.measures.map((m) => m.id));
  demo.measures.forEach((m, i) => {
    const expected = m.chordEvents.reduce((sum, e) => sum + Math.max(1, e.voicings.length), 0);
    assert.equal(units[i].atoms.length, expected, `compás ${m.label}`);
  });
});

test('los voicings de un mismo acorde siguen agrupados; el corte se señala a ambos lados', () => {
  const [unit] = buildUnits(song());
  const first = groupAtoms(unit, 0, 2);
  assert.equal(first.length, 1);
  assert.deepEqual([first[0].cutBefore, first[0].cutAfter], [false, true]);
  const second = groupAtoms(unit, 2, 5);
  assert.deepEqual(second.map((g) => g.eventId), ['ea', 'eb', 'ec']);
  assert.deepEqual([second[0].cutBefore, second[0].cutAfter], [true, false]);
  assert.deepEqual([second[1].cutBefore, second[1].cutAfter], [false, false]);
  const whole = groupAtoms(unit, 0, 5);
  assert.deepEqual(whole.map((g) => g.atoms.length), [3, 1, 1], 'otro acorde es otro evento, no otro voicing');
});

test('primero y último fragmento', () => {
  const [unit] = buildUnits(song());
  assert.deepEqual(fragmentFlags(unit, 0, 5), { isFirst: true, isLast: true });
  assert.deepEqual(fragmentFlags(unit, 0, 2), { isFirst: true, isLast: false });
  assert.deepEqual(fragmentFlags(unit, 2, 4), { isFirst: false, isLast: false });
  assert.deepEqual(fragmentFlags(unit, 4, 5), { isFirst: false, isLast: true });
});

test('símbolos de borde solo en el primer y último fragmento de un compás partido; casillas y repeticiones continúan', () => {
  const s = song();
  s.structure.repeats.push({ id: 'r1', startMeasureId: 'm1', endMeasureId: 'm1', times: 2 });
  s.structure.endings.push({ id: 'c1', startMeasureId: 'm1', endMeasureId: 'm1', passes: [1] });
  s.structure.markers.push({ id: 'k1', type: 'segno', measureId: 'm1', edge: 'before' });
  s.structure.jumps.push({ id: 'j1', type: 'dc', measureId: 'm1', edge: 'after' });
  const marks = projectMarks(s).byMeasure.get('m1');
  const [unit] = buildUnits(s);
  const parts = [[0, 2], [2, 4], [4, 5]].map(([from, to]) => fragmentMarks(marks, fragmentFlags(unit, from, to)));

  assert.deepEqual(parts.map((p) => p.repeatStarts.length), [1, 0, 0], 'inicio de repetición solo en el primero');
  assert.deepEqual(parts.map((p) => p.repeatEnds.length), [0, 0, 1], 'fin de repetición solo en el último');
  assert.deepEqual(parts.map((p) => p.before.length), [1, 0, 0], 'marca «antes» solo en el primero');
  assert.deepEqual(parts.map((p) => p.after.length), [0, 0, 1], 'marca «después» solo en el último');
  assert.deepEqual(parts.map((p) => p.endings.length), [1, 1, 1], 'la casilla se identifica en los tres');
  assert.deepEqual(parts.map((p) => [p.endings[0].continuesBefore, p.endings[0].continuesAfter]), [[false, true], [true, true], [true, false]]);
  assert.deepEqual(parts.map((p) => [p.spans[0].continuesBefore, p.spans[0].continuesAfter]), [[false, true], [true, true], [true, false]]);
});
