import { cardSelection, selectionKey, songCards } from './model/cards.js';

/**
 * Único estado editable: la canción y la selección. Los paneles se derivan de él.
 *
 * Ámbitos de emit(scope), para que cada panel decida si debe reconstruirse:
 *  - 'text'      edición de un campo de texto: la vista previa se actualiza, los editores NO se reconstruyen.
 *  - 'structure' alta, baja o reordenación: se reconstruye todo lo derivado.
 *  - 'document'  se ha sustituido la canción (nuevo, abrir, recuperar).
 *  - 'history'   deshacer o rehacer: refresca los campos y la vista previa.
 *  - 'selection', 'zoom', 'status'.
 *
 * Además de la selección activa (`selection`), `marked` guarda la selección múltiple de compases y `markedCards` la de
 * tarjetas (claves de selectionKey), ambas en orden escrito y nunca a la vez: marcar una tarjeta quita los compases marcados y
 * al revés. `selectionKind` ('measure' o 'card') recuerda qué se señaló por última vez, para que Ctrl+C, Supr o el menú contextual
 * actúen sobre el compás o sobre la tarjeta. `selectMode` hace que pulsar en la hoja marque o desmarque. Nada de esto se escribe
 * en la canción ni crea pasos de historial; `documentId` cambia al sustituir la canción.
 */
