import { h } from '../render/dom.js';
import { JUMP_NAMES, MARKER_NAMES, checkStructure } from '../model/structure.js';

const WHY = 'Editar marcas musicales llega en la fase 3.';
const EDGE = { before: 'antes del', after: 'después del' };

/** Lectura de la estructura guardada, sin interpretarla ni calcular recorridos. */
function describe(song) {
  const st = song.structure || {};
  const label = (id) => {
    const m = song.measures.find((x) => x.id === id);
    return m ? `compás ${m.label}` : 'compás desaparecido';
  };
  const markerLabel = (id) => {
    const mk = (st.markers || []).find((x) => x.id === id);
    return mk ? `${MARKER_NAMES[mk.type]} (${EDGE[mk.edge]} ${label(mk.measureId)})` : 'destino desaparecido';
  };
  const range = (a, b) => (a === b ? label(a) : `${label(a)} a ${label(b)}`);

  const rows = [];
  for (const r of st.repeats || []) rows.push(['Repetición', `×${r.times}, ${range(r.startMeasureId, r.endMeasureId)}`]);
  for (const e of st.endings || []) rows.push(['Casilla', `pasada${e.passes.length > 1 ? 's' : ''} ${e.passes.join(', ')}, ${range(e.startMeasureId, e.endMeasureId)}`]);
  for (const m of st.markers || []) rows.push([MARKER_NAMES[m.type], `${EDGE[m.edge]} ${label(m.measureId)}`]);
  for (const j of st.jumps || []) {
    const targets = [j.segnoMarkerId && `Segno: ${markerLabel(j.segnoMarkerId)}`, j.codaMarkerId && `Coda: ${markerLabel(j.codaMarkerId)}`, j.fineMarkerId && `Fine: ${markerLabel(j.fineMarkerId)}`].filter(Boolean);
    rows.push([JUMP_NAMES[j.type] || j.type, `${EDGE[j.edge]} ${label(j.measureId)}${targets.length ? ' → ' + targets.join('; ') : ''}`]);
  }
  return rows;
}

function field(id, labelText, options) {
  return h('div', { class: 'field' },
    h('label', { for: id }, labelText),
    h('select', { id }, options.map((o) => h('option', { value: o }, o))));
}

export function mountMarksPanel(root, store) {
  const dynamic = h('div');
  root.append(
    h('div', { class: 'panel-head' }, h('h2', { id: 't-marcas' }, 'Marcas musicales'), h('span', { class: 'hint' }, 'Solo lectura')),
    dynamic,
    h('div', { class: 'mark-add' },
      h('h3', null, 'Nueva marca'),
      h('fieldset', { disabled: true, 'aria-describedby': 'why-marcas' },
        h('legend', { class: 'sr-only' }, 'Nueva marca (no disponible todavía)'),
        field('m-tipo', 'Tipo', ['Repetición', 'Casilla', 'Segno', 'Coda', 'Fine', 'Salto']),
        field('m-lugar', 'Compás, borde o tramo', ['Compás seleccionado'])),
      h('button', { type: 'button', class: 'btn', 'aria-disabled': 'true', 'aria-describedby': 'why-marcas', 'data-reason': WHY }, 'Añadir marca'),
      h('p', { class: 'note', id: 'why-marcas' }, 'No disponible todavía: editar y dibujar marcas llega en la fase 3. Las marcas se conservan al guardar y abrir, y aún no se dibujan en la hoja.')));

  function render(state) {
    const rows = describe(state.song);
    const warnings = checkStructure(state.song);
    dynamic.replaceChildren(
      rows.length
        ? h('ul', { class: 'mark-list' }, rows.map(([kind, text]) => h('li', { class: 'mark-item' }, h('span', { class: 'mark-kind' }, kind), h('span', null, text))))
        : h('p', { class: 'hint' }, 'Esta canción no tiene marcas.'),
      warnings.length
        ? h('div', { class: 'warn-box', role: 'region', 'aria-label': 'Avisos de marcas' },
            h('h3', null, `Avisos (${warnings.length})`),
            h('ul', { class: 'dialog-list' }, warnings.map((w) => h('li', null, w.message))),
            h('p', { class: 'hint' }, 'Las marcas incompletas se conservan tal cual; nada se redirige solo. La edición de marcas llega en la fase 3.'))
        : null);
  }

  render(store.state);
  store.subscribe((state, scope) => { if (scope !== 'zoom' && scope !== 'selection' && scope !== 'status') render(state); });
}
