import { h } from './dom.js';
import { cardNode } from './card.js';
import { paletteFamilyStyle } from '../model/palette.js';
import { projectMarks, fragmentMarks } from '../model/marksProjection.js';
import { marksParts } from './marks.js';
import { buildUnits, fragmentFlags, groupAtoms } from '../layout/atoms.js';
import { pageStyleVars } from '../layout/spec.js';

/**
 * Renderizador único de hojas: la vista previa, la medición y el HTML exportado dibujan con estas funciones.
 * Sin `onSelect` los nodos no llevan manejadores: es lo que se serializa al exportar.
 */

/** Datos derivados de una canción para dibujar y repartir (se calculan una vez por paginación). */
export function createSheetContext(song) {
  const { byMeasure } = projectMarks(song);
  const events = new Map();
  for (const measure of song.measures) {
    for (const event of measure.chordEvents) {
      events.set(event.id, { event, voicings: new Map(event.voicings.map((v) => [v.id, v])) });
    }
  }
  return { song, units: buildUnits(song), byMeasure, events };
}

function eventNode(ctx, group, measureId, onSelect) {
  const { event, voicings } = ctx.events.get(group.eventId);
  const cards = group.atoms.map((atom) => {
    const voicing = atom.voicingId === null ? null : voicings.get(atom.voicingId);
    return cardNode(event, voicing, {
      palette: ctx.song.palette,
      onSelect: onSelect ? () => onSelect({ measureId, eventId: event.id, voicingId: atom.voicingId }) : null,
    });
  });
  const cls = ['evento', group.cutBefore ? 'corta-ini' : '', group.cutAfter ? 'corta-fin' : ''].filter(Boolean).join(' ');
  return h('div', {
    class: cls,
    style: `${paletteFamilyStyle(event.family, ctx.song.palette)};flex-grow:${Math.max(1, group.atoms.length)}`,
    role: 'group',
    'aria-label': `Acorde ${event.chordName || 'sin nombre'}`,
    'data-event-id': event.id,
  }, cards);
}

/**
 * Fragmento [from, to) de un compás. Los símbolos de borde (inicio/fin de repetición, marcas antes/después)
 * solo se dibujan en el primer y el último fragmento; los demás llevan solo continuidad.
 */
export function fragmentNode(ctx, unitIndex, from, to, { onSelect } = {}) {
  const unit = ctx.units[unitIndex];
  const { isFirst, isLast } = fragmentFlags(unit, from, to);
  const parts = marksParts(fragmentMarks(ctx.byMeasure.get(unit.measureId), { isFirst, isLast }));

  const body = unit.atoms.length
    ? h('div', { class: 'eventos' }, groupAtoms(unit, from, to).map((group) => eventNode(ctx, group, unit.measureId, onSelect)))
    : h('div', { class: 'compas-vacio' }, 'Compás vacío');

  return h('div', {
    class: ['compas', isFirst ? '' : 'compas-cont', ...parts.classes].filter(Boolean).join(' '),
    style: `flex-grow:${Math.max(1, to - from)}`,
    'data-measure-id': unit.measureId,
    onclick: onSelect ? () => onSelect({ measureId: unit.measureId }) : null,
  },
    h('div', { class: 'compas-cab' },
      h('span', { class: 'compas-num' }, unit.label),
      isFirst ? null : h('span', { class: 'compas-continuacion' }, 'continuación')),
    parts.bars,
    parts.strip,
    body);
}

/** Cabecera de hoja: canción y tonalidad a la izquierda (con ajuste de línea), `actual/total` arriba a la derecha. */
export function headerNode(song, pageText) {
  return h('header', { class: 'hoja-cab' },
    h('div', { class: 'hoja-titulos' },
      h('div', { class: 'hoja-titulo' }, song.title || 'Sin título'),
      song.key ? h('div', { class: 'hoja-tono' }, song.key) : null),
    h('div', { class: 'hoja-pagina' }, pageText));
}

export function pageNode(ctx, page, number, total, { onSelect } = {}) {
  return h('section', {
    class: page.overflow ? 'hoja desborda' : 'hoja',
    style: pageStyleVars(),
    'aria-label': `Hoja ${number} de ${total}`,
  },
    headerNode(ctx.song, `${number}/${total}`),
    h('div', { class: 'hoja-cuerpo' }, page.rows.map((row) =>
      h('div', { class: 'fila' }, row.fragments.map((f) => fragmentNode(ctx, f.unitIndex, f.from, f.to, { onSelect }))))));
}

/** Marca la selección sobre nodos ya dibujados, sin reconstruirlos (no pierde foco ni desplazamiento). */
export function applySelection(root, selection) {
  for (const el of root.querySelectorAll('.compas')) {
    el.classList.toggle('sel', el.dataset.measureId === selection.measureId);
  }
  // Ayuda del editor: marca el grupo del acorde seleccionado; no cambia dimensiones ni paginación.
  for (const el of root.querySelectorAll('.evento')) {
    el.classList.toggle('sel-evento', Boolean(selection.eventId) && el.dataset.eventId === selection.eventId);
  }
  for (const el of root.querySelectorAll('.tarjeta')) {
    const voicingMatches = el.dataset.voicingId === '' ? selection.voicingId === null : el.dataset.voicingId === selection.voicingId;
    const on = el.dataset.eventId === selection.eventId && voicingMatches;
    el.classList.toggle('sel', on);
    if (on) el.setAttribute('aria-current', 'true');
    else el.removeAttribute('aria-current');
  }
}
