import { h } from '../render/dom.js';
import { pageNode, applySelection } from '../render/sheet.js';
import { PAGE_PX, PREVIEW_GAP } from '../layout/spec.js';
import { collectProblems } from '../layout/problems.js';
import { ZOOM_MIN, ZOOM_MAX, clampZoom, fitZoom } from '../layout/zoom.js';
import { createPaginator } from './paginator.js';
import { setLineFill } from '../model/song.js';
import { selectionTarget, targetCardKeys, targetMeasureIds } from '../store.js';
import { selectionKey } from '../model/cards.js';
import { openContextMenu } from './contextMenu.js';

const MIN = Math.round(ZOOM_MIN * 100);
const MAX = Math.round(ZOOM_MAX * 100);

/**
 * Vista previa paginada. Devuelve el paginador para que la exportación espere a la última paginación.
 * El zoom solo escala lo ya dibujado: no mide ni reparte de nuevo. Seleccionar solo cambia clases.
 * Sobre la hoja se actúa sobre lo señalado: dentro del recuadro de una tarjeta, la tarjeta; en el resto del compás (número,
 * título, franja, huecos), el compás entero. Ctrl+clic marca o desmarca, Mayús+clic marca un tramo, en modo selección un clic
 * marca o desmarca, y el clic derecho (o la tecla de menú / Mayús+F10 con la hoja enfocada) abre el menú contextual de la
 * tarjeta o del compás.
 */
export function mountPreviewPanel(root, store, { measureActions, cardActions } = {}) {
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
    // El clic simple selecciona como siempre; `pointed` (fijado en captura) dice si se señaló la tarjeta o el compás.
    const onSelect = (selection) => store.select(selection, { clearMarked: true, kind: pointed });
    // «Ajustar línea al ancho»: cada pulsación es un paso de historial, así que se puede deshacer.
    const onFitRow = ({ measureIds, filled }) => {
      store.endEdit();
      setLineFill(store.state.song, measureIds, !filled);
      store.emit('structure');
    };
    pagesEl.replaceChildren(...pages.map((page, i) => pageNode(result.ctx, page, i + 1, pageCount, { onSelect, onFitRow })));
    renderNotices(result.layout.notices || []);
    paintSelection(store.state);
    summary.textContent = `A4 apaisado · ${pageCount} ${pageCount === 1 ? 'hoja' : 'hojas'}`;
    renderProblems(collectProblems(result.snapshot, result.layout));
    applyZoom();
  }

  const paginator = createPaginator(store, {
    onStart: () => viewport.setAttribute('aria-busy', 'true'),
    onResult: showResult,
  });

  function paintSelection(state) {
    applySelection(pagesEl, state.selection, { marked: state.marked, markedCards: state.markedCards, target: selectionTarget(state) });
  }
  function syncMode(state) {
    pagesEl.classList.toggle('modo-seleccion', state.selectMode);
  }
  store.subscribe((state, scope) => {
    syncMode(state);
    if (scope === 'zoom') applyZoom();
    else if (scope === 'selection') paintSelection(state);
  });
  syncMode(store.state);

  // Clics con modificador y modo selección: se atienden en captura, antes de que el compás o la tarjeta seleccionen.
  const measureAt = (target) => target instanceof Element ? target.closest('.compas[data-measure-id]') : null;
  const cardAt = (target, measure) => {
    const card = target instanceof Element ? target.closest('.tarjeta[data-event-id]') : null;
    return card ? { measureId: measure.dataset.measureId, eventId: card.dataset.eventId, voicingId: card.dataset.voicingId || null } : null;
  };
  let pointed = 'measure';
  // Mayús+clic no debe seleccionar texto de la hoja.
  pagesEl.addEventListener('mousedown', (event) => { if (event.shiftKey && measureAt(event.target)) event.preventDefault(); });
  pagesEl.addEventListener('click', (event) => {
    const measure = measureAt(event.target);
    if (!measure || event.target.closest('button')) return;
    const id = measure.dataset.measureId;
    const card = cardAt(event.target, measure);
    pointed = card ? 'card' : 'measure';
    if (event.shiftKey) card ? store.markCardRange(card) : store.markRange(id);
    else if (event.ctrlKey || event.metaKey) card ? store.toggleMarkedCard(card, { withActive: true }) : store.toggleMarked(id, { withActive: true });
    else if (store.state.selectMode) card ? store.toggleMarkedCard(card) : store.toggleMarked(id);
    else return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  function openMenuFor(x, y) {
    if (!measureActions) return;
    if (cardActions && selectionTarget(store.state) === 'card') {
      openContextMenu({ x, y, label: 'Acciones de la tarjeta', items: cardActions.contextItems(), returnFocus: viewport });
      return;
    }
    // Con tarjetas copiadas, el compás ofrece pegarlas al final (sirve también para un compás vacío o de repetición).
    const extraPaste = cardActions && !cardActions.item('pasteEnd').disabled ? [cardActions.item('pasteEnd')] : [];
    openContextMenu({ x, y, label: 'Acciones del compás', items: measureActions.contextItems({ extraPaste }), returnFocus: viewport });
  }
  pagesEl.addEventListener('contextmenu', (event) => {
    const measure = measureAt(event.target);
    if (!measure || !measureActions) return;
    event.preventDefault();
    const id = measure.dataset.measureId;
    const card = cardAt(event.target, measure);
    const { state } = store;
    // Como en un explorador de archivos: el clic derecho fuera de la selección selecciona solo lo pulsado.
    if (card) {
      if (selectionTarget(state) !== 'card' || !targetCardKeys(state).includes(selectionKey(card))) store.select(card, { clearMarked: true, kind: 'card' });
    } else if (selectionTarget(state) !== 'measure' || !targetMeasureIds(state).includes(id)) {
      store.select(id === state.selection.measureId ? state.selection : { measureId: id }, { clearMarked: true, kind: 'measure' });
    }
    openMenuFor(event.clientX, event.clientY);
  });
  viewport.addEventListener('keydown', (event) => {
    if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return;
    event.preventDefault();
    const active = selectionTarget(store.state) === 'card' ? pagesEl.querySelector('.tarjeta.sel') : null;
    const box = (active || pagesEl.querySelector('.compas.sel') || viewport).getBoundingClientRect();
    openMenuFor(box.left + 12, box.top + 12);
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
