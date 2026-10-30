import { h, s } from './dom.js';

/** Segno y Coda dibujados como SVG propio: no dependen de glifos Unicode musicales ni de ninguna fuente. */
function segnoSvg() {
  return s('svg', { class: 'glifo', viewBox: '0 0 28 34', width: 22, height: 27, role: 'img', 'aria-label': 'Segno' },
    s('path', { d: 'M19 6.5C19 3.5 16.5 2 14 2C10.5 2 8.5 4.2 8.5 6.8C8.5 10.2 11.5 11.5 14 13C16.8 14.7 19.5 16.3 19.5 20C19.5 23 17 25 13.8 25C10.6 25 8.5 23.2 8.5 20.3', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
    s('path', { d: 'M24 3L4 31', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', fill: 'none' }),
    s('circle', { cx: 5, cy: 11, r: 2, fill: 'currentColor' }),
    s('circle', { cx: 23, cy: 20, r: 2, fill: 'currentColor' }));
}

function codaSvg() {
  return s('svg', { class: 'glifo', viewBox: '0 0 30 34', width: 24, height: 27, role: 'img', 'aria-label': 'Coda' },
    s('circle', { cx: 15, cy: 17, r: 8, fill: 'none', stroke: 'currentColor', 'stroke-width': 2.2 }),
    s('path', { d: 'M15 2V32M2 17H28', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', fill: 'none' }));
}

function markItem(mark) {
  const glyph = mark.type === 'segno' ? segnoSvg() : mark.type === 'coda' || mark.type === 'to-coda' ? codaSvg() : null;
  if (mark.kind === 'marker') {
    if (glyph) return h('span', { class: `m-marca m-${mark.type}`, title: mark.text }, glyph);
    return h('span', { class: 'm-marca m-fine' }, mark.text);
  }
  return h('span', { class: 'm-marca m-salto' }, mark.text, mark.type === 'to-coda' ? codaSvg() : null);
}

/** Casilla: línea superior con tope solo donde empieza; abierta a los lados si continúa en otra fila o fragmento. */
function endingNode(e) {
  const cls = ['casilla', e.continuesBefore ? 'cont-ant' : 'abre', e.continuesAfter ? 'cont-sig' : 'cierra'].join(' ');
  return h('div', { class: cls, 'data-ending-id': e.id },
    h('span', { class: 'casilla-txt' }, e.continuesBefore ? `cont. ${e.label}` : e.label));
}

function repeatBar(side) {
  return h('span', { class: `barra-rep ${side}`, 'aria-hidden': 'true' }, h('i', { class: 'punto a' }), h('i', { class: 'punto b' }));
}

/**
 * Elementos de marcas de un fragmento de compás (ver fragmentMarks):
 * { classes, barStart, barEnd: barras de repetición (o null), times: ×N de la barra de fin (o null), strip: bloque superior en flujo o null }.
 * Las barras las coloca quien dibuja las tarjetas, dentro de la zona del compás (de la línea del número hacia abajo).
 * El bloque superior ocupa espacio propio y apila varias marcas sin superponerlas.
 */
export function marksParts(f) {
  const classes = [];
  let barStart = null;
  let barEnd = null;
  if (f.repeatStarts.length) { classes.push('rep-ini'); barStart = repeatBar('ini'); }
  if (f.repeatEnds.length) { classes.push('rep-fin'); barEnd = repeatBar('fin'); }

  const rows = [];
  for (const e of f.endings) rows.push(endingNode(e));

  const left = f.before.map(markItem);
  const right = f.after.map(markItem);
  if (left.length || right.length) rows.push(h('div', { class: 'marcas-fila' }, h('div', { class: 'marcas-izq' }, left), h('div', { class: 'marcas-der' }, right)));

  // Como en una partitura, la repetición solo lleva sus barras y el ×N encima de la barra de fin (ver .rep-veces en sheet.css);
  // los compases intermedios no repiten la indicación.
  const times = f.repeatEnds.length
    ? h('div', { class: 'rep-veces' }, f.repeatEnds.map((r) => h('span', { class: 'm-veces', title: `Repetición: ${r.times} pasadas en total` }, `×${r.times}`)))
    : null;

  return { classes, barStart, barEnd, times, strip: rows.length ? h('div', { class: 'marcas' }, rows) : null };
}
