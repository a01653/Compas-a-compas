import { findMeasure } from '../model/song.js';
import { flatCards } from '../model/cards.js';
import { measureConsequences } from '../model/structure.js';
import {
  canMoveMeasures, canReplaceMeasures, canSwapMeasures, copyMeasures, deleteMeasures, duplicateMeasures, expandToUnits,
  fixRepeatReferences, insertEmptyMeasure, insertionPoint, moveMeasures, pasteMeasures, renumberEnabled, renumberLabels,
  replaceMeasures, runStructural, setRenumberMeasures, swapMeasures,
} from '../model/measureOps.js';
import { selectionTarget, targetMeasureIds } from '../store.js';
import { confirmDialog } from './dialog.js';
import { notify } from './notify.js';
import { contextMenuOpen } from './contextMenu.js';

/** Atajos visibles en los menús; los atiende mountMeasureShortcuts. */
export const SHORTCUTS = {
  copy: 'Ctrl+C', cut: 'Ctrl+X', pasteAfter: 'Ctrl+V', pasteBefore: 'Ctrl+Mayús+V',
  moveUp: 'Alt+↑', moveDown: 'Alt+↓', remove: 'Supr', clearMarked: 'Esc',
};

/** Botón Deshacer de un aviso: solo deshace si la canción no ha cambiado desde la acción. Créalo justo después de ella. */
export function undoNotice(store) {
  const after = JSON.stringify(store.state.song);
  return {
    label: 'Deshacer',
    run: () => {
      if (JSON.stringify(store.state.song) === after && store.undo()) notify('Cambio deshecho.');
      else notify('Ya hay cambios posteriores: usa Deshacer en la cabecera para volver atrás paso a paso.');
    },
  };
}

/**
 * Acciones de edición estructural sobre los compases seleccionados (los marcados o, si no hay, el activo). La barra del compás,
 * el menú contextual de la hoja y los atajos usan las mismas acciones. Cada una es un único paso de Deshacer.
 */
