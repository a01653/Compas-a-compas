import { h } from './dom.js';
import { cardNode } from './card.js';
import { paletteFamilyStyle } from '../model/palette.js';
import { projectMarks, fragmentMarks } from '../model/marksProjection.js';
import { marksParts } from './marks.js';
import { repeatSymbol, repeatSymbolTwo } from './repeat.js';
import { buildUnits, fragmentFlags, groupAtoms, titleSpans } from '../layout/atoms.js';
import { MAX_ROW_EXPANSION, pageStyleVars } from '../layout/spec.js';
import { deriveTonalityContext, tonalitiesVisible } from '../model/tonality.js';
import { effectiveText, measureNumbersVisible } from '../model/song.js';

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
  // Contexto de tonalidad calculado una vez (orden escrito del documento). Ocultar las franjas no toca la cabecera.
  const tonality = tonalitiesVisible(song) ? deriveTonalityContext(song) : new Map();
  return { song, units: buildUnits(song), byMeasure, events, tonality };
}

/** `edge` = { lead, tail }: datos de la primera y de la última columna del fragmento (null donde no aplican). */
function eventNode(ctx, group, measureId, onSelect, edge) {
  const { event, voicings } = ctx.events.get(group.eventId);
  const cards = group.atoms.map((atom, index) => {
    const voicing = atom.voicingId === null ? null : voicings.get(atom.voicingId);
    return cardNode(event, voicing, {
      palette: ctx.song.palette,
      tonal: voicing ? ctx.tonality.get(voicing.id) || null : null,
      fretboardScalePercent: ctx.song.fretboardScalePercent ?? 100,
      lead: index === 0 ? edge.lead : null,
      tail: index === group.atoms.length - 1 ? edge.tail : null,
      onSelect: onSelect ? () => onSelect({ measureId, eventId: event.id, voicingId: atom.voicingId }) : null,
    });
  });
  const cls = ['evento', group.cutBefore ? 'corta-ini' : '', group.cutAfter ? 'corta-fin' : ''].filter(Boolean).join(' ');
  return h('div', {
    class: cls,
    style: `${paletteFamilyStyle(event.family, ctx.song.palette)};grid-column:span ${Math.max(1, group.atoms.length)}`,
    role: 'group',
    'aria-label': `Acorde ${event.chordName || 'sin nombre'}`,
    'data-event-id': event.id,
  }, cards);
}

/**
 * Títulos exteriores del fragmento, colocados en la rejilla del compás (pista de títulos). Cada uno empieza en la columna de
 * su tarjeta y puede ocupar las siguientes hasta la próxima tarjeta con título o el final del fragmento (titleSpans): así
 * ajusta línea al ancho del compás y no al de su tarjeta. No ensancha columnas (contain: inline-size en sheet.css).
 */
function titleNodes(ctx, groups, measureId, onSelect) {
  const cards = groups.flatMap((group) => {
    const { event, voicings } = ctx.events.get(group.eventId);
    return group.atoms.map((atom) => ({
      eventId: event.id,
      voicingId: atom.voicingId,
      text: effectiveText(event, atom.voicingId === null ? null : voicings.get(atom.voicingId), 'aboveText'),
    }));
  });
  return titleSpans(cards.map((card) => card.text)).map(({ start, end }) => {
    const card = cards[start];
    return h('div', {
      class: 't-titulo',
      style: `grid-column:${start + 1} / ${end + 1}`,
      'data-event-id': card.eventId,
      'data-voicing-id': card.voicingId ?? '',
      onclick: onSelect ? (e) => { e.stopPropagation(); onSelect({ measureId, eventId: card.eventId, voicingId: card.voicingId }); } : null,
    }, h('span', { class: 't-titulo-caja' }, card.text));
  });
}

/**
 * Fragmento [from, to) de un compás. Los símbolos de borde (inicio/fin de repetición, marcas antes/después)
 * solo se dibujan en el primer y el último fragmento; los demás llevan solo continuidad.
 */
