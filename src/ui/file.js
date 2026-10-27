import { createStarterSong } from '../model/song.js';
import { parseSongJson, serializeSong, suggestFileName } from '../model/serialize.js';
import { validateSong, formatError } from '../model/validate.js';
import { confirmDialog, errorDialog } from './dialog.js';
import { notify } from './notify.js';

const JSON_TYPE = { description: 'Canción Compás a compás (JSON)', accept: { 'application/json': ['.json'] } };

/** Escribe el archivo. Devuelve el nombre usado, o null si el usuario cancela. */
async function writeFile(text, suggestedName) {
  if (typeof window.showSaveFilePicker === 'function') {
    try {
      const handle = await window.showSaveFilePicker({ suggestedName, types: [JSON_TYPE] });
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return handle.name;
    } catch (error) {
      if (error && error.name === 'AbortError') return null;
      throw error;
    }
  }
  // Alternativa: descarga normal. El navegador no confirma si el usuario llegó a guardarla.
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = suggestedName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return suggestedName;
}

export function mountFileControls(store, { recovery, recoveryHint }) {
  const picker = document.getElementById('archivo-json');

  /** Guarda el JSON. Devuelve true si quedó guardado. */
  async function save() {
    const { song } = store.state;
    const { errors, warnings } = validateSong(song);
    if (errors.length) {
      await errorDialog({
        title: 'No se puede guardar todavía',
        intro: 'El archivo guardado no podría volver a abrirse. Corrige estos problemas:',
        errors: errors.map(formatError),
      });
      return false;
    }
    try {
      const name = await writeFile(serializeSong(song), store.state.fileName || suggestFileName(song));
      if (name === null) return false;
      store.markSaved(name);
      recovery.clear();
      notify(warnings.length
        ? `Guardado como ${name}. Hay ${warnings.length} aviso(s) de marcas incompletas; se han conservado.`
        : `Guardado como ${name}.`);
      return true;
    } catch (error) {
      await errorDialog({ title: 'No se pudo guardar', intro: 'La canción sigue abierta y con sus cambios.', errors: [error.message || String(error)] });
      return false;
    }
  }

  /** Antes de sustituir la canción: true si se puede continuar. */
  async function confirmDiscard() {
    if (!store.state.dirty) return true;
    const choice = await confirmDialog({
      title: 'Hay cambios sin guardar',
      intro: 'Si continúas sin guardar, perderás los cambios de la canción actual.',
      actions: [
        { label: 'Cancelar', value: 'cancel' },
        { label: 'Descartar cambios', value: 'discard', kind: 'danger' },
        { label: 'Guardar JSON y continuar', value: 'save', kind: 'primary' },
      ],
    });
    if (choice === 'discard') return true;
    if (choice === 'save') return save();
    return false;
  }

  async function createNew() {
    if (!(await confirmDiscard())) return;
    store.replaceSong(createStarterSong());
    recovery.clear();
    notify('Canción nueva creada.');
  }

  async function openFile() {
    if (!(await confirmDiscard())) return;
    picker.value = '';
    picker.click();
  }

  picker.addEventListener('change', async () => {
    const file = picker.files && picker.files[0];
    if (!file) return;
    let result;
    try {
      result = parseSongJson(await file.text());
    } catch (error) {
      result = { ok: false, errors: [{ path: file.name, message: `no se pudo leer el archivo (${error.message})` }] };
    }
    if (!result.ok) {
      await errorDialog({
        title: `No se abrió ${file.name}`,
        intro: 'La canción que tenías abierta no ha cambiado. Problemas encontrados:',
        errors: result.errors.map(formatError),
      });
      return;
    }
    store.replaceSong(result.song, { fileName: file.name });
    recovery.clear();
    notify(result.warnings.length
      ? `Abierto ${file.name} con ${result.warnings.length} aviso(s) de marcas incompletas. Se conservan; revisa el panel de marcas.`
      : `Abierto ${file.name}.`, { duration: 8000 });
  });

  document.getElementById('btn-nuevo').addEventListener('click', createNew);
  document.getElementById('btn-abrir').addEventListener('click', openFile);
  document.getElementById('btn-guardar').addEventListener('click', save);

  window.addEventListener('beforeunload', (event) => {
    if (!store.state.dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });

  return { save, confirmDiscard };
}
