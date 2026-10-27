/**
 * Catálogo de ejemplos (examples/index.json). Una web estática no puede listar una carpeta, así que el catálogo
 * enumera los archivos y su nombre visible; una prueba comprueba que coincide con los JSON de examples/.
 */
export const EXAMPLES_DIR = 'examples/';
export const CATALOG_URL = `${EXAMPLES_DIR}index.json`;

const isFile = (value) => typeof value === 'string' && /^[\w-]+(\/[\w-]+)*\.json$/.test(value);

/** Datos del catálogo → { ok: true, catalog: { default, examples } } o { ok: false, error }. */
export function readCatalog(data) {
  const fail = (error) => ({ ok: false, error });
  if (!data || typeof data !== 'object' || !Array.isArray(data.examples)) return fail('falta la lista «examples»');
  const examples = [];
  for (const [index, entry] of data.examples.entries()) {
    if (!entry || !isFile(entry.file)) return fail(`la entrada ${index + 1} no tiene un archivo .json válido`);
    if (typeof entry.title !== 'string' || !entry.title.trim()) return fail(`la entrada ${index + 1} no tiene título`);
    if (examples.some((e) => e.file === entry.file)) return fail(`${entry.file} aparece dos veces`);
    examples.push({ file: entry.file, title: entry.title.trim() });
  }
  if (!examples.length) return fail('no hay ejemplos');
  const fallback = examples[0].file;
  const chosen = data.default === undefined ? fallback : data.default;
  if (!examples.some((e) => e.file === chosen)) return fail(`el ejemplo inicial ${chosen} no está en la lista`);
  return { ok: true, catalog: { default: chosen, examples } };
}

export const exampleUrl = (file) => `${EXAMPLES_DIR}${file}`;

/** Nombre con el que queda abierto el ejemplo: el del archivo, como al abrirlo desde el disco. */
export const exampleFileName = (file) => file.split('/').pop();
