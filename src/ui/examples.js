import { CATALOG_URL, exampleFileName, exampleUrl, readCatalog } from '../model/examples.js';
import { parseSongJson } from '../model/serialize.js';
import { formatError } from '../model/validate.js';
import { h } from '../render/dom.js';
import { errorDialog } from './dialog.js';
import { notify } from './notify.js';

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

/** Catálogo validado. Lanza un error con la ruta si no se puede leer. */
export async function fetchCatalog() {
  let data;
  try {
    data = JSON.parse(await fetchText(CATALOG_URL));
  } catch (error) {
    throw new Error(error instanceof SyntaxError ? `${CATALOG_URL}: no es un JSON válido` : error.message);
  }
  const result = readCatalog(data);
  if (!result.ok) throw new Error(`${CATALOG_URL}: ${result.error}`);
  return result.catalog;
}

/** Resultado de parseSongJson para el ejemplo. Los fallos de red se lanzan. */
export async function fetchExample(file) {
  return parseSongJson(await fetchText(exampleUrl(file)));
}

/** Menú «Ejemplos» de la cabecera: sustituye la canción abierta, con la misma confirmación que Abrir. */
export function mountExamplesMenu(store, { catalog, confirmDiscard, recovery }) {
  async function open(entry) {
    if (!(await confirmDiscard())) return;
    let result;
    try {
      result = await fetchExample(entry.file);
    } catch (error) {
      result = { ok: false, errors: [{ path: entry.file, message: `no se pudo descargar (${error.message})` }] };
    }
    if (!result.ok) {
      await errorDialog({
        title: `No se abrió el ejemplo «${entry.title}»`,
        intro: 'La canción que tenías abierta no ha cambiado. Problemas encontrados:',
        errors: result.errors.map(formatError),
      });
      return;
    }
    store.replaceSong(result.song, { fileName: exampleFileName(entry.file) });
    recovery.clear();
    notify(`Abierto el ejemplo «${entry.title}».`);
  }

  document.getElementById('examples-list').replaceChildren(...catalog.examples.map((entry) => h('button', {
    type: 'button', class: 'btn menu-action', title: entry.file, onclick: () => open(entry),
  }, entry.title)));
}
