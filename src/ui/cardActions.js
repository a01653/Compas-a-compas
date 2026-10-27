import { findMeasure, leaveRepeat, repeatPairOf } from '../model/song.js';
import {
  canMoveCard, canReplaceCards, canReplaceFingerings, canSwapCards, cardSelection, copyCards, duplicateCards, moveCard, pasteCards,
  removeCards, replaceCards, replaceFingerings, selectionKey, songCards, swapCards,
} from '../model/cards.js';
import { selectionTarget, targetCardKeys } from '../store.js';
import { confirmDialog } from './dialog.js';
import { notify } from './notify.js';
import { undoNotice } from './measureActions.js';

/** Atajos de tarjeta: los mismos que los de compás cuando lo último señalado es una tarjeta (ver mountEditShortcuts). */
export const CARD_SHORTCUTS = {
  copy: 'Ctrl+C', cut: 'Ctrl+X', pasteAfter: 'Ctrl+V', pasteBefore: 'Ctrl+Mayús+V', moveBefore: 'Alt+↑', moveAfter: 'Alt+↓', remove: 'Supr',
};

/**
 * Acciones sobre las tarjetas seleccionadas (las marcadas o, si no hay, la activa), aunque estén salteadas o en compases
 * distintos. Las usan el menú de tarjeta del editor, el menú contextual de una tarjeta en la hoja y los atajos. Cada una es un
 * único paso de Deshacer. Pegar inserta en el compás activo, junto a la tarjeta activa.
 */
