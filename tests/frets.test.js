import test from 'node:test';
import assert from 'node:assert/strict';
import { formatFrets, parseFrets } from '../src/model/frets.js';
import { parseList } from '../src/model/listImport.js';

test('entradas válidas: compacta, con separadores y de dos cifras', () => {
  assert.deepEqual(parseFrets('x35343').frets, [null, 3, 5, 3, 4, 3]);
  assert.deepEqual(parseFrets('X35343').frets, [null, 3, 5, 3, 4, 3]);
  assert.deepEqual(parseFrets('0 2 2 4 0 0').frets, [0, 2, 2, 4, 0, 0]);
  assert.deepEqual(parseFrets('x,10,12,10,11,10').frets, [null, 10, 12, 10, 11, 10]);
  assert.deepEqual(parseFrets('  x 10 12\t10  11 10 ').frets, [null, 10, 12, 10, 11, 10]);
  assert.deepEqual(parseFrets('x;10;12;10;11;10').frets, [null, 10, 12, 10, 11, 10]);
});

test('letras para trastes de dos cifras: a = 10 … o = 24, también con separadores', () => {
  assert.deepEqual(parseFrets('xa9axa').frets, [null, 10, 9, 10, null, 10]);
  assert.deepEqual(parseFrets('XA9AXA').frets, [null, 10, 9, 10, null, 10]);
  assert.deepEqual(parseFrets('xacaba').frets, [null, 10, 12, 10, 11, 10]);
  assert.deepEqual(parseFrets('x a 9 a x a').frets, [null, 10, 9, 10, null, 10]);
  assert.deepEqual(parseFrets('ooxx00').frets, [24, 24, null, null, 0, 0]);
  assert.equal(formatFrets(parseFrets('xa9axa').frets), 'x 10 9 10 x 10');
  for (const text of ['xp9axa', 'x a 9 a x z', 'xa9ax?', 'x 10 9 aa x 10']) {
    assert.match(parseFrets(text).error, /no es válido/, text);
  }
  assert.match(parseFrets('x1012101110').error, /letras/);
  const { measures, errors } = parseList('1 | G7 @ xa9axa / 3 2 3 4 x x');
  assert.deepEqual(errors, []);
  assert.deepEqual(measures[0].events[0].voicings, [[null, 10, 9, 10, null, 10], [3, 2, 3, 4, null, null]]);
});

test('x nunca se convierte en 0 y 0 nunca en muda', () => {
  const { frets } = parseFrets('x0x0x0');
  assert.deepEqual(frets, [null, 0, null, 0, null, 0]);
  assert.equal(formatFrets(frets), 'x 0 x 0 x 0');
});

test('decimales: se rechazan (la coma es separador, no decimal)', () => {
  for (const text of ['1.5 2 3 4 5 6', '3.0 3 3 3 3 3', '1 2 3 4 5 6.', '0.5 0 0 0 0 0', '.5 1 1 1 1 1']) {
    const result = parseFrets(text);
    assert.ok(result.error, text);
    assert.equal(result.frets, undefined, text);
  }
  assert.ok(parseFrets('1.2.3.4.5.6').error, 'el punto no es separador');
});

test('negativos y signos: rechazados', () => {
  for (const text of ['-1 2 3 4 5 6', '1 2 3 4 5 -6', '+3 1 1 1 1 1', '1-2-3-4-5-6', 'x-3-5-3-4-3']) {
    assert.ok(parseFrets(text).error, text);
  }
});

test('valores fuera de formato: más de dos cifras, letras, notación científica', () => {
  for (const text of ['100 2 3 4 5 6', '1 2 3 4 5 y', '1e2 1 1 1 1 1', 'NaN 1 1 1 1 1', 'Infinity 1 1 1 1 1', '٣ ٣ ٣ ٣ ٣ ٣', 'x x x x x ?']) {
    assert.ok(parseFrets(text).error, text);
  }
});

test('número incorrecto de cuerdas: mensaje con el recuento', () => {
  assert.match(parseFrets('x 3 5 3 4').error, /hay 5/);
  assert.match(parseFrets('x 3 5 3 4 3 3').error, /hay 7/);
  assert.match(parseFrets('x354').error, /hay 4/);
  assert.ok(parseFrets('').error);
  assert.ok(parseFrets('   ').error);
});

test('más de seis caracteres seguidos son ambiguos y piden separadores', () => {
  assert.match(parseFrets('x1012101110').error, /ambiguos/);
  assert.match(parseFrets('0000000').error, /ambiguos/);
});

test('una entrada inválida no devuelve nada que pueda aplicarse', () => {
  const bad = parseFrets('x 3 5 3 4 99999');
  assert.ok(bad.error);
  assert.equal('frets' in bad, false);
});

test('la lista rechaza línea con decimales o negativos señalando su número', () => {
  const { errors, measures } = parseList('1 | C @ x 3 2 0 1 0\n2 | D @ x x 0 2 3.5 2\n3 | E @ 0 2 2 1 0 -1');
  assert.deepEqual(errors.map((e) => e.lineNo), [2, 3]);
  assert.equal(measures.length, 1);
});