export function createMeasureActions(store, clipboard) {
  const song = () => store.state.song;
  const targets = () => targetMeasureIds(store.state);
  const labelsOf = (ids) => ids.map((id) => findMeasure(song(), id)?.label ?? '?');

  /** «Compás 3» o «Compases 2, 3 y 4», para concordar con el participio. */
  function phrase(ids) {
    const labels = labelsOf(ids);
    if (labels.length === 1) return { text: `Compás ${labels[0]}`, plural: false };
    if (labels.length <= 4) return { text: `Compases ${labels.slice(0, -1).join(', ')} y ${labels.at(-1)}`, plural: true };
    return { text: `${labels.length} compases (del ${labels[0]} al ${labels.at(-1)})`, plural: true };
  }
  const done = (ids, singular, plural) => {
    const p = phrase(ids);
    return `${p.text} ${p.plural ? plural : singular}.`;
  };
  const lower = (ids) => {
    const { text } = phrase(ids);
    return /^\d/.test(text) ? text : text[0].toLowerCase() + text.slice(1);
  };
  /** Con artículo: «el compás 3», «los compases 2 y 3» o «12 compases (del 2 al 13)». */
  const named = (ids) => (ids.length === 1 ? `el ${lower(ids)}` : ids.length <= 4 ? `los ${lower(ids)}` : lower(ids));
  const ofNamed = (ids) => (ids.length === 1 ? `del ${lower(ids)}` : `de ${named(ids)}`);

  const undoAction = () => undoNotice(store);
  /** Tras una operación de compás, lo seleccionado son compases: quita las tarjetas marcadas. */
  const commitMeasures = (selection, marked) => store.commit('structure', selection, { marked, kind: 'measure' });

  function fixReferences(ids) {
    store.endEdit();
    const fixed = fixRepeatReferences(song(), ids);
    if (!fixed) return notify('No hay referencias que se puedan corregir así; revisa el aviso en el editor del compás.');
    store.commit('structure');
    notify(fixed === 1 ? 'Referencia corregida: apunta al compás inmediatamente anterior.' : `Referencias corregidas: ${fixed}.`, { action: undoAction() });
  }

  /** Aviso final: renumeración, notas y avisos nuevos. Si hay repeticiones descolocadas ofrece corregirlas; si no, Deshacer. */
  function report(message, result = {}, { undo = false } = {}) {
    const parts = [message];
    if (result.relabeled) parts.push(`Etiquetas renumeradas: ${result.relabeled}.`);
    parts.push(...(result.notes || []));
    if (result.inversions?.length) parts.push(`Aviso: quedan tramos invertidos. ${result.inversions.map((w) => w.message).join(' ')}`);
    let action = undo ? undoAction() : null;
    if (result.repeats?.length) {
      parts.push(`Aviso: ${result.repeats.map((w) => w.message).join(' ')}`);
      const ids = [...new Set(result.repeats.map((w) => w.objectId))];
      if (result.fixable !== false) action = { label: 'Corregir referencias', run: () => fixReferences(ids) };
    }
    const long = result.notes?.length || result.inversions?.length || result.repeats?.length;
    notify(parts.join(' '), { duration: long ? 9000 : 5000, action });
  }

  function apply(operation) {
    store.endEdit();
    return runStructural(song(), operation);
  }

  function insert(side, ids = targets()) {
    const result = apply(() => insertEmptyMeasure(song(), ids, side));
    const [id] = result.ids;
    commitMeasures({ measureId: id }, []);
    const where = ids.length ? (side === 'before' ? ' antes' : ' después') : '';
    report(`Compás ${findMeasure(song(), id).label} insertado${where}.${result.shifted ? ' Se colocó fuera de la repetición de dos compases para no separar la pareja.' : ''}`, result);
  }

  function copy() {
    const ids = targets();
    if (!ids.length) return;
    clipboard.setMeasures({ measures: copyMeasures(song(), ids), cut: false, documentId: store.state.documentId });
    notify(`${done(ids, 'copiado', 'copiados')} ${ids.length === 1 ? 'Pégalo' : 'Pégalos'} con Ctrl+V o desde el menú del compás.`);
  }

  async function cut() {
    const ids = expandToUnits(song(), targets());
    if (!ids.length) return;
    const consequences = measureConsequences(song(), ids);
    if (consequences.length) {
      const choice = await confirmDialog({
        title: `¿Cortar ${named(ids)}?`,
        intro: 'Se quitan de la canción y quedan copiados. Si los pegas en esta misma canción conservan sus identificadores y estas marcas vuelven a encontrarlos; mientras tanto quedan pendientes:',
        items: consequences,
        actions: [{ label: 'Cancelar', value: 'cancel' }, { label: 'Cortar', value: 'cut', kind: 'danger' }],
      });
      if (choice !== 'cut') return;
    }
    const payload = { measures: copyMeasures(song(), ids), cut: true, documentId: store.state.documentId };
    const text = done(ids, 'cortado', 'cortados');
    const result = apply(() => deleteMeasures(song(), ids));
    clipboard.setMeasures(payload);
    commitMeasures({ measureId: result.neighbourId }, []);
    report(`${text} ${ids.length === 1 ? 'Pégalo' : 'Pégalos'} con Ctrl+V donde quieras.`, { ...result, fixable: false }, { undo: true });
  }

  function paste(side) {
    const payload = clipboard.measures;
    if (!payload) return;
    const ids = targets();
    const reuseIds = payload.cut && payload.documentId === store.state.documentId;
    const result = apply(({ renumber }) => {
      const { index, shifted } = insertionPoint(song(), ids, side);
      return { ...pasteMeasures(song(), payload.measures, index, { renumber, reuseIds }), shifted };
    });
    commitMeasures({ measureId: result.ids[0] }, result.ids.length > 1 ? result.ids : []);
    let text = done(result.ids, 'pegado', 'pegados');
    if (result.reused) text += result.ids.length === 1 ? ' Conserva su identificador: sus marcas vuelven a encontrarlo.' : ' Conservan sus identificadores: sus marcas vuelven a encontrarlos.';
    if (result.shifted) text += ' Se colocó fuera de la repetición de dos compases para no separar la pareja.';
    report(text, result);
  }

  async function replace() {
    const payload = clipboard.measures;
    const ids = targets();
    if (!payload || !canReplaceMeasures(song(), ids, payload.measures)) return;
    const choice = await confirmDialog({
      title: `¿Sustituir el contenido ${ofNamed(ids)}?`,
      intro: `Sus tarjetas, voicings, textos, tonalidades y ancho pasan a ser ${payload.measures.length === 1 ? 'los del compás copiado' : 'los de los compases copiados, en el mismo orden'}. Se conservan etiqueta, identificador y marcas. Puedes recuperarlo con Deshacer.`,
      actions: [{ label: 'Cancelar', value: 'cancel' }, { label: 'Sustituir', value: 'replace', kind: 'danger' }],
    });
    if (choice !== 'replace') return;
    const result = apply(() => replaceMeasures(song(), ids, payload.measures));
    store.commit('structure');
    report(done(ids, 'sustituido', 'sustituidos'), result, { undo: true });
  }

  function duplicate() {
    const ids = targets();
    if (!ids.length) return;
    const result = apply(({ renumber }) => duplicateMeasures(song(), ids, { renumber }));
    commitMeasures({ measureId: result.ids[0] }, result.ids.length > 1 ? result.ids : []);
    report(`${result.ids.length === 1 ? 'Copia creada' : 'Copias creadas'}: ${lower(result.ids)}.`, result);
  }

  function move(delta) {
    const ids = targets();
    if (!canMoveMeasures(song(), ids, delta)) return;
    const verb = delta < 0 ? 'una posición antes' : 'una posición después';
    const text = done(expandToUnits(song(), ids), `movido ${verb}`, `movidos ${verb}`); // Con las etiquetas de antes de renumerar.
    const result = apply(() => moveMeasures(song(), ids, delta));
    commitMeasures(null, result.ids.length > 1 ? result.ids : store.state.marked);
    report(text, result);
  }

  function swap() {
    const ids = targets();
    if (!canSwapMeasures(song(), ids)) return;
    const text = `${phrase(ids).text} intercambiados.`;
    const result = apply(() => swapMeasures(song(), ids));
    commitMeasures(null, result.ids);
    report(text, result);
  }

  async function remove() {
    const ids = targets();
    if (!ids.length) return;
    const consequences = measureConsequences(song(), ids);
    const cards = ids.reduce((sum, id) => sum + flatCards(findMeasure(song(), id)).length, 0);
    const one = ids.length === 1;
    const choice = await confirmDialog({
      title: one ? `¿Borrar el compás ${labelsOf(ids)[0]}?` : `¿Borrar ${ids.length} compases?`,
      intro: `Se ${one ? 'borrará' : 'borrarán'} ${named(ids)}, con ${cards} ${cards === 1 ? 'tarjeta' : 'tarjetas'}. Nada se redirige automáticamente. Puedes recuperarlo con Deshacer.`,
      items: consequences.length ? consequences : [`No hay marcas musicales que dependan de ${one ? 'este compás' : 'estos compases'}.`],
      actions: [{ label: 'Cancelar', value: 'cancel' }, { label: one ? 'Borrar compás' : 'Borrar compases', value: 'delete', kind: 'danger' }],
    });
    if (choice !== 'delete') return;
    const text = done(ids, 'borrado', 'borrados');
    const result = apply(() => deleteMeasures(song(), ids));
    commitMeasures({ measureId: result.neighbourId }, []);
    const pending = consequences.length ? 'Revisa los avisos de marcas: algunas referencias quedan pendientes.' : '';
    report([text, pending].filter(Boolean).join(' '), { ...result, fixable: false }, { undo: true });
  }

  function renumberNow() {
    store.endEdit();
    const changed = renumberLabels(song()).length;
    if (!changed) return notify('Las etiquetas numéricas ya siguen el orden de los compases.');
    store.commit('structure');
    notify(`Etiquetas renumeradas: ${changed}.`, { action: undoAction() });
  }

  function setRenumber(on) {
    store.endEdit();
    setRenumberMeasures(song(), on);
    store.commit('structure');
    notify(on
      ? 'Renumeración automática activada: se aplicará al insertar, pegar, duplicar, mover o borrar compases. «Renumerar ahora» la aplica ya.'
      : 'Renumeración automática desactivada: los compases conservan sus etiquetas al editar la estructura.');
  }

  function toggleSelectMode() {
    const on = !store.state.selectMode;
    store.setSelectMode(on);
    notify(on ? 'Modo selección: pulsa compases o tarjetas en la hoja para marcarlos o desmarcarlos.' : 'Modo selección terminado. La selección se conserva.');
  }

  const runners = {
    insertBefore: () => insert('before'),
    insertAfter: () => insert('after'),
    append: () => insert('after', []),
    copy, cut, replace, duplicate, swap, remove, renumberNow, toggleSelectMode,
    pasteBefore: () => paste('before'),
    pasteAfter: () => paste('after'),
    moveUp: () => move(-1),
    moveDown: () => move(1),
    toggleMark: () => { if (store.state.selection.measureId) store.toggleMarked(store.state.selection.measureId); },
    clearMarked: () => store.setMarked([]),
  };

  /** Etiqueta, atajo y disponibilidad de cada acción para el estado actual. Los atajos solo se muestran donde se aplican. */
  function item(id) {
    const state = store.state;
    const ids = targetMeasureIds(state);
    const none = !ids.length;
    const payload = clipboard.measures;
    const active = state.selection.measureId;
    const hint = id === 'pasteBefore' || id === 'pasteAfter' ? (clipboard.last === 'measures' ? SHORTCUTS[id] : null)
      : id === 'clearMarked' || selectionTarget(state) === 'measure' ? SHORTCUTS[id] || null : null;
    const base = { id, hint, run: runners[id] };
    switch (id) {
      case 'insertBefore': return { ...base, label: 'Insertar compás antes' };
      case 'insertAfter': return { ...base, label: 'Insertar compás después' };
      case 'append': return { ...base, label: 'Añadir compás al final' };
      case 'copy': return { ...base, label: 'Copiar', disabled: none };
      case 'cut': return { ...base, label: 'Cortar', disabled: none };
      case 'pasteBefore':
      case 'pasteAfter': return {
        ...base, label: id === 'pasteBefore' ? 'Pegar antes' : 'Pegar después', disabled: !payload,
        title: payload ? `Inserta ${payload.measures.length === 1 ? 'el compás copiado' : `los ${payload.measures.length} compases copiados`} con identificadores nuevos.` : 'Copia o corta antes uno o varios compases.',
      };
      case 'replace': {
        const ok = payload && canReplaceMeasures(state.song, ids, payload.measures);
        return {
          ...base, label: 'Sustituir por lo copiado', disabled: !ok,
          title: !payload ? 'Copia antes el compás cuyo contenido quieres usar.'
            : ok ? 'Cambia todo el contenido del compás por el copiado; conserva etiqueta, identificador y marcas.'
              : `Has copiado ${payload.measures.length} compases: selecciona otros tantos, o copia uno solo para aplicarlo a todos.`,
        };
      }
      case 'duplicate': return { ...base, label: 'Duplicar', disabled: none };
      case 'moveUp': return { ...base, label: 'Subir (mover antes)', disabled: !canMoveMeasures(state.song, ids, -1) };
      case 'moveDown': return { ...base, label: 'Bajar (mover después)', disabled: !canMoveMeasures(state.song, ids, 1) };
      case 'swap': return {
        ...base, label: 'Intercambiar', disabled: !canSwapMeasures(state.song, ids),
        title: 'Intercambia las posiciones de los dos compases seleccionados, con todos sus datos y marcas.',
      };
      case 'remove': return { ...base, label: ids.length > 1 ? `Borrar ${ids.length} compases` : 'Borrar', disabled: none, danger: true };
      case 'toggleMark': return {
        ...base, label: state.marked.includes(active) ? 'Quitar de la selección' : 'Añadir a la selección', disabled: !active,
        title: 'Marca o desmarca el compás activo para actuar sobre varios a la vez. En la hoja: Ctrl+clic o Mayús+clic.',
      };
      case 'toggleSelectMode': return { ...base, label: state.selectMode ? 'Terminar modo selección' : 'Modo selección', title: 'Mientras está activo, pulsar en la hoja marca o desmarca la tarjeta o el compás pulsado.' };
      case 'clearMarked': return { ...base, label: 'Quitar selección', disabled: !state.marked.length && !state.markedCards.length };
      case 'renumberNow': return { ...base, label: 'Renumerar ahora', title: 'Numera en orden las etiquetas numéricas desde la del primer compás numerado.' };
      default: throw new Error(`Acción de compás desconocida: ${id}`);
    }
  }

  return {
    item,
    run: (id) => { const it = item(id); if (!it.disabled) return it.run(); return undefined; },
    renumberEnabled: () => renumberEnabled(song()),
    setRenumber,
    /**
     * Opciones del menú contextual de un compás en la hoja, con un encabezado que nombra los compases afectados. `extraPaste`
     * añade opciones tras las de pegar (pegar tarjetas copiadas en el compás).
     */
    contextItems({ extraPaste = [] } = {}) {
      const ids = targets();
      const heading = ids.length ? phrase(ids).text : 'Sin compás';
      const pick = (...list) => list.map(item);
      return [
        { heading },
        ...pick('insertBefore', 'insertAfter'),
        { separator: true },
        ...pick('copy', 'cut', 'pasteBefore', 'pasteAfter', 'replace'),
        ...extraPaste,
        { separator: true },
        ...pick('duplicate', 'moveUp', 'moveDown', 'swap'),
        { separator: true },
        ...pick('toggleMark', 'clearMarked'),
        { separator: true },
        item('remove'),
      ];
    },
  };
}