export function createCardActions(store, clipboard) {
  const song = () => store.state.song;
  const targets = () => targetCardKeys(store.state);
  const cardsOf = (keys) => {
    const wanted = new Set(keys);
    return songCards(song()).filter((card) => wanted.has(card.key));
  };
  const nameOf = (card) => (card.event.chordName?.trim() ? `«${card.event.chordName.trim()}»` : 'sin nombre');

  /** «Tarjeta «C7» del compás 3» o «3 tarjetas de los compases 2 y 4», para concordar con el participio. */
  function phrase(keys) {
    const list = cardsOf(keys);
    const labels = [...new Set(list.map((card) => card.measure.label))];
    const where = labels.length === 1 ? `del compás ${labels[0]}`
      : labels.length <= 4 ? `de los compases ${labels.slice(0, -1).join(', ')} y ${labels.at(-1)}` : `de ${labels.length} compases`;
    if (list.length === 1) return { text: `Tarjeta ${nameOf(list[0])} ${where}`, plural: false, where };
    return { text: `${list.length} tarjetas ${where}`, plural: true, where };
  }
  const done = (keys, singular, plural) => {
    const p = phrase(keys);
    return `${p.text} ${p.plural ? plural : singular}.`;
  };

  /** Tras una operación: la primera tarjeta resultante pasa a ser la activa; si son varias, quedan marcadas. */
  function commitCards(selections, fallback = null) {
    const keys = selections.map(selectionKey);
    store.commit('structure', selections[0] || fallback, { markedCards: keys.length > 1 ? keys : [], kind: 'card' });
  }

  function copy() {
    const keys = targets();
    if (!keys.length) return;
    clipboard.setCards(copyCards(song(), keys));
    const one = keys.length === 1;
    notify(`${done(keys, 'copiada', 'copiadas')} ${one ? 'Pégala' : 'Pégalas'} con Ctrl+V tras otra tarjeta, o ${one ? 'úsala' : 'úsalas'} para sustituir tarjetas o digitaciones.`);
  }

  function cut() {
    const keys = targets();
    if (!keys.length) return;
    store.endEdit();
    const text = done(keys, 'cortada', 'cortadas');
    clipboard.setCards(copyCards(song(), keys));
    const { measureId, next } = removeCards(song(), keys);
    commitCards(next ? [{ measureId, ...next }] : [], { measureId });
    notify(`${text} ${keys.length === 1 ? 'Pégala' : 'Pégalas'} con Ctrl+V donde quieras.`, { action: undoNotice(store) });
  }

  /** `anchored`: junto a la tarjeta activa; si no, al principio o al final del compás activo. Sale antes de un compás de repetición. */
  function paste(side, anchored = true) {
    const payloads = clipboard.cards;
    const measure = findMeasure(song(), store.state.selection.measureId);
    if (!payloads || !measure) return;
    store.endEdit();
    const wasPair = Boolean(repeatPairOf(song(), measure.id));
    const leaving = leaveRepeat(song(), measure.id);
    const sel = store.state.selection;
    const anchor = anchored && !leaving && sel.eventId ? { eventId: sel.eventId, voicingId: sel.voicingId } : null;
    const created = pasteCards(song(), measure.id, anchor, payloads, side);
    commitCards(created);
    const parts = [];
    if (leaving) parts.push(wasPair ? 'Se quitó la repetición de dos compases (ambos compases quedan editables) para pegar.' : 'Se quitó la repetición del compás anterior para pegar.');
    parts.push(created.length === 1 ? `Tarjeta pegada en el compás ${measure.label}.` : `${created.length} tarjetas pegadas en el compás ${measure.label}.`);
    notify(parts.join(' '), { action: undoNotice(store) });
  }

  function replace() {
    const payloads = clipboard.cards;
    const keys = targets();
    if (!canReplaceCards(keys.length, payloads)) return;
    store.endEdit();
    const text = done(keys, 'sustituida', 'sustituidas').replace(/\.$/, ` por ${payloads.length > 1 ? 'las copiadas' : 'la copiada'}.`);
    commitCards(replaceCards(song(), keys, payloads));
    notify(`${text} Nombre, calidad, textos, grado, tonalidad y digitación son ahora los copiados.`, { action: undoNotice(store) });
  }

  function fingering() {
    const payloads = clipboard.cards;
    const keys = targets();
    if (!canReplaceFingerings(keys.length, payloads)) return;
    store.endEdit();
    const p = phrase(keys);
    const where = p.plural ? `${keys.length} tarjetas ${p.where}` : `la tarjeta ${nameOf(cardsOf(keys)[0])} ${p.where}`;
    commitCards(replaceFingerings(song(), keys, payloads));
    notify(`Digitación sustituida en ${where}. Nombre, textos y tonalidad se conservan.`, { action: undoNotice(store) });
  }

  function duplicate() {
    const keys = targets();
    if (!keys.length) return;
    store.endEdit();
    const created = duplicateCards(song(), keys);
    commitCards(created);
    if (created.length > 1) notify(`${created.length} tarjetas duplicadas: en cada compás, las copias van tras la última tarjeta seleccionada.`);
  }

  /** Solo una tarjeta a la vez, dentro de su compás. */
  function movable(delta) {
    const keys = targets();
    if (keys.length !== 1) return null;
    const sel = cardSelection(song(), keys[0]);
    return sel && canMoveCard(findMeasure(song(), sel.measureId), sel.eventId, sel.voicingId, delta) ? sel : null;
  }
  function move(delta) {
    const sel = movable(delta);
    if (!sel) return;
    store.endEdit();
    const moved = moveCard(song(), sel.measureId, sel.eventId, sel.voicingId, delta);
    if (moved) store.commit('structure', { measureId: sel.measureId, ...moved }, { kind: 'card' });
  }

  /** Solo con dos tarjetas seleccionadas: cada una pasa al sitio de la otra. Quedan marcadas para poder deshacerlo a mano. */
  function swap() {
    const keys = targets();
    if (!canSwapCards(song(), keys)) return;
    store.endEdit();
    const [a, b] = cardsOf(keys);
    const where = (card) => `${nameOf(card)} (compás ${card.measure.label})`;
    const text = `Tarjetas ${where(a)} y ${where(b)} intercambiadas.`;
    commitCards(swapCards(song(), keys));
    notify(text, { action: undoNotice(store) });
  }

  async function remove() {
    const keys = targets();
    if (!keys.length) return;
    const list = cardsOf(keys);
    const one = list.length === 1;
    const choice = await confirmDialog({
      title: one ? `¿Quitar la tarjeta ${nameOf(list[0])}?` : `¿Quitar ${list.length} tarjetas?`,
      intro: one ? 'Se elimina solo esta tarjeta.' : `Se eliminan las ${list.length} tarjetas seleccionadas ${phrase(keys).where}; las demás no cambian. Puedes recuperarlas con Deshacer.`,
      actions: [{ label: 'Cancelar', value: 'cancel' }, { label: one ? 'Quitar tarjeta' : 'Quitar tarjetas', value: 'remove', kind: 'danger' }],
    });
    if (choice !== 'remove') return;
    store.endEdit();
    const text = done(keys, 'quitada', 'quitadas');
    const { measureId, next } = removeCards(song(), keys);
    commitCards(next ? [{ measureId, ...next }] : [], { measureId });
    notify(text, { action: undoNotice(store) });
  }

  function toggleMark() {
    const sel = store.state.selection;
    if (sel.eventId) store.toggleMarkedCard(sel, { withActive: false });
  }

  const runners = {
    copy, cut, replace, fingering, duplicate, swap, remove, toggleMark,
    pasteBefore: () => paste('before'),
    pasteAfter: () => paste('after'),
    pasteStart: () => paste('before', false),
    pasteEnd: () => paste('after', false),
    moveBefore: () => move(-1),
    moveAfter: () => move(1),
    clearMarked: () => store.setMarked([]),
  };

  /** Etiqueta, atajo y disponibilidad de cada acción para el estado actual. Los atajos solo se muestran donde se aplican. */
  function item(id) {
    const state = store.state;
    const keys = targetCardKeys(state);
    const n = keys.length;
    const payloads = clipboard.cards;
    const copied = payloads?.length || 0;
    const onCards = selectionTarget(state) === 'card';
    const pasting = clipboard.last === 'cards';
    const hint = id === 'pasteBefore' || id === 'pasteAfter' ? (pasting && onCards ? CARD_SHORTCUTS[id] : null)
      : id === 'pasteEnd' || id === 'pasteStart' ? (pasting && !onCards ? CARD_SHORTCUTS[id === 'pasteEnd' ? 'pasteAfter' : 'pasteBefore'] : null)
        : onCards ? CARD_SHORTCUTS[id] || null : null;
    const base = { id, hint, run: runners[id] };
    const some = (singular, plural) => (n > 1 ? plural : singular);
    const pasted = copied > 1 ? `${copied} tarjetas` : 'tarjeta';
    const noMeasure = !state.selection.measureId;
    const noPaste = 'Copia antes una o varias tarjetas.';
    switch (id) {
      case 'copy': return { ...base, label: some('Copiar tarjeta', `Copiar ${n} tarjetas`), disabled: !n };
      case 'cut': return { ...base, label: some('Cortar tarjeta', `Cortar ${n} tarjetas`), disabled: !n };
      case 'pasteBefore': return { ...base, label: `Pegar ${pasted} antes`, disabled: !copied || noMeasure, title: copied ? 'Inserta lo copiado, como tarjetas nuevas, delante de la tarjeta seleccionada.' : noPaste };
      case 'pasteAfter': return { ...base, label: `Pegar ${pasted} después`, disabled: !copied || noMeasure, title: copied ? 'Inserta lo copiado, como tarjetas nuevas, después de la tarjeta seleccionada.' : noPaste };
      case 'pasteStart': return { ...base, label: `Pegar ${pasted} al principio del compás`, disabled: !copied || noMeasure, title: copied ? 'Añade lo copiado, como tarjetas nuevas, al principio de este compás.' : noPaste };
      case 'pasteEnd': return { ...base, label: `Pegar ${pasted} al final del compás`, disabled: !copied || noMeasure, title: copied ? 'Añade lo copiado, como tarjetas nuevas, al final de este compás.' : noPaste };
      case 'replace': {
        const ok = canReplaceCards(n, payloads);
        return {
          ...base, label: some('Sustituir tarjeta por la copiada', `Sustituir ${n} tarjetas por lo copiado`), disabled: !ok,
          title: !copied ? 'Copia antes la tarjeta que quieres usar.'
            : ok ? 'Cambia la tarjeta entera: nombre, calidad, textos, grado, tonalidad y digitación. Conserva su sitio en el compás.'
              : `Has copiado ${copied} tarjetas: selecciona otras tantas, o copia una sola para aplicarla a todas.`,
        };
      }
      case 'fingering': {
        const ok = canReplaceFingerings(n, payloads);
        return {
          ...base, label: some('Sustituir digitación por la copiada', `Sustituir digitación de ${n} tarjetas`), disabled: !ok,
          title: !copied ? 'Copia antes la tarjeta cuya digitación quieres usar.'
            : ok ? 'Cambia trastes, grados por cuerda y traste de referencia. Nombre, calidad, textos, grado y tonalidad se conservan.'
              : payloads.some((p) => !p.voicing) ? 'Alguna tarjeta copiada no tiene digitación.'
                : `Has copiado ${copied} tarjetas: selecciona otras tantas, o copia una sola para aplicarla a todas.`,
        };
      }
      case 'duplicate': return { ...base, label: some('Duplicar tarjeta', `Duplicar ${n} tarjetas`), disabled: !n };
      // Solo aparece con exactamente dos tarjetas seleccionadas (hidden); con otra cantidad no tiene sentido.
      case 'swap': return {
        ...base, label: 'Intercambiar las dos tarjetas', disabled: !canSwapCards(state.song, keys), hidden: n !== 2,
        title: 'Cada tarjeta pasa al sitio de la otra, con su nombre, calidad, textos, grado, tonalidad y digitación. Sirve entre compases distintos.',
      };
      case 'moveBefore':
      case 'moveAfter': {
        const delta = id === 'moveBefore' ? -1 : 1;
        return {
          ...base, label: delta < 0 ? 'Mover tarjeta antes' : 'Mover tarjeta después', disabled: !movable(delta),
          title: n > 1 ? 'Para mover, selecciona una sola tarjeta.' : 'Cambia el orden de las tarjetas del compás.',
        };
      }
      case 'toggleMark': {
        const on = state.markedCards.includes(state.selection.eventId ? selectionKey(state.selection) : null);
        return {
          ...base, label: on ? 'Quitar tarjeta de la selección' : 'Añadir tarjeta a la selección', disabled: !state.selection.eventId,
          title: 'Marca o desmarca la tarjeta activa para actuar sobre varias a la vez. En la hoja: Ctrl+clic sobre la tarjeta.',
        };
      }
      case 'clearMarked': return { ...base, label: 'Quitar selección', disabled: !state.markedCards.length };
      case 'remove': return { ...base, label: some('Quitar tarjeta', `Quitar ${n} tarjetas`), disabled: !n, danger: true };
      default: throw new Error(`Acción de tarjeta desconocida: ${id}`);
    }
  }

  return {
    item,
    run: (id) => { const it = item(id); if (!it.disabled) return it.run(); return undefined; },
    /** Opciones del menú contextual de una tarjeta en la hoja, con un encabezado que nombra las tarjetas afectadas. */
    contextItems() {
      const keys = targets();
      const pick = (...list) => list.map(item).filter((it) => !it.hidden);
      return [
        { heading: keys.length ? phrase(keys).text : 'Sin tarjeta' },
        ...pick('copy', 'cut', 'pasteBefore', 'pasteAfter'),
        { separator: true },
        ...pick('replace', 'fingering'),
        { separator: true },
        ...pick('swap', 'duplicate', 'moveBefore', 'moveAfter'),
        { separator: true },
        ...pick('toggleMark', 'clearMarked'),
        { separator: true },
        item('remove'),
      ];
    },
  };
}
