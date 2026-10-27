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
import { formatError } from './model/validate.js';
import { mountWorkspace } from './ui/workspace.js';
import { mountColorsPanel } from './ui/colors.js';
import { mountHistoryControls } from './ui/history.js';
import { loadPaletteDefaults } from './model/paletteDefaults.js';
import { createClipboard } from './ui/clipboard.js';
import { createMeasureActions, mountEditShortcuts } from './ui/measureActions.js';
import { createCardActions } from './ui/cardActions.js';
import { fetchCatalog, fetchExample, mountExamplesMenu } from './ui/examples.js';
import { exampleFileName } from './model/examples.js';

const AUTOSAVE_MS = 800;

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

  // Los colores predeterminados vienen de config/palette-defaults.json: sin ellos no se dibuja nada con sentido, así que se explica el motivo.
  try {
    await loadPaletteDefaults();
  } catch (error) {
    const notice = document.getElementById('aviso-carga');
    notice.textContent = error.message;
    notice.hidden = false;
    return;
  }

  // Se arranca con el ejemplo inicial del catálogo (examples/index.json), que también alimenta el menú Ejemplos.
  let catalog, opened;
  try {
    catalog = await fetchCatalog();
    opened = await fetchExample(catalog.default);
  } catch (error) {
    const notice = document.getElementById('aviso-carga');
    notice.textContent = `No se pudo cargar el ejemplo inicial (${error.message}). Abre la aplicación desde un servidor local, no con file://. Consulta el README.`;
    notice.hidden = false;
    return;
  }
  if (!opened.ok) {
    const notice = document.getElementById('aviso-carga');
    notice.replaceChildren(h('strong', null, `El ejemplo ${catalog.default} no es válido: `), opened.errors.map(formatError).join(' · '));
    notice.hidden = false;
    return;
  }

  const store = createStore(opened.song, { fileName: exampleFileName(catalog.default) });
  const recovery = createRecovery();

  const clipboard = createClipboard();
  const measureActions = createMeasureActions(store, clipboard);
  const cardActions = createCardActions(store, clipboard);

  const songPanel = mountSongPanel(document.getElementById('panel-cancion'), store);
  mountMeasuresPanel(document.getElementById('panel-compases'), store, { actions: measureActions, clipboard });
  mountChordPanel(document.getElementById('panel-acorde'), store, { clipboard, cardActions });
  const marksPanel = mountMarksPanel(document.getElementById('panel-marcas'), store);
  mountColorsPanel(document.getElementById('panel-colors'), store);
  const paginator = mountPreviewPanel(document.getElementById('panel-vista'), store, { measureActions, cardActions });
  mountExportControls(store, paginator);
  mountStatus(store);
  const fileControls = mountFileControls(store, { recovery });
  mountExamplesMenu(store, { catalog, confirmDiscard: fileControls.confirmDiscard, recovery });
  mountAutosave(store, recovery, (ok) => songPanel.setRecoveryHint(ok));
  mountWorkspace(store, { marksPanel });
  mountHistoryControls(store);
  mountEditShortcuts(store, { measures: measureActions, cards: cardActions, clipboard });

  await offerRecovery(store, recovery);
}

boot();
