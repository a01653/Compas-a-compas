import { h, s } from './dom.js';
import { layoutFretboard } from '../geometry/fretboard.js';
import { DEFAULT_DOT, degreeColor, degreeDisplay } from '../model/degrees.js';
import { paletteFamilyStyle, familyForeground, foreground, isColor } from '../model/palette.js';
import { effectiveText } from '../model/song.js';

const INK = '#14183a';
const MUTED = '#5c6ab0';

/** Punto con grado manual (traste o cuerda al aire): color por grado; sin color definido, tinta. */
function degreeDot(mark, radius, palette, ink = INK) {
  const fallback = isColor(palette?.note) ? { bg: palette.note, fg: foreground(palette.note) }
    : ink !== INK ? { bg: ink, fg: foreground(ink) } : DEFAULT_DOT;
  const color = (mark.degree && degreeColor(mark.degree, palette)) || fallback;
  const group = s('g', null, s('circle', { cx: mark.x, cy: mark.y, r: radius, fill: color.bg,
    stroke: palette ? ink : null, 'stroke-width': palette ? .7 : null }));
  if (mark.degree) {
    const shown = degreeDisplay(mark.degree);
    group.append(s('text', { x: mark.x, y: mark.y + shown.fontSize * 0.34, 'text-anchor': 'middle', 'font-size': shown.fontSize, fill: color.fg }, shown.text));
    group.append(s('title', null, mark.degree));
  }
  return group;
}

/** Mástil SVG, o un aviso si abarca demasiados trastes para dibujarse legiblemente. */
export function fretboardSvg(voicing, { palette, ink = INK, muted = MUTED } = {}) {
  const g = layoutFretboard(voicing.frets, voicing.degrees);
  if (!g.drawable) {
    return h('div', { class: 'mastil-aviso', role: 'note' }, `No se puede dibujar: ${g.reason}`);
  }

  const svg = s('svg', {
    class: 'mastil',
    width: g.width,
    height: g.height,
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

export function cardNode(event, voicing, { selected = false, onSelect, palette } = {}) {
  const above = effectiveText(event, voicing, 'aboveText');
  const inside = effectiveText(event, voicing, 'insideText');
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
      h('div', { class: 't-nom' }, event.chordName || '—'),
      inside ? h('div', { class: 't-txt' }, inside) : null),
    pending ? h('div', { class: 't-pend' }, 'Sin digitación (pendiente)') : fretboardSvg(voicing, {
      palette,
      ink: familyForeground(event.family, palette) || INK,
      muted: familyForeground(event.family, palette) || MUTED,
    }),
    legend.length
      ? h('ul', { class: 't-leyenda', 'aria-label': 'Grados completos' }, legend.map((item) => h('li', null, `${item.string}ª: ${item.degree}`)))
      : null);

  return h('div', { class: 'tarjeta-col' },
    h('div', { class: 't-titulo' }, above || null),
    card);
}
