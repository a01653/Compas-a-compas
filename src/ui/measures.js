import { h } from '../render/dom.js';
import { familyStyle } from '../model/families.js';
import { addMeasure, deleteMeasure, duplicateMeasure, moveMeasure } from '../model/song.js';
import { measureConsequences } from '../model/structure.js';
import { selectedMeasure } from '../store.js';
import { confirmDialog } from './dialog.js';
import { notify } from './notify.js';
import { openImportDialog } from './importList.js';

function summary(measure) {
  if (!measure.chordEvents.length) return h('span', { class: 'measure-empty' }, 'Vacío');
  return h('span', { class: 'measure-sum' }, measure.chordEvents.map((event) => {
    const n = event.voicings.length;
    return h('span', { class: 'tag', style: familyStyle(event.family) },
      event.chordName || 'Sin nombre',
      h('small', null, n === 0 ? 'pendiente' : n === 1 ? '1 voicing' : `${n} voicings`));
  }));
}

export function mountMeasuresPanel(root, store) {
  const list = h('ul', { class: 'measure-list' });
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
    const { moved, inversions } = moveMeasure(store.state.song, store.state.selection.measureId, delta);
    if (!moved) return;
    store.commit('structure');
    if (inversions.length) {
      notify(`Aviso: este movimiento deja tramos invertidos. ${inversions.map((w) => w.message).join(' ')}`, { duration: 9000 });
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

  root.append(
    h('div', { class: 'panel-head' },
      h('h2', { id: 't-compases' }, 'Compases'),
      h('span', { class: 'hint', id: 'cuenta-compases' })),
    h('div', { class: 'measure-tools', role: 'group', 'aria-label': 'Acciones sobre compases' },
      bAdd, bInsert, bDup, bDelete, bUp, bDown, bImport),
    list);

  function render(state) {
    const total = state.song.measures.length;
    root.querySelector('#cuenta-compases').textContent = total === 1 ? '1 compás' : `${total} compases`;
    const index = state.song.measures.findIndex((m) => m.id === state.selection.measureId);
    const none = index < 0;
    bInsert.disabled = bDup.disabled = bDelete.disabled = none;
    bUp.disabled = none || index === 0;
    bDown.disabled = none || index === total - 1;

    list.replaceChildren(...state.song.measures.map((m) => h('li', null,
      h('button', {
        type: 'button',
        class: 'measure-item',
        'aria-current': m.id === state.selection.measureId ? 'true' : null,
        'aria-label': `Compás ${m.label}`,
        onclick: () => store.selectMeasure(m.id),
      }, h('span', { class: 'measure-num', 'aria-hidden': 'true' }, m.label), summary(m)))));
    if (!total) list.append(h('li', { class: 'hint' }, 'La canción no tiene compases. Añade uno o importa una lista.'));
  }

  render(store.state);
  store.subscribe((state, scope) => { if (scope !== 'zoom' && scope !== 'status') render(state); });
}
