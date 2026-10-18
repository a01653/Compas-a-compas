import { h, s } from './dom.js';

export const REPEAT_LABEL = 'Repite el compás anterior';

/**
 * Signo musical de repetición de un compás (barra oblicua con un punto a cada lado). SVG propio, sin fuentes ni recursos remotos;
 * dibuja con el color de tinta del texto de la hoja.
 */
export function repeatSymbol() {
  const svg = s('svg', {
    class: 'repite-signo', viewBox: '0 0 64 64', width: 64, height: 64, role: 'img', 'aria-label': REPEAT_LABEL, focusable: 'false',
  },
  s('title', null, REPEAT_LABEL),
  s('path', { d: 'M40 8 L50 8 L24 56 L14 56 Z', fill: 'currentColor' }),
  s('circle', { cx: 14, cy: 20, r: 6.5, fill: 'currentColor' }),
  s('circle', { cx: 50, cy: 44, r: 6.5, fill: 'currentColor' }));
  return h('div', { class: 'compas-repite' }, svg);
}

export const REPEAT_TWO_LABEL = 'Repite los dos compases anteriores';

/**
 * Signo de repetición de dos compases (dos barras oblicuas con un punto a cada lado). Se coloca sobre la barra de compás común
 * de la pareja de destino: lo dibuja el primer destino, centrado en su borde derecho.
 */
export function repeatSymbolTwo() {
  const svg = s('svg', {
    class: 'repite-signo repite-signo-doble', viewBox: '0 0 84 64', width: 84, height: 64, role: 'img', 'aria-label': REPEAT_TWO_LABEL, focusable: 'false',
  },
  s('title', null, REPEAT_TWO_LABEL),
  s('path', { d: 'M44 8 L53 8 L31 56 L22 56 Z', fill: 'currentColor' }),
  s('path', { d: 'M62 8 L71 8 L49 56 L40 56 Z', fill: 'currentColor' }),
  s('circle', { cx: 14, cy: 20, r: 6, fill: 'currentColor' }),
  s('circle', { cx: 70, cy: 44, r: 6, fill: 'currentColor' }));
  return h('div', { class: 'compas-repite-doble' }, svg);
}
