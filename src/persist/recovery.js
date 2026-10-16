import { serializeSong } from '../model/serialize.js';

const KEY = 'compas-a-compas:recuperacion:v1';

/**
 * Copia de recuperación en localStorage. Es una red de seguridad, no un guardado:
 * si el almacenamiento no está disponible o falla, la aplicación sigue funcionando.
 */
export function createRecovery(getStorage = () => globalThis.localStorage) {
  const attempt = (fn) => {
    try {
      const storage = getStorage();
      return storage ? fn(storage) : null;
    } catch {
      return null;
    }
  };

  return {
    save(song, now = new Date()) {
      return attempt((st) => {
        st.setItem(KEY, JSON.stringify({ savedAt: now.toISOString(), json: serializeSong(song) }));
        return true;
      }) === true;
    },
    /** { savedAt, json } o null. No valida: quien la usa debe pasar json por parseSongJson. */
    load() {
      const raw = attempt((st) => st.getItem(KEY));
      if (!raw) return null;
      try {
        const data = JSON.parse(raw);
        return data && typeof data.json === 'string' ? { savedAt: String(data.savedAt || ''), json: data.json } : null;
      } catch {
        return null;
      }
    },
    clear() {
      return attempt((st) => {
        st.removeItem(KEY);
        return true;
      }) === true;
    },
  };
}
