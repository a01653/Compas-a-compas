/**
 * Portapapeles de la sesión, con un hueco para compases y otro para tarjetas: copiar tarjetas no borra los compases copiados.
 * `last` dice cuál se llenó por última vez, que es lo que pega Ctrl+V. No se escribe en la canción ni en el historial y se
 * conserva al abrir otra canción, para copiar entre canciones.
 * Compases: { measures, cut, documentId }; `cut` y `documentId` permiten que pegar lo cortado en la misma canción conserve IDs.
 * Tarjetas: lista de copyCard en orden escrito.
 */
export function createClipboard() {
  const listeners = new Set();
  const slots = { measures: null, cards: null };
  let last = null;
  const changed = () => listeners.forEach((fn) => fn(slots));
  return {
    get measures() { return slots.measures; },
    get cards() { return slots.cards; },
    get last() { return last; },
    setMeasures(payload) { slots.measures = payload; last = 'measures'; changed(); },
    setCards(payloads) { slots.cards = payloads?.length ? payloads : null; last = 'cards'; changed(); },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