export function fragmentNode(ctx, unitIndex, from, to, { onSelect } = {}) {
  const unit = ctx.units[unitIndex];
  const { isFirst, isLast } = fragmentFlags(unit, from, to);
  const parts = marksParts(fragmentMarks(ctx.byMeasure.get(unit.measureId), { isFirst, isLast }));

  // Número, línea del compás y barras de repetición viven en la zona del compás de cada columna, por debajo de título y franja.
  // Con la numeración oculta solo se omite el texto de la etiqueta: el hueco, los datos y el resto de marcas no cambian.
  const label = measureNumbersVisible(ctx.song) ? unit.label : null;
  const lead = { label, continuation: !isFirst, barStart: parts.barStart };

  const groups = unit.atoms.length ? groupAtoms(unit, from, to) : [];
  const body = groups.length
    ? h('div', { class: 'eventos' }, groups.map((group, i) => eventNode(ctx, group, unit.measureId, onSelect, {
      lead: i === 0 ? lead : null,
      tail: i === groups.length - 1 ? parts.barEnd : null,
    })))
    : unit.repeatPrevious || unit.repeatPair
      ? h('div', { class: `t-pos t-pos-lead t-pos-repite${unit.repeatPair ? ' t-pos-repite-doble' : ''}` },
        h('div', { class: 't-num' }, label === null ? null : h('span', { class: 'compas-num' }, label)),
        parts.barStart, parts.barEnd, unit.repeatPair === 'second' ? h('div', { class: 'compas-repite' }) : unit.repeatPair ? [h('div', { class: 'compas-repite' }), repeatSymbolTwo()] : repeatSymbol())
      : h('div', { class: 't-pos t-pos-lead t-pos-vacio' },
        h('div', { class: 't-num' }, label === null ? null : h('span', { class: 'compas-num' }, label),
          isFirst ? null : h('span', { class: 'compas-continuacion' }, 'continuación')),
        parts.barStart, parts.barEnd,
        h('div', { class: 'compas-vacio' }, 'Compás vacío'));

  return h('div', {
    class: ['compas', isFirst ? '' : 'compas-cont', ...parts.classes].filter(Boolean).join(' '),
    style: `grid-column:span ${Math.max(1, to - from)}`,
    'data-measure-id': unit.measureId,
    onclick: onSelect ? () => onSelect({ measureId: unit.measureId }) : null,
  },
    parts.strip,
    groups.length ? titleNodes(ctx, groups, unit.measureId, onSelect) : null,
    body);
}

/** Cabecera de hoja: canción y tonalidad a la izquierda (con ajuste de línea), `actual/total` arriba a la derecha. */
export function headerNode(song, pageText) {
  return h('header', { class: 'hoja-cab' },
    h('div', { class: 'hoja-titulos' },
      h('span', { class: 'hoja-titulo' }, song.title || 'Sin título'),
      song.key ? h('span', { class: 'hoja-tono' }, song.key) : null),
    h('div', { class: 'hoja-pagina' }, pageText));
}

/**
 * Pistas de la fila con tope individual: cada columna crece desde su ancho natural medido hasta, como mucho, ese ancho más
 * MAX_ROW_EXPANSION. El espacio se reparte en partes iguales entre las columnas que aún pueden crecer, nunca por encima del tope
 * de ninguna, y el sobrante queda a la derecha. Sin anchos medidos, las columnas no se estiran (tamaño natural).
 * El mínimo es el ancho medido y no `min-content`: el de una columna de tarjeta es 0 (su rejilla interna es minmax(0, 1fr)), y en
 * una fila justa el navegador repartiría a partes iguales, estrechando las columnas más anchas por debajo de su contenido.
 */
function rowColumns(row) {
  const parts = row.fragments.map((f) => f.tracks || f.columns || []);
  const expected = row.fragments.reduce((sum, f) => sum + Math.max(1, f.to - f.from), 0);
  if (parts.some((p, i) => p.length !== Math.max(1, row.fragments[i].to - row.fragments[i].from)) || parts.flat().length !== expected) return null;
  const floor = (n) => `${Math.floor(n * 100) / 100}px`;
  const cap = (n) => `${Math.ceil(n * (1 + MAX_ROW_EXPANSION) * 100) / 100}px`;
  // Pistas fijas (ancho manual o línea ajustada) o con tope individual de expansión (automático).
  return `grid-template-columns:${row.fragments.map((f, i) => (f.tracks ? parts[i].map((n) => `${n}px`) : parts[i].map((n) => `minmax(${floor(n)},${cap(n)})`))).flat().join(' ')}`;
}

export function pageNode(ctx, page, number, total, { onSelect, onFitRow, onBreakRow } = {}) {
  return h('section', {
    class: ['hoja', page.overflow ? 'desborda' : '', measureNumbersVisible(ctx.song) ? '' : 'sin-numeros'].filter(Boolean).join(' '),
    style: pageStyleVars(),
    'aria-label': `Hoja ${number} de ${total}`,
  },
    headerNode(ctx.song, `${number}/${total}`),
    h('div', { class: 'hoja-cuerpo' }, page.rows.map((row) => {
      const nodes = row.fragments.map((f) => fragmentNode(ctx, f.unitIndex, f.from, f.to, { onSelect }));
      const after = onBreakRow ? breakAfterButton(row, ctx, onBreakRow) : null;
      if (after) nodes[nodes.length - 1].append(after);
      const line = h('div', { class: ['fila', row.fill ? 'fila-ajustada' : '', row.compact ? 'fila-compacta' : ''].filter(Boolean).join(' '), style: rowColumns(row) },
        nodes);
      // Solo la vista previa envuelve la fila para colocar sus botones en los márgenes; la exportación dibuja la fila sola.
      return onFitRow ? h('div', { class: 'fila-caja' }, onBreakRow ? breakRowButton(row, ctx, onBreakRow) : null, line, fitRowButton(row, ctx, onFitRow)) : line;
    })));
}