export function createStore(song, { fileName = null, historyLimit = 100, historyBudget = 8 * 1024 * 1024 } = {}) {
  const listeners = new Set();
  const past = [], future = [];
  let currentJson = JSON.stringify(song);
  let currentSelection;
  let editGroup = null, lastGroup = null;
  const state = {
    song,
    selection: { measureId: null, eventId: null, voicingId: null },
    marked: [],
    markedCards: [],
    selectionKind: 'measure',
    selectMode: false,
    documentId: 0,
    zoom: 'fit',
    fileName,
    dirty: false,
    savedSnapshot: JSON.stringify(song),
  };

  /** Deja la selección apuntando a objetos que existen. */
  function normalizeSelection() {
    const sel = state.selection;
    const measures = state.song.measures;
    const measure = measures.find((m) => m.id === sel.measureId) || measures[0] || null;
    const event = measure ? measure.chordEvents.find((e) => e.id === sel.eventId) || measure.chordEvents[0] || null : null;
    const voicing = event ? event.voicings.find((v) => v.id === sel.voicingId) || event.voicings[0] || null : null;
    state.selection = {
      measureId: measure ? measure.id : null,
      eventId: event ? event.id : null,
      voicingId: voicing ? voicing.id : null,
    };
    const marked = new Set(state.marked);
    state.marked = measures.filter((m) => marked.has(m.id)).map((m) => m.id);
    if (state.markedCards.length) {
      const keys = new Set(state.markedCards);
      state.markedCards = songCards(state.song).filter((card) => keys.has(card.key)).map((card) => card.key);
    }
  }

  function endEdit() { editGroup = lastGroup = null; }
  function updateHistoryStatus() {
    state.canUndo = past.length > 0;
    state.canRedo = future.length > 0;
  }
  function trimHistory() {
    let size = past.reduce((sum, entry) => sum + 2 * (entry.before.json.length + entry.after.json.length), 0);
    while (past.length > 1 && (past.length > Math.max(1, historyLimit) || size > historyBudget)) {
      const removed = past.shift();
      size -= 2 * (removed.before.json.length + removed.after.json.length);
    }
  }
  function record(scope) {
    const nextJson = JSON.stringify(state.song);
    if (nextJson !== currentJson) {
      const group = scope === 'text' ? editGroup : null;
      const after = { json: nextJson, selection: { ...state.selection } };
      if (group !== null && lastGroup === group && past.length) {
        past[past.length - 1].after = after;
        if (past[past.length - 1].before.json === nextJson) past.pop();
      } else {
        past.push({ before: { json: currentJson, selection: { ...currentSelection } }, after });
      }
      future.length = 0;
      currentJson = nextJson;
      lastGroup = past.length ? group : null;
      trimHistory();
    }
    if (scope !== 'text') endEdit();
    updateHistoryStatus();
  }
  function restore(from, to, side) {
    if (!from.length) return false;
    const entry = from.pop();
    to.push(entry);
    const snapshot = entry[side];
    state.song = JSON.parse(snapshot.json);
    state.selection = { ...snapshot.selection };
    normalizeSelection();
    currentJson = snapshot.json;
    currentSelection = { ...state.selection };
    state.dirty = currentJson !== state.savedSnapshot;
    endEdit(); updateHistoryStatus();
    listeners.forEach(fn => fn(state, 'history'));
    return true;
  }

  const store = {
    state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    emit(scope) {
      if (scope === 'structure' || scope === 'document') normalizeSelection();
      if (!['selection', 'zoom', 'status', 'document'].includes(scope)) record(scope);
      if (scope !== 'selection' && scope !== 'zoom' && scope !== 'status') {
        state.dirty = JSON.stringify(state.song) !== state.savedSnapshot;
      }
      currentSelection = { ...state.selection };
      listeners.forEach((fn) => fn(state, scope));
    },
    /** Agrupa la escritura continua de un campo hasta que pierda el foco. */
    beginEdit() { editGroup = {}; lastGroup = null; },
    endEdit,
    undo() { return restore(past, future, 'before'); },
    redo() { return restore(future, past, 'after'); },
    /**
     * Aplica una selección parcial (y, si se indica, la selección múltiple y el tipo) y emite. Úsalo tras alta/baja/movimiento.
     * Indicar `marked` sin `markedCards` quita las tarjetas marcadas, y al revés: nunca hay de los dos tipos a la vez.
     */
    commit(scope, selection, { marked, markedCards, kind } = {}) {
      if (selection) state.selection = { measureId: null, eventId: null, voicingId: null, ...selection };
      if (marked) {
        state.marked = [...marked];
        if (!markedCards) state.markedCards = [];
      }
      if (markedCards) {
        state.markedCards = [...markedCards];
        if (!marked) state.marked = [];
      }
      if (kind) state.selectionKind = kind;
      store.emit(scope);
    },
    /** `clearMarked` (clic simple en la hoja) deja una única selección; `kind` indica si se señaló un compás o una tarjeta. */
    select(selection, { clearMarked = false, kind = null } = {}) {
      endEdit();
      state.selection = { measureId: null, eventId: null, voicingId: null, ...selection };
      if (clearMarked) state.marked = state.markedCards = [];
      if (kind) state.selectionKind = kind;
      normalizeSelection();
      store.emit('selection');
    },
    /** Sustituye la selección múltiple de compases (y quita la de tarjetas); `active` pasa a ser además el compás activo. */
    setMarked(ids, active = null) {
      endEdit();
      state.marked = [...ids];
      state.markedCards = [];
      if (ids.length) state.selectionKind = 'measure';
      if (active && active !== state.selection.measureId) state.selection = { measureId: active, eventId: null, voicingId: null };
      normalizeSelection();
      store.emit('selection');
    },
    /** Sustituye la selección múltiple de tarjetas (y quita la de compases); `active` ({ measureId, eventId, voicingId }) pasa a ser la tarjeta activa. */
    setMarkedCards(keys, active = null) {
      endEdit();
      state.markedCards = [...keys];
      state.marked = [];
      state.selectionKind = 'card';
      if (active) state.selection = { measureId: null, eventId: null, voicingId: null, ...active };
      normalizeSelection();
      store.emit('selection');
    },
    /**
     * Marca o desmarca un compás. Marcarlo lo hace activo; con `withActive` (Ctrl+clic) una selección vacía incluye antes el
     * compás activo, si lo último señalado fue un compás. Desmarcar el activo pasa el editor al último compás que sigue marcado.
     */
    toggleMarked(measureId, { withActive = false } = {}) {
      const marked = new Set(state.marked);
      if (!marked.size && withActive && state.selectionKind === 'measure' && state.selection.measureId) marked.add(state.selection.measureId);
      let active = null;
      if (marked.has(measureId)) {
        marked.delete(measureId);
        if (measureId === state.selection.measureId) active = [...marked].at(-1) || null;
      } else {
        marked.add(measureId);
        active = measureId;
      }
      store.setMarked([...marked], active);
    },
    /**
     * Marca o desmarca una tarjeta ({ measureId, eventId, voicingId }), con las mismas reglas que toggleMarked: `withActive`
     * incluye la tarjeta activa si lo último señalado fue una tarjeta. Marcar una tarjeta quita los compases marcados.
     */
    toggleMarkedCard(card, { withActive = false } = {}) {
      const key = selectionKey(card);
      const marked = new Set(state.markedCards);
      const activeKey = state.selection.eventId ? selectionKey(state.selection) : null;
      if (!marked.size && withActive && state.selectionKind === 'card' && activeKey) marked.add(activeKey);
      let active = null;
      if (marked.has(key)) {
        marked.delete(key);
        if (key === activeKey) active = cardSelection(state.song, [...marked].at(-1));
      } else {
        marked.add(key);
        active = card;
      }
      store.setMarkedCards([...marked], active);
    },
    /** Mayús+clic en una tarjeta: marca todas las tarjetas, en orden escrito, entre la activa y la indicada. */
    markCardRange(card) {
      const keys = songCards(state.song).map((c) => c.key);
      const b = keys.indexOf(selectionKey(card));
      if (b < 0) return;
      const a = state.selectionKind === 'card' && state.selection.eventId ? keys.indexOf(selectionKey(state.selection)) : -1;
      if (a < 0) return store.setMarkedCards([keys[b]], card);
      store.setMarkedCards(keys.slice(Math.min(a, b), Math.max(a, b) + 1));
    },
    /** Mayús+clic: marca el tramo entre el compás activo y el indicado, ambos incluidos. El activo no cambia. */
    markRange(measureId) {
      const ids = state.song.measures.map((m) => m.id);
      const a = ids.indexOf(state.selection.measureId);
      const b = ids.indexOf(measureId);
      if (b < 0) return;
      if (a < 0) return store.setMarked([measureId], measureId);
      store.setMarked(ids.slice(Math.min(a, b), Math.max(a, b) + 1));
    },
    setSelectMode(on) {
      state.selectMode = Boolean(on);
      store.emit('selection');
    },
    selectMeasure(measureId) {
      store.select({ measureId }, { kind: 'measure' });
    },
    selectEvent(eventId) {
      store.select({ measureId: state.selection.measureId, eventId }, { kind: 'card' });
    },
    selectVoicing(voicingId) {
      store.select({ measureId: state.selection.measureId, eventId: state.selection.eventId, voicingId }, { kind: 'card' });
    },
    setZoom(zoom) {
      state.zoom = zoom;
      store.emit('zoom');
    },
    /** Sustituye la canción (ya validada por quien llama). */
    replaceSong(newSong, { fileName: name = null, dirty = false } = {}) {
      past.length = future.length = 0;
      endEdit(); updateHistoryStatus();
      state.song = newSong;
      currentJson = JSON.stringify(newSong);
      state.fileName = name;
      state.savedSnapshot = dirty ? '' : JSON.stringify(newSong);
      state.selection = { measureId: null, eventId: null, voicingId: null };
      state.marked = state.markedCards = [];
      state.selectionKind = 'measure';
      state.documentId++;
      store.emit('document');
    },
    markSaved(name) {
      endEdit();
      state.savedSnapshot = JSON.stringify(state.song);
      if (name !== undefined) state.fileName = name;
      state.dirty = false;
      listeners.forEach((fn) => fn(state, 'status'));
    },
  };

  normalizeSelection();
  currentSelection = { ...state.selection };
  updateHistoryStatus();
  return store;
}

