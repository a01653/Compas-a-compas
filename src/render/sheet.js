import { h } from './dom.js';
import { cardNode } from './card.js';
import { familyStyle } from '../model/families.js';
import { projectMarks, fragmentMarks } from '../model/marksProjection.js';
import { marksParts } from './marks.js';

function measureNode(measure, selection, onSelect, marks) {
  const parts = marksParts(marks);
  const isSelected = measure.id === selection.measureId;
  const pick = (event, voicing) => () => onSelect({ measureId: measure.id, eventId: event.id, voicingId: voicing ? voicing.id : null });

  const body = measure.chordEvents.length
    ? h('div', { class: 'eventos' }, measure.chordEvents.map((event) => {
        const voicings = event.voicings.length ? event.voicings : [null];
        const cards = voicings.map((v) => cardNode(event, v, {
          selected: isSelected && event.id === selection.eventId && (v ? v.id === selection.voicingId : selection.voicingId === null),
          onSelect: pick(event, v),
        }));
        return h('div', { class: 'evento', style: familyStyle(event.family), role: 'group', 'aria-label': `Acorde ${event.chordName || 'sin nombre'}` }, cards);
      }))
    : h('div', { class: 'compas-vacio' }, 'Compás vacío');

  return h('div', {
    class: ['compas', isSelected ? 'sel' : '', ...parts.classes].filter(Boolean).join(' '),
    'data-measure-id': measure.id,
    onclick: () => onSelect({ measureId: measure.id }),
  }, h('span', { class: 'compas-num' }, measure.label), parts.bars, parts.strip, body);
}

/** Hoja A4 apaisada. La paginación real llega en la fase 4: aquí hay una única hoja que crece si hace falta. */
export function sheetNode(song, selection, onSelect) {
  const { byMeasure } = projectMarks(song);
  return h('article', { class: 'hoja', 'aria-label': 'Hoja de la canción' },
    h('header', { class: 'hoja-cab' },
      h('div', { class: 'hoja-titulos' },
        h('div', { class: 'hoja-titulo' }, song.title || 'Sin título'),
        song.key ? h('div', { class: 'hoja-tono' }, song.key) : null),
      h('div', { class: 'hoja-pagina' }, '1/1')),
    h('div', { class: 'hoja-cuerpo' }, song.measures.map((m) => measureNode(m, selection, onSelect, fragmentMarks(byMeasure.get(m.id))))));
}
