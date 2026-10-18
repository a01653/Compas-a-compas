import { h, s } from './dom.js';
import { layoutFretboard } from '../geometry/fretboard.js';
import { degreeColor, degreeDisplay } from '../model/degrees.js';
import { inkColor, mutedColor, neutralNote, paletteFamilyStyle, familyForeground, isColor, tonalityBandStyle } from '../model/palette.js';
import { effectiveText } from '../model/song.js';


/** Punto con grado manual (traste o cuerda al aire): color por grado; sin color definido, tinta. */
function degreeDot(mark, radius, palette, ink = inkColor()) {
  // Notas sin grado o sin color propio: fondo neutro (gris de serie o el elegido), independiente de la tinta del mástil.
  const color = (mark.degree && degreeColor(mark.degree, palette)) || neutralNote(palette);
  const group = s('g', null, s('circle', { cx: mark.x, cy: mark.y, r: radius, fill: color.bg, stroke: ink, 'stroke-width': .7 }));
  if (mark.degree) {
    const shown = degreeDisplay(mark.degree);
    group.append(s('text', { x: mark.x, y: mark.y + shown.fontSize * 0.34, 'text-anchor': 'middle', 'font-size': shown.fontSize, fill: color.fg }, shown.text));
    group.append(s('title', null, mark.degree));
  }
  return group;
}

/** Mástil SVG, o un aviso si abarca demasiados trastes para dibujarse legiblemente. */
export function fretboardSvg(voicing, { palette, ink = inkColor(), muted = mutedColor(), scalePercent = 100 } = {}) {
  const g = layoutFretboard(voicing.frets, voicing.degrees);
  if (!g.drawable) {
    return h('div', { class: 'mastil-aviso', role: 'note' }, `No se puede dibujar: ${g.reason}`);
  }

  const svg = s('svg', {
    class: 'mastil',
    width: g.width * scalePercent / 100,
    height: g.height * scalePercent / 100,
    viewBox: `0 0 ${g.width} ${g.height}`,
    role: 'img',
    'aria-label': `Mástil, trastes ${g.start} a ${g.end}`,
  });

  const x0 = g.fretLines[0].x;
  const x1 = g.fretLines[g.fretLines.length - 1].x;
  g.strings.forEach((str, row) => {
    svg.append(s('line', { x1: x0, y1: str.y, x2: x1, y2: str.y, stroke: ink, 'stroke-width': 1.3 }));
    // Número de cuerda 1–6 (primera arriba), en la zona exterior; es solo rotulación, no un dato.
    svg.append(s('text', { x: 2, y: str.y + 3.5, 'font-size': 11, fill: ink }, String(row + 1)));
  });
  for (const line of g.fretLines) {
    svg.append(s('line', {
      x1: line.x, y1: g.strings[0].y, x2: line.x, y2: g.stringsBottom,
      stroke: ink, 'stroke-width': line.nut ? 4.5 : 1.5, 'stroke-linecap': 'round',
    }));
  }
  for (const label of g.labels) {
    svg.append(s('text', { x: label.x, y: label.y, 'text-anchor': 'middle', 'font-size': 10, fill: muted }, label.text));
  }
  for (const mark of g.marks) {
    if (mark.kind === 'open') {
      if (mark.degree) svg.append(degreeDot(mark, 7, palette, ink));
      else svg.append(s('circle', { cx: mark.x, cy: mark.y, r: 4, fill: 'none', stroke: isColor(palette?.note) ? palette.note : ink, 'stroke-width': 1.5 }));
    } else if (mark.kind === 'mute') {
      const d = 3.6;
      svg.append(s('path', {
        d: `M${mark.x - d} ${mark.y - d}L${mark.x + d} ${mark.y + d}M${mark.x + d} ${mark.y - d}L${mark.x - d} ${mark.y + d}`,
        stroke: ink, 'stroke-width': 1.6, 'stroke-linecap': 'round',
      }));
    } else {
      svg.append(degreeDot(mark, 8, palette, ink));
    }
  }
  return svg;
}

