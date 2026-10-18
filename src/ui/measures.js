import { h } from '../render/dom.js';
import { addMeasure, deleteMeasure, duplicateMeasure, moveMeasure, setMeasureWidth } from '../model/song.js';
import { measureConsequences } from '../model/structure.js';
import { selectedMeasure } from '../store.js';
import { confirmDialog } from './dialog.js';
import { notify } from './notify.js';
import { openImportDialog } from './importList.js';
import { icon, iconButton } from './icons.js';

export function mountMeasuresPanel(root, store) {
  const button = (text, onclick) => h('button', { type: 'button', class: 'btn', onclick }, text);

  const bAdd = button('Añadir al final', () => {
    const m = addMeasure(store.state.song);
    store.commit('structure', { measureId: m.id });
  });
  const bInsert = button('Insertar después', () => {
    const song = store.state.song;
    const index = song.measures.findIndex((m) => m.id === store.state.selection.measureId);
    const m = addMeasure(song, index + 1);
    store.commit('structure', { measureId: m.id });
  });
  const bDup = button('Duplicar', () => {
    const copy = duplicateMeasure(store.state.song, store.state.selection.measureId);
    if (copy) store.commit('structure', { measureId: copy.id });
  });
  const move = (delta) => () => {
    const { moved, inversions, repeats } = moveMeasure(store.state.song, store.state.selection.measureId, delta);
    if (!moved) return;
    store.commit('structure');
    if (inversions.length) {
      notify(`Aviso: este movimiento deja tramos invertidos. ${inversions.map((w) => w.message).join(' ')}`, { duration: 9000 });
    }
    if (repeats.length) {
      notify(`Aviso: este movimiento deja repeticiones del compás anterior sin su origen inmediato. ${repeats.map((w) => w.message).join(' ')}`, { duration: 9000 });
    }
  };
  const bUp = button('↑ Subir', move(-1));
  const bDown = button('↓ Bajar', move(1));
  const bDelete = button('Borrar', onDelete);
  const bImport = button('Importar lista…', () => openImportDialog(store));

  async function onDelete() {
    const { song, selection } = store.state;
    const measure = selectedMeasure(store.state);
    if (!measure) return;
    const consequences = measureConsequences(song, measure.id);
    if (measure.chordEvents.length || consequences.length) {
      const items = consequences.length
        ? consequences
        : ['No hay marcas musicales que dependan de este compás.'];
      const choice = await confirmDialog({
        title: `¿Borrar el compás ${measure.label}?`,
        intro: `Se borrará el compás con ${measure.chordEvents.length} acorde(s). Nada se redirige automáticamente.`,
        items,
        actions: [
          { label: 'Cancelar', value: 'cancel' },
          { label: 'Borrar compás', value: 'delete', kind: 'danger' },
        ],
      });
      if (choice !== 'delete') return;
    }
    const index = song.measures.findIndex((m) => m.id === selection.measureId);
    deleteMeasure(song, measure.id);
    const neighbour = song.measures[Math.min(index, song.measures.length - 1)];
    store.commit('structure', { measureId: neighbour ? neighbour.id : null });
    if (consequences.length) notify('Compás borrado. Revisa los avisos de marcas: algunas referencias quedan pendientes.', { duration: 7000 });
  }

  const select = h('select', { id: 'measure-select', 'aria-label': 'Seleccionar compás',
    onchange: e => store.selectMeasure(e.target.value) });
  const previous = iconButton('left', 'Compás anterior', () => navigate(-1));
  const next = iconButton('right', 'Compás siguiente', () => navigate(1));
  function navigate(delta) {
    const index = store.state.song.measures.findIndex(m => m.id === store.state.selection.measureId);
    const target = store.state.song.measures[index + delta];
    if (target) store.selectMeasure(target.id);
  }
  bAdd.replaceChildren(icon('plus'));
  bAdd.className = 'btn tool-icon';
  bAdd.title = 'Añadir compás al final';
  bAdd.setAttribute('aria-label', bAdd.title);
  const label = h('input', { id: 'f-etiqueta', type: 'text', oninput: e => {
    const m = selectedMeasure(store.state);
    if (m) { m.label = e.target.value; store.emit('text'); }
  } });
  const width = h('input', { id: 'f-ancho-compas', type: 'number', min: 10, max: 100, step: 1, inputmode: 'numeric', placeholder: 'Automático',
    'aria-describedby': 'hint-ancho-compas', oninput: e => {
      const m = selectedMeasure(store.state);
      if (m) { setMeasureWidth(m, e.target.value); store.emit('text'); }
    } });
  root.append(
    h('div', { class: 'navigator-heading' },
      h('div', { class: 'navigator-caption' }, h('h2', { id: 't-compases' }, 'Compás'), h('span', { id: 'cuenta-compases', class: 'hint' })),
      h('button', { id: 'open-marks', type: 'button', 'aria-haspopup': 'dialog', 'aria-controls': 'marks-dialog' },
        icon('repeat'), h('span', { id: 'marks-label' }, 'Marcas'), h('span', { id: 'marks-count' }))),
    h('div', { class: 'navigator-row' }, previous, select, next, bAdd,
      h('details', { class: 'action-menu' },
        h('summary', { class: 'btn tool-icon', 'aria-label': 'Opciones del compás', title: 'Opciones del compás' }, icon('more')),
        h('div', { class: 'menu-content measure-menu' },
          h('div', { class: 'field' }, h('label', { for: 'f-etiqueta' }, 'Etiqueta del compás'), label),
          h('div', { class: 'field' }, h('label', { for: 'f-ancho-compas' }, 'Ancho del compás (% de la línea)'), width,
            h('p', { class: 'hint', id: 'hint-ancho-compas' }, 'Vacío = automático. Nunca baja del ancho que necesitan sus tarjetas; si no cabe, se avisa y caben menos compases por línea.')),
          bInsert, bDup, bUp, bDown, bDelete, bImport))));

  function render(state) {
    const total = state.song.measures.length;
    root.querySelector('#cuenta-compases').textContent = total === 1 ? '1 compás' : `${total} compases`;
    const index = state.song.measures.findIndex((m) => m.id === state.selection.measureId);
    const none = index < 0;
    previous.disabled = none || index === 0;
    next.disabled = none || index === total - 1;
    bInsert.disabled = bDup.disabled = bDelete.disabled = none;
    bUp.disabled = none || index === 0;
    bDown.disabled = none || index === total - 1;

    select.replaceChildren(...state.song.measures.map(m => h('option', {
      value: m.id, selected: m.id === state.selection.measureId,
    }, `${m.label} · ${m.repeatPrevious ? 'Repite el anterior' : m.repeatPreviousTwo ? 'Repite los dos anteriores' : m.chordEvents.map(e => e.chordName?.trim() ? e.chordName : 'Sin nombre').join(' / ') || 'Vacío'}`)));
    if (!total) select.append(h('option', { value: '' }, 'Sin compases'));
    select.disabled = none;
    if (document.activeElement !== label) label.value = selectedMeasure(state)?.label || '';
    label.disabled = none;
    if (document.activeElement !== width) width.value = Number.isInteger(selectedMeasure(state)?.widthPercent) ? String(selectedMeasure(state).widthPercent) : '';
    width.disabled = none;
  }

  render(store.state);
  store.subscribe((state, scope) => { if (scope !== 'zoom' && scope !== 'status') render(state); });
}
