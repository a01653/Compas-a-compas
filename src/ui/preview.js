import { h } from '../render/dom.js';
import { sheetNode } from '../render/sheet.js';

const SHEET_WIDTH = 1123;
const MIN = 30;
const MAX = 150;

export function mountPreviewPanel(root, store) {
  const stage = h('div', { class: 'stage' });
  const viewport = h('div', { class: 'viewport', tabindex: '0', role: 'region', 'aria-label': 'Vista previa de la hoja, con desplazamiento' }, stage);
  const value = h('output', { class: 'zoom-value', for: 'zoom-range' });
  const range = h('input', {
    id: 'zoom-range', type: 'range', min: MIN, max: MAX, step: 5, 'aria-label': 'Zoom de la hoja',
    oninput: (e) => store.setZoom(Number(e.target.value) / 100),
  });
  const step = (delta) => () => store.setZoom(Math.min(MAX, Math.max(MIN, Math.round(currentScale() * 100) + delta)) / 100);

  root.append(
    h('div', { class: 'panel-head' },
      h('h2', { id: 't-vista' }, 'Vista previa'),
      h('span', { class: 'hint' }, 'A4 apaisado · una sola hoja; la paginación llega en la fase 4')),
    h('div', { class: 'zoom-bar', role: 'group', 'aria-label': 'Zoom de la hoja' },
      h('button', { type: 'button', class: 'btn btn-icon', 'aria-label': 'Reducir zoom', onclick: step(-10) }, '−'),
      range, value,
      h('button', { type: 'button', class: 'btn btn-icon', 'aria-label': 'Ampliar zoom', onclick: step(10) }, '+'),
      h('button', { type: 'button', class: 'btn', onclick: () => store.setZoom('fit') }, 'Ajustar al ancho')),
    viewport);

  let sheet = null;

  function fitScale() {
    const styles = getComputedStyle(viewport);
    const inner = viewport.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
    return Math.min(MAX / 100, Math.max(MIN / 100, inner / SHEET_WIDTH));
  }
  function currentScale() {
    return store.state.zoom === 'fit' ? fitScale() : store.state.zoom;
  }

  function layout() {
    if (!sheet) return;
    const scale = currentScale();
    sheet.style.transform = `scale(${scale})`;
    stage.style.width = `${SHEET_WIDTH * scale}px`;
    stage.style.height = `${sheet.offsetHeight * scale}px`;
    range.value = String(Math.round(scale * 100));
    value.textContent = `${Math.round(scale * 100)} %`;
  }

  function render() {
    const state = store.state;
    sheet = sheetNode(state.song, state.selection, (selection) => store.select(selection));
    stage.replaceChildren(sheet);
    layout();
  }

  render();
  store.subscribe((state, scope) => {
    if (scope === 'zoom') layout();
    else if (scope !== 'status') render();
  });

  let lastWidth = viewport.clientWidth;
  new ResizeObserver(() => {
    if (viewport.clientWidth === lastWidth) return;
    lastWidth = viewport.clientWidth;
    layout();
  }).observe(viewport);

  // Con las fuentes cargadas la altura de la hoja puede cambiar.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
}
