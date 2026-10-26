import { validateSong } from './validate.js';

export function serializeSong(song) {
  return `${JSON.stringify(song, null, 2)}\n`;
}

/** Texto JSON → { ok: true, song, warnings } o { ok: false, errors }. No toca la canción abierta. */
export function parseSongJson(textValue) {
  let data;
  try {
    data = JSON.parse(textValue);
  } catch (error) {
    return { ok: false, errors: [{ path: '(archivo)', message: `no es un JSON válido (${error.message})` }] };
  }
  const { errors, warnings } = validateSong(data);
  if (errors.length) return { ok: false, errors };
  return { ok: true, song: data, warnings };
}

/**
 * Nombre de archivo a partir de un título tal como se escribe, igual que el PDF que propone el navegador al imprimir.
 * Solo se sustituyen por «_» los caracteres que Windows no admite y se quitan espacios y puntos finales.
 */
export function titleFileName(title, extension, fallback) {
  const base = String(title || '')
    .replace(/[\u0000-\u001f\u007f\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '');
  return `${base || fallback}.${extension}`;
}

/** Nombre propuesto al guardar una canción que no viene de un archivo. */
export function suggestFileName(song) {
  return titleFileName(song.title, 'json', 'cancion');
}