const editable = (element) => element instanceof Element && Boolean(element.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'));

/**
 * Atajos de edición fuera de los campos y sin diálogos abiertos: Ctrl+C, Ctrl+X, Ctrl+V (después), Ctrl+Mayús+V (antes),
 * Alt+↑ y Alt+↓ (mover), Supr (borrar, con confirmación) y Esc (quitar la selección múltiple). Copiar, cortar, mover y borrar
 * actúan sobre tarjetas o compases según lo señalado (selectionTarget); pegar usa lo último copiado: compases junto a la
 * selección, o tarjetas junto a la tarjeta activa (o al final del compás si lo señalado es el compás). Ctrl+Z y Ctrl+Y los
 * atiende el historial. Si hay texto seleccionado en la página, Ctrl+C y Ctrl+X conservan su comportamiento normal.
 */
export function mountEditShortcuts(store, { measures, cards, clipboard }) {
  const CARD_IDS = { moveUp: 'moveBefore', moveDown: 'moveAfter' };
  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.isComposing || editable(event.target) || contextMenuOpen()) return;
    if (document.querySelector('dialog[open]')) return;
    const mod = event.ctrlKey || event.metaKey;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    let id = null;
    if (mod && !event.altKey) {
      const textSelected = String(window.getSelection?.() || '').length > 0;
      if (key === 'c' && !event.shiftKey && !textSelected) id = 'copy';
      else if (key === 'x' && !event.shiftKey && !textSelected) id = 'cut';
      else if (key === 'v') id = event.shiftKey ? 'pasteBefore' : 'pasteAfter';
    } else if (event.altKey && !mod && !event.shiftKey && (key === 'ArrowUp' || key === 'ArrowDown')) {
      id = key === 'ArrowUp' ? 'moveUp' : 'moveDown';
    } else if (!mod && !event.altKey && !event.shiftKey) {
      const { state } = store;
      if (key === 'Delete') id = 'remove';
      else if (key === 'Escape' && (state.marked.length || state.markedCards.length || state.selectMode) && !document.querySelector('.action-menu[open]')) {
        event.preventDefault();
        store.setMarked([]);
        if (state.selectMode) store.setSelectMode(false);
        return;
      }
    }
    if (!id) return;
    const onCards = selectionTarget(store.state) === 'card';
    let actions = onCards ? cards : measures;
    if (id === 'pasteBefore' || id === 'pasteAfter') {
      actions = clipboard.last === 'cards' ? cards : measures;
      if (actions === cards && !onCards) id = id === 'pasteBefore' ? 'pasteStart' : 'pasteEnd';
    } else if (onCards) id = CARD_IDS[id] || id;
    if (actions.item(id).disabled) return;
    event.preventDefault();
    actions.run(id);
  });
}