/** Compases a los que se aplican las acciones de compás: los marcados o, si no hay, el activo. En orden escrito. */
export function targetMeasureIds(state) {
  if (state.marked.length) return [...state.marked];
  return state.selection.measureId ? [state.selection.measureId] : [];
}

/** Sobre qué actúan los atajos y el menú contextual: lo marcado o, sin marcas, lo último señalado ('measure' o 'card'). */
export function selectionTarget(state) {
  if (state.markedCards.length) return 'card';
  if (state.marked.length) return 'measure';
  return state.selectionKind === 'card' && state.selection.eventId ? 'card' : 'measure';
}

/** Tarjetas a las que se aplican las acciones de tarjeta: las marcadas o, si no hay, la activa. Claves en orden escrito. */
export function targetCardKeys(state) {
  if (state.markedCards.length) return [...state.markedCards];
  return state.selection.eventId ? [selectionKey(state.selection)] : [];
}

export function selectedMeasure(state) {
  return state.song.measures.find((m) => m.id === state.selection.measureId) || null;
}

export function selectedEvent(state) {
  const measure = selectedMeasure(state);
  return (measure && measure.chordEvents.find((e) => e.id === state.selection.eventId)) || null;
}

export function selectedVoicing(state) {
  const event = selectedEvent(state);
  return (event && event.voicings.find((v) => v.id === state.selection.voicingId)) || null;
}
