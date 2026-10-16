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

export function suggestFileName(song) {
  const slug = String(song.title || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'cancion'}.json`;
}
