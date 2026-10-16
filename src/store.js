/**
 * Único estado editable: la canción y la selección. Los paneles se derivan de él.
 *
 * Ámbitos de emit(scope), para que cada panel decida si debe reconstruirse:
 *  - 'text'      edición de un campo de texto: la vista previa se actualiza, los editores NO se reconstruyen.
 *  - 'structure' alta, baja o reordenación: se reconstruye todo lo derivado.
 *  - 'document'  se ha sustituido la canción (nuevo, abrir, recuperar).
 *  - 'selection', 'zoom', 'status'.
 */
export function createStore(song, { fileName = null } = {}) {
  const listeners = new Set();
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

  const store = {
    state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    emit(scope) {
      if (scope !== 'selection' && scope !== 'zoom' && scope !== 'status') {
        state.dirty = JSON.stringify(state.song) !== state.savedSnapshot;
      }
      if (scope === 'structure' || scope === 'document') normalizeSelection();
      listeners.forEach((fn) => fn(state, scope));
    },
    /** Aplica una selección parcial y emite. Úsalo tras alta/baja/movimiento. */
    commit(scope, selection) {
      if (selection) state.selection = { measureId: null, eventId: null, voicingId: null, ...selection };
      store.emit(scope);
    },
    select(selection) {
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
      state.song = newSong;
      state.fileName = name;
      state.savedSnapshot = dirty ? '' : JSON.stringify(newSong);
      state.selection = { measureId: null, eventId: null, voicingId: null };
      store.emit('document');
    },
    markSaved(name) {
      state.savedSnapshot = JSON.stringify(state.song);
      if (name !== undefined) state.fileName = name;
      state.dirty = false;
      listeners.forEach((fn) => fn(state, 'status'));
    },
  };

  normalizeSelection();
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