/** Grados que se abrevian en el punto y sí se dibujan (no mudas): [{ string, degree }]. El dato no cambia. */
function truncatedLegend(voicing) {
  if (!voicing || !Array.isArray(voicing.degrees)) return [];
  const items = [];
  voicing.degrees.forEach((degree, index) => {
    const fret = voicing.frets[index];
    if (typeof degree !== 'string' || degree === '' || fret === null || !Number.isInteger(fret) || fret < 0) return;
    if (degreeDisplay(degree).truncated) items.push({ string: 6 - index, degree });
  });
  return items;
}

/**
 * Franja de tonalidad de una posición: fondo y borde de la familia de la tonalidad (no la del acorde).
 * Solo lleva texto cuando es una etiqueta nueva; las heredadas mantienen el color sin repetir el texto.
 */
function tonalityBand(tonal, palette) {
  return h('div', {
    class: tonal.show ? 't-tono' : 't-tono t-tono-heredada',
    style: tonalityBandStyle(tonal.family, palette),
    'data-tonality-source': tonal.source,
  }, tonal.show ? tonal.text : null);
}

/**
 * Columna de una posición, de arriba abajo: título, franja de tonalidad y zona del compás (hueco del número y tarjeta).
 * Las tres filas son compartidas por todas las columnas del fragmento (rejilla con subgrid, ver sheet.css): los títulos quedan
 * en una fila, las franjas en otra y la zona del compás empieza a la misma altura en todas. Solo la primera columna
 * (`lead`) pinta el número y la línea del compás.
 * `lead` = { label, continuation, barStart } · `tail` = barra de fin de repetición de la última columna.
 */
export function cardNode(event, voicing, { selected = false, onSelect, palette, tonal = null, lead = null, tail = null, fretboardScalePercent = 100 } = {}) {
  const above = effectiveText(event, voicing, 'aboveText');
  const inside = effectiveText(event, voicing, 'insideText');
  const degree = voicing?.voicingDegree || '';
  const pending = !voicing;
  const legend = truncatedLegend(voicing);

  const card = h('div', {
    class: `tarjeta${pending ? ' pendiente' : ''}${selected ? ' sel' : ''}`,
    style: paletteFamilyStyle(event.family, palette, true),
    'data-event-id': event.id,
    'data-voicing-id': voicing ? voicing.id : '',
    'aria-current': selected ? 'true' : null,
    onclick: onSelect ? (e) => { e.stopPropagation(); onSelect(); } : null,
  },
    h('div', { class: 't-cab' },
      h('div', { class: 't-nom' }, event.chordName?.trim() ? event.chordName : null),
      degree ? h('div', { class: 't-grado' }, degree) : null,
      inside ? h('div', { class: 't-txt' }, inside) : null),
    pending ? h('div', { class: 't-pend' }, 'Sin digitación (pendiente)') : fretboardSvg(voicing, {
      palette,
      ink: familyForeground(event.family, palette) || inkColor(),
      muted: familyForeground(event.family, palette) || mutedColor(),
      scalePercent: fretboardScalePercent,
    }),
    legend.length
      ? h('ul', { class: 't-leyenda', 'aria-label': 'Grados completos' }, legend.map((item) => h('li', null, `${item.string}ª: ${item.degree}`)))
      : null);

  const top = above || tonal
    ? h('div', { class: 't-sup' },
      above ? h('div', { class: 't-titulo' }, h('span', { class: 't-titulo-caja' }, above)) : null,
      tonal ? tonalityBand(tonal, palette) : null)
    : null;
  // Toda la columna (título y franja incluidos) selecciona su posición sin que el clic llegue al compás.
  return h('div', { class: 'tarjeta-col', onclick: onSelect ? (e) => { e.stopPropagation(); onSelect(); } : null },
    top,
    h('div', { class: lead ? 't-pos t-pos-lead' : 't-pos' },
      h('div', { class: 't-num' }, lead ? [
        lead.label === null ? null : h('span', { class: 'compas-num' }, lead.label),
        lead.continuation ? h('span', { class: 'compas-continuacion' }, 'continuación') : null,
      ] : null),
      lead?.barStart, tail, card));
}
