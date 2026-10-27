import { h } from '../render/dom.js';
import { setMeasureWidth } from '../model/song.js';
import { selectedMeasure } from '../store.js';
import { songCards } from '../model/cards.js';
import { openImportDialog } from './importList.js';
import { icon, iconButton } from './icons.js';

/** Grupos del menú del compás: las mismas acciones que el menú contextual de la hoja. */
const GROUPS = [
  ['Compás', ['insertBefore', 'insertAfter', 'duplicate', 'moveUp', 'moveDown', 'swap', 'remove']],
  ['Copiar y pegar', ['copy', 'cut', 'pasteBefore', 'pasteAfter', 'replace']],
  ['Selección de varios', ['toggleMark', 'toggleSelectMode', 'clearMarked']],
];

export function mountMeasuresPanel(root, store, { actions, clipboard }) {
  const menuButtons = new Map();
  const menuButton = (id) => {
    const button = h('button', { type: 'button', class: 'btn menu-action', 'data-action': id, onclick: () => actions.run(id) });
    menuButtons.set(id, button);
    return button;
  };
  const bImport = h('button', { type: 'button', class: 'btn', onclick: () => openImportDialog(store) }, 'Importar lista…');

  const select = h('select', { id: 'measure-select', 'aria-label': 'Seleccionar compás',
    onchange: e => store.selectMeasure(e.target.value) });
  const previous = iconButton('left', 'Compás anterior', () => navigate(-1));
  const next = iconButton('right', 'Compás siguiente', () => navigate(1));
  function navigate(delta) {
    const index = store.state.song.measures.findIndex(m => m.id === store.state.selection.measureId);
    const target = store.state.song.measures[index + delta];
    if (target) store.selectMeasure(target.id);
  }
  const bAdd = iconButton('plus', 'Añadir compás al final', () => actions.run('append'));
  const label = h('input', { id: 'f-etiqueta', type: 'text', oninput: e => {
    const m = selectedMeasure(store.state);
    if (m) { m.label = e.target.value; store.emit('text'); }
  } });
  const width = h('input', { id: 'f-ancho-compas', type: 'number', min: 10, max: 100, step: 1, inputmode: 'numeric', placeholder: 'Automático',
    'aria-describedby': 'hint-ancho-compas', oninput: e => {
      const m = selectedMeasure(store.state);
      if (m) { setMeasureWidth(m, e.target.value); store.emit('text'); }
    } });
  const renumber = h('input', { id: 'f-renumerar', type: 'checkbox', 'aria-describedby': 'hint-renumerar',
    onchange: e => actions.setRenumber(e.target.checked) });
  const selectionText = h('span', { class: 'selection-text', id: 'texto-seleccion' });
  const selectionBar = h('div', { class: 'selection-bar', role: 'status', hidden: true },
    icon('check'), selectionText,
    h('button', { type: 'button', class: 'btn btn-soft', onclick: () => actions.run('toggleSelectMode'), 'data-role': 'mode' }, 'Terminar'),
    h('button', { type: 'button', class: 'btn btn-soft', onclick: () => actions.run('clearMarked'), 'data-role': 'clear' }, 'Quitar selección'));

  root.append(
    h('div', { class: 'navigator-heading' },
      h('div', { class: 'navigator-caption' }, h('h2', { id: 't-compases' }, 'Compás'), h('span', { id: 'cuenta-compases', class: 'hint' })),
      h('button', { id: 'open-marks', type: 'button', 'aria-haspopup': 'dialog', 'aria-controls': 'marks-dialog' },
        icon('repeat'), h('span', { id: 'marks-label' }, 'Marcas'), h('span', { id: 'marks-count' }))),
    h('div', { class: 'navigator-row' }, previous, select, next, bAdd,
      h('details', { class: 'action-menu', id: 'measure-menu' },
        h('summary', { class: 'btn tool-icon', 'aria-label': 'Opciones del compás', title: 'Opciones del compás' }, icon('more')),
        h('div', { class: 'menu-content measure-menu' },
          h('div', { class: 'field' }, h('label', { for: 'f-etiqueta' }, 'Etiqueta del compás'), label),
          h('div', { class: 'field' }, h('label', { for: 'f-ancho-compas' }, 'Ancho del compás (% de la línea)'), width,
            h('p', { class: 'hint', id: 'hint-ancho-compas' }, 'Vacío = automático. Nunca baja del ancho que necesitan sus tarjetas; si no cabe, se avisa y caben menos compases por línea.')),
          h('div', { class: 'field check-field' },
            h('label', { for: 'f-renumerar' }, renumber, 'Renumerar etiquetas automáticamente'),
            h('p', { class: 'hint', id: 'hint-renumerar' }, 'Al insertar, pegar, duplicar, mover o borrar. Desmárcalo para conservar los números originales de una partitura.'),
            menuButton('renumberNow')),
          ...GROUPS.map(([title, ids]) => h('div', { class: 'menu-group', role: 'group', 'aria-label': title },
            h('p', { class: 'menu-group-title' }, title),
            h('div', { class: 'menu-grid' }, ids.map(menuButton)))),
          bImport))),
    selectionBar);

  function render(state) {
    const total = state.song.measures.length;
    root.querySelector('#cuenta-compases').textContent = total === 1 ? '1 compás' : `${total} compases`;
    const index = state.song.measures.findIndex((m) => m.id === state.selection.measureId);
    const none = index < 0;
    previous.disabled = none || index === 0;
    next.disabled = none || index === total - 1;
    for (const [id, button] of menuButtons) {
      const item = actions.item(id);
      button.replaceChildren(...[h('span', null, item.label), item.hint ? h('kbd', null, item.hint) : null].filter(Boolean));
      button.disabled = Boolean(item.disabled);
      button.classList.toggle('danger', Boolean(item.danger));
      if (item.title) button.title = item.title;
      else button.removeAttribute('title');
    }

    const marked = new Set(state.marked);
    select.replaceChildren(...state.song.measures.map(m => h('option', {
      value: m.id, selected: m.id === state.selection.measureId,
    }, `${marked.has(m.id) ? '✓ ' : ''}${m.label} · ${m.repeatPrevious ? 'Repite el anterior' : m.repeatPreviousTwo ? 'Repite los dos anteriores' : m.chordEvents.map(e => e.chordName?.trim() ? e.chordName : 'Sin nombre').join(' / ') || 'Vacío'}`)));
    if (!total) select.append(h('option', { value: '' }, 'Sin compases'));
    select.disabled = none;
    if (document.activeElement !== label) label.value = selectedMeasure(state)?.label || '';
    label.disabled = none;
    if (document.activeElement !== width) width.value = Number.isInteger(selectedMeasure(state)?.widthPercent) ? String(selectedMeasure(state).widthPercent) : '';
    width.disabled = none;
    renumber.checked = actions.renumberEnabled();

    // Barra de selección múltiple: solo aparece mientras hay compases o tarjetas marcados o el modo selección está activo.
    const count = state.marked.length;
    const cardCount = state.markedCards.length;
    selectionBar.hidden = !count && !cardCount && !state.selectMode;
    const list = (items) => (items.length > 6 ? `${items.slice(0, 6).join(', ')}…` : items.join(', '));
    if (cardCount) {
      const keys = new Set(state.markedCards);
      const names = songCards(state.song).filter(card => keys.has(card.key))
        .map(card => `${card.event.chordName?.trim() || 'sin nombre'} (c. ${card.measure.label})`);
      selectionText.textContent = `${cardCount === 1 ? '1 tarjeta seleccionada' : `${cardCount} tarjetas seleccionadas`}: ${list(names)}`;
    } else if (count) {
      const labels = state.marked.map(id => state.song.measures.find(m => m.id === id)?.label);
      selectionText.textContent = `${count === 1 ? '1 compás seleccionado' : `${count} compases seleccionados`}: ${list(labels)}`;
    } else selectionText.textContent = 'Modo selección: pulsa tarjetas o compases en la hoja para marcarlos.';
    selectionBar.querySelector('[data-role="mode"]').hidden = !state.selectMode;
    selectionBar.querySelector('[data-role="clear"]').hidden = !count && !cardCount;
  }

  render(store.state);
  store.subscribe((state, scope) => { if (scope !== 'zoom' && scope !== 'status') render(state); });
  clipboard.subscribe(() => render(store.state));
}
