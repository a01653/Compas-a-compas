/**
 * Único estado editable: la canción y la selección. Los paneles se derivan de él.
 *
 * Ámbitos de emit(scope), para que cada panel decida si debe reconstruirse:
 *  - 'text'      edición de un campo de texto: la vista previa se actualiza, los editores NO se reconstruyen.
 *  - 'structure' alta, baja o reordenación: se reconstruye todo lo derivado.
 *  - 'document'  se ha sustituido la canción (nuevo, abrir, recuperar).
 *  - 'history'   deshacer o rehacer: refresca los campos y la vista previa.
 *  - 'selection', 'zoom', 'status'.
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
    /** Aplica una selección parcial y emite. Úsalo tras alta/baja/movimiento. */
    commit(scope, selection) {
      if (selection) state.selection = { measureId: null, eventId: null, voicingId: null, ...selection };
      store.emit(scope);
    },
    select(selection) {
      endEdit();
      state.selection = { measureId: null, eventId: null, voicingId: null, ...selection };
      normalizeSelection();
      store.emit('selection');
    },
    selectMeasure(measureId) {
      store.select({ measureId });
    },
    selectEvent(eventId) {
      store.select({ measureId: state.selection.measureId, eventId });
    },
    selectVoicing(voicingId) {
      store.select({ measureId: state.selection.measureId, eventId: state.selection.eventId, voicingId });
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
