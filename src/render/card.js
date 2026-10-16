import { h, s } from './dom.js';
import { layoutFretboard } from '../geometry/fretboard.js';
import { DEGREE_COLORS, familyStyle } from '../model/families.js';
import { effectiveText } from '../model/song.js';

const INK = '#14183a';
const MUTED = '#5c6ab0';

export function fretboardSvg(voicing) {
  const g = layoutFretboard(voicing.frets, voicing.degrees);
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
  for (const str of g.strings) {
    svg.append(s('line', { x1: x0, y1: str.y, x2: x1, y2: str.y, stroke: INK, 'stroke-width': 1.1 }));
  }
  for (const line of g.fretLines) {
    svg.append(s('line', {
      x1: line.x, y1: g.strings[0].y, x2: line.x, y2: g.stringsBottom,
      stroke: INK, 'stroke-width': line.nut ? 4.5 : 1.1, 'stroke-linecap': 'round',
    }));
  }
  for (const label of g.labels) {
    svg.append(s('text', { x: label.x, y: label.y, 'text-anchor': 'middle', 'font-size': 11, fill: MUTED }, label.text));
  }
  for (const mark of g.marks) {
    if (mark.kind === 'open') {
      svg.append(s('circle', { cx: mark.x, cy: mark.y, r: 4, fill: 'none', stroke: INK, 'stroke-width': 1.5 }));
    } else if (mark.kind === 'mute') {
      const d = 3.6;
      svg.append(s('path', {
        d: `M${mark.x - d} ${mark.y - d}L${mark.x + d} ${mark.y + d}M${mark.x + d} ${mark.y - d}L${mark.x - d} ${mark.y + d}`,
        stroke: INK, 'stroke-width': 1.6, 'stroke-linecap': 'round',
      }));
    } else {
      const color = (mark.degree && DEGREE_COLORS[mark.degree]) || { bg: INK, fg: '#ffffff' };
      svg.append(s('circle', { cx: mark.x, cy: mark.y, r: 7.5, fill: color.bg }));
      if (mark.degree) {
        svg.append(s('text', { x: mark.x, y: mark.y + 3.6, 'text-anchor': 'middle', 'font-size': 10.5, fill: color.fg }, mark.degree));
      }
    }
  }
  return svg;
}

export function cardNode(event, voicing, { selected = false, onSelect } = {}) {
  const above = effectiveText(event, voicing, 'aboveText');
  const inside = effectiveText(event, voicing, 'insideText');
  const pending = !voicing;

  const card = h('div', {
    class: `tarjeta${pending ? ' pendiente' : ''}${selected ? ' sel' : ''}`,
    style: familyStyle(event.family),
    'aria-current': selected ? 'true' : null,
    onclick: onSelect ? (e) => { e.stopPropagation(); onSelect(); } : null,
  },
    h('div', { class: 't-cab' },
      h('div', { class: 't-nom' }, event.chordName || '—'),
      inside ? h('div', { class: 't-txt' }, inside) : null),
    pending ? h('div', { class: 't-pend' }, 'Sin digitación (pendiente)') : fretboardSvg(voicing));

  return h('div', { class: 'tarjeta-col' },
    h('div', { class: 't-titulo' }, above || null),
    card);
}
