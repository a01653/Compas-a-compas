import { h } from '../render/dom.js';
import { pageNode, applySelection } from '../render/sheet.js';
import { PAGE_PX, PREVIEW_GAP } from '../layout/spec.js';
import { collectProblems } from '../layout/problems.js';
import { ZOOM_MIN, ZOOM_MAX, clampZoom, fitZoom } from '../layout/zoom.js';
import { createPaginator } from './paginator.js';
import { setLineFill } from '../model/song.js';

const MIN = Math.round(ZOOM_MIN * 100);
const MAX = Math.round(ZOOM_MAX * 100);

/**
 * Vista previa paginada. Devuelve el paginador para que la exportación espere a la última paginación.
 * El zoom solo escala lo ya dibujado: no mide ni reparte de nuevo. Seleccionar solo cambia clases.
 */
export function mountPreviewPanel(root, store) {
  const warn = h('div', { class: 'warn-box warn-vista', hidden: true, role: 'alert' });
  const summary = h('span', { class: 'hint', 'aria-live': 'polite' }, 'A4 apaisado · calculando hojas…');
  const notice = h('div', { class: 'warn-box warn-aviso', hidden: true, role: 'status' });
  const pagesEl = h('div', { class: 'vista-hojas' });
  const stage = h('div', { class: 'stage' }, pagesEl);
  const viewport = h('div', { class: 'viewport', tabindex: '0', role: 'region', 'aria-label': 'Vista previa de las hojas, con desplazamiento' }, stage);
  const value = h('output', { class: 'zoom-value', for: 'zoom-range' });
  const range = h('input', {
    id: 'zoom-range', type: 'range', min: MIN, max: MAX, step: 5, 'aria-label': 'Zoom de las hojas',
    oninput: (e) => store.setZoom(clampZoom(Number(e.target.value) / 100)),
  });
  const step = (delta) => () => store.setZoom(clampZoom(Math.round(currentScale() * 100 + delta) / 100));

  root.append(
    h('div', { class: 'panel-head' },
      h('h2', { id: 't-vista' }, 'Vista previa'),
      summary),
    h('div', { class: 'zoom-bar', role: 'group', 'aria-label': 'Zoom de las hojas' },
      h('button', { type: 'button', class: 'btn btn-icon', 'aria-label': 'Reducir zoom', onclick: step(-10) }, '−'),
      range, value,
      h('button', { type: 'button', class: 'btn btn-icon', 'aria-label': 'Ampliar zoom', onclick: step(10) }, '+'),
      h('button', { type: 'button', class: 'btn', onclick: () => store.setZoom('fit') }, 'Ajustar al ancho')),
    warn,
    notice,
    viewport);

  let pageCount = 1;
  pagesEl.style.width = `${PAGE_PX.width}px`;
  pagesEl.style.gap = `${PREVIEW_GAP}px`;

  function renderProblems(problems) {
    warn.hidden = problems.length === 0;
    if (!problems.length) {
      warn.replaceChildren();
      return;
    }
    warn.replaceChildren(
      h('h3', null, `${problems.length} problema(s) impiden una hoja completa`),
      h('ul', { class: 'dialog-list' }, problems.map((p) => h('li', null, p.message))),
      h('p', { class: 'hint' }, 'No se ha cambiado ninguna nota. Exportar HTML e Imprimir / PDF están bloqueados hasta resolverlo.'));
  }

  function renderNotices(notices) {
    notice.hidden = notices.length === 0;
    notice.replaceChildren(...(notices.length ? [h('ul', { class: 'dialog-list' }, notices.map((n) => h('li', null, n.message)))] : []));
  }

  function fitScale() {
    const styles = getComputedStyle(viewport);
    const inner = viewport.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
    return fitZoom(inner, PAGE_PX.width);
  }
  function currentScale() {
    return store.state.zoom === 'fit' ? fitScale() : clampZoom(store.state.zoom);
  }

  /** Solo escala: dimensiones calculadas a partir de las medidas de la hoja, sin leer el DOM. */
  function applyZoom() {
    const scale = currentScale();
    pagesEl.style.transform = `scale(${scale})`;
    stage.style.width = `${PAGE_PX.width * scale}px`;
    stage.style.height = `${(pageCount * PAGE_PX.height + (pageCount - 1) * PREVIEW_GAP) * scale}px`;
    range.value = String(Math.round(scale * 100));
    value.textContent = `${Math.round(scale * 100)} %`;
  }

  function showResult(result) {
    viewport.removeAttribute('aria-busy');
    if (result.error) {
      summary.textContent = 'No se pudo calcular la paginación';
      renderProblems([{ kind: 'error', message: `Error al medir las hojas: ${result.error.message || result.error}` }]);
      return;
    }
    const { pages } = result.layout;
    pageCount = pages.length;
    const onSelect = (selection) => store.select(selection);
    // «Ajustar línea al ancho»: cada pulsación es un paso de historial, así que se puede deshacer.
    const onFitRow = ({ measureIds, filled }) => {
      store.endEdit();
      setLineFill(store.state.song, measureIds, !filled);
      store.emit('structure');
    };
    pagesEl.replaceChildren(...pages.map((page, i) => pageNode(result.ctx, page, i + 1, pageCount, { onSelect, onFitRow })));
    renderNotices(result.layout.notices || []);
    applySelection(pagesEl, store.state.selection);
    summary.textContent = `A4 apaisado · ${pageCount} ${pageCount === 1 ? 'hoja' : 'hojas'}`;
    renderProblems(collectProblems(result.snapshot, result.layout));
    applyZoom();
  }

  const paginator = createPaginator(store, {
    onStart: () => viewport.setAttribute('aria-busy', 'true'),
    onResult: showResult,
  });

  store.subscribe((state, scope) => {
    if (scope === 'zoom') applyZoom();
    else if (scope === 'selection') applySelection(pagesEl, state.selection);
  });

  // `scrollbar-gutter: stable` (CSS) mantiene constante el ancho útil, de modo que escalar no
  // hace aparecer ni desaparecer la barra y el observador no entra en bucle. Además se ignoran variaciones < 1 px.
  let lastWidth = viewport.clientWidth;
  new ResizeObserver(() => {
    const width = viewport.clientWidth;
    if (Math.abs(width - lastWidth) < 1) return;
    lastWidth = width;
    if (store.state.zoom === 'fit') applyZoom();
  }).observe(viewport);

  applyZoom();
  return paginator;
}