/** Botón de la vista previa (no existe en el HTML exportado) para ajustar una línea al ancho o volver a automático. */
function fitRowButton(row, ctx, onFitRow) {
  const measureIds = [...new Set(row.fragments.map((f) => ctx.units[f.unitIndex].measureId))];
  const label = row.fill ? 'Volver la línea a automático' : 'Ajustar línea al ancho';
  return h('button', {
    type: 'button', class: row.fill ? 'fila-ajuste activo' : 'fila-ajuste', title: label, 'aria-label': label, 'aria-pressed': row.fill ? 'true' : 'false',
    onclick: (e) => { e.stopPropagation(); onFitRow({ measureIds, filled: Boolean(row.fill) }); },
  }, '↔');
}

/** Marca de la vista previa (no existe en el HTML exportado), en el margen izquierdo de una línea forzada por un salto de línea antes. */
function breakRowButton(row, ctx, onBreakRow) {
  const first = row.fragments[0];
  const unit = first && first.from === 0 ? ctx.units[first.unitIndex] : null;
  if (!unit?.breakBefore || unit.repeatPair === 'second') return null;
  const label = `Salto de línea antes del compás ${unit.label}. Pulsa para quitarlo.`;
  return h('button', {
    type: 'button', class: 'fila-salto', title: label, 'aria-label': label,
    onclick: (e) => { e.stopPropagation(); onBreakRow({ measureId: unit.measureId, label: unit.label, side: 'before' }); },
  }, '↵');
}

/**
 * Marca de la vista previa (no existe en el HTML exportado) junto al final del compás que lleva salto de línea después, abajo a su
 * derecha: solo en su último fragmento y si el salto tiene efecto (hay compás detrás y no es el primero de una pareja de repetición).
 */
function breakAfterButton(row, ctx, onBreakRow) {
  const last = row.fragments[row.fragments.length - 1];
  const unit = last ? ctx.units[last.unitIndex] : null;
  if (!unit?.breakAfter || last.to < unit.atoms.length || !ctx.units[last.unitIndex + 1] || unit.repeatPair === 'first') return null;
  const label = `Salto de línea después del compás ${unit.label}. Pulsa para quitarlo.`;
  return h('button', {
    type: 'button', class: 'fila-salto fila-salto-despues', title: label, 'aria-label': label,
    onclick: (e) => { e.stopPropagation(); onBreakRow({ measureId: unit.measureId, label: unit.label, side: 'after' }); },
  }, '↵');
}

/**
 * Marca la selección sobre nodos ya dibujados, sin reconstruirlos (no pierde foco ni desplazamiento). `marked` y `markedCards`
 * son las selecciones múltiples de compases y de tarjetas; `target` ('measure' o 'card') resalta más lo que se señaló. Solo
 * cambia clases, nunca dimensiones.
 */
export function applySelection(root, selection, { marked = [], markedCards = [], target = 'measure' } = {}) {
  const set = new Set(marked);
  const cards = new Set(markedCards);
  root.classList.toggle('apunta-tarjeta', target === 'card');
  for (const el of root.querySelectorAll('.compas')) {
    el.classList.toggle('sel', el.dataset.measureId === selection.measureId);
    el.classList.toggle('marcado', set.has(el.dataset.measureId));
  }
  // Ayuda del editor: marca el grupo del acorde seleccionado; no cambia dimensiones ni paginación.
  for (const el of root.querySelectorAll('.evento')) {
    el.classList.toggle('sel-evento', Boolean(selection.eventId) && el.dataset.eventId === selection.eventId);
  }
  for (const el of root.querySelectorAll('.tarjeta')) {
    const voicingMatches = el.dataset.voicingId === '' ? selection.voicingId === null : el.dataset.voicingId === selection.voicingId;
    const on = el.dataset.eventId === selection.eventId && voicingMatches;
    el.classList.toggle('sel', on);
    el.classList.toggle('marcado', cards.has(el.dataset.voicingId ? `v:${el.dataset.voicingId}` : `e:${el.dataset.eventId}`));
    if (on) el.setAttribute('aria-current', 'true');
    else el.removeAttribute('aria-current');
  }
}
