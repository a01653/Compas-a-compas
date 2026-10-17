import { createStore } from './store.js';
import { createRecovery } from './persist/recovery.js';
import { parseSongJson } from './model/serialize.js';
import { mountSongPanel } from './ui/song.js';
import { mountMeasuresPanel } from './ui/measures.js';
import { mountChordPanel } from './ui/chord.js';
import { mountMarksPanel } from './ui/marks.js';
import { mountPreviewPanel } from './ui/preview.js';
import { mountDisabledActions } from './ui/disabled.js';
import { mountExportControls } from './ui/exporter.js';
import { mountFileControls } from './ui/file.js';
import { confirmDialog } from './ui/dialog.js';
import { notify } from './ui/notify.js';
import { h } from './render/dom.js';
import { validateSong, formatError } from './model/validate.js';
import { mountWorkspace } from './ui/workspace.js';
import { mountColorsPanel } from './ui/colors.js';

const DEMO_URL = 'examples/cancion-demo.json';
const AUTOSAVE_MS = 800;

async function loadDemo() {
  const response = await fetch(DEMO_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function mountStatus(store) {
  const el = document.getElementById('estado-archivo');
  const render = (state) => {
    el.textContent = `${state.fileName || 'Sin archivo'} · ${state.dirty ? 'cambios sin guardar' : 'sin cambios'}`;
    el.classList.toggle('dirty', state.dirty);
  };
  render(store.state);
  store.subscribe((state, scope) => { if (scope !== 'zoom' && scope !== 'selection') render(state); });
}

/** Copia de recuperación: se escribe tras cada cambio pendiente y se borra al quedar guardado. */
function mountAutosave(store, recovery, onResult) {
  let timer = null;
  store.subscribe((state, scope) => {
    if (scope === 'zoom' || scope === 'selection') return;
    clearTimeout(timer);
    if (!state.dirty) {
      recovery.clear();
      return;
    }
    timer = setTimeout(() => onResult(recovery.save(state.song)), AUTOSAVE_MS);
  });
}

async function offerRecovery(store, recovery) {
  const saved = recovery.load();
  if (!saved) return;
  const parsed = parseSongJson(saved.json);
  if (!parsed.ok) {
    recovery.clear();
    return;
  }
  const when = saved.savedAt ? new Date(saved.savedAt).toLocaleString('es-ES') : 'una sesión anterior';
  const choice = await confirmDialog({
    title: 'Copia de recuperación encontrada',
    intro: `Este navegador guardó una copia automática de «${parsed.song.title || 'canción sin título'}» (${when}), con cambios que no se guardaron como archivo. ¿Recuperarla?`,
    actions: [
      { label: 'Descartar copia', value: 'discard', kind: 'danger' },
      { label: 'Recuperar', value: 'recover', kind: 'primary' },
    ],
  });
  if (choice === 'recover') {
    store.replaceSong(parsed.song, { dirty: true });
    notify('Copia recuperada. Usa «Guardar JSON» para conservarla como archivo.');
  } else if (choice === 'discard') {
    recovery.clear();
  }
}

async function boot() {
  mountDisabledActions();

  let song;
  try {
    song = await loadDemo();
  } catch (error) {
    const notice = document.getElementById('aviso-carga');
    notice.textContent = `No se pudo cargar ${DEMO_URL} (${error.message}). Abre la aplicación desde un servidor local, no con file://. Consulta el README.`;
    notice.hidden = false;
    return;
  }
  const { errors } = validateSong(song);
  if (errors.length) {
    const notice = document.getElementById('aviso-carga');
    notice.replaceChildren(h('strong', null, 'El ejemplo no es válido: '), errors.map(formatError).join(' · '));
    notice.hidden = false;
    return;
  }

  const store = createStore(song, { fileName: 'cancion-demo.json' });
  const recovery = createRecovery();

  const songPanel = mountSongPanel(document.getElementById('panel-cancion'), store);
  mountMeasuresPanel(document.getElementById('panel-compases'), store);
  mountChordPanel(document.getElementById('panel-acorde'), store);
  const marksPanel = mountMarksPanel(document.getElementById('panel-marcas'), store);
  mountColorsPanel(document.getElementById('panel-colors'), store);
  const paginator = mountPreviewPanel(document.getElementById('panel-vista'), store);
  mountExportControls(store, paginator);
  mountStatus(store);
  mountFileControls(store, { recovery });
  mountAutosave(store, recovery, (ok) => songPanel.setRecoveryHint(ok));
  mountWorkspace(store, { marksPanel });

  await offerRecovery(store, recovery);
}

boot();
