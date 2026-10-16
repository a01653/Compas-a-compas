import { createSheetContext } from '../render/sheet.js';
import { createMeasurer } from '../layout/measurer.js';
import { computeLayout } from '../layout/compute.js';
import { ensureFonts, songSample } from '../layout/fonts.js';

/** Ámbitos del estado que no cambian el contenido de las hojas: no se vuelve a medir ni a repartir. */
const SKIP = new Set(['selection', 'zoom', 'status']);

/**
 * Paginación asíncrona de la canción. Cada cambio de contenido invalida la anterior (`generation`);
 * solo el resultado de la última generación llega a la vista previa. `settled()` espera a la última
 * y `isCurrent(result)` permite comprobar, justo antes de exportar, que nadie ha editado mientras tanto.
 *
 * El resultado lleva una copia (`snapshot`) de la canción medida: la exportación dibuja de ese snapshot,
 * nunca de un estado que haya podido cambiar después de medir.
 */
export function createPaginator(store, { delay = 80, onStart, onResult } = {}) {
  let generation = 0;
  let completed = -1;
  let timer = null;
  let current = null;
  const waiters = new Set();

  const signatureNow = () => JSON.stringify(store.state.song);

  async function run(gen) {
    const signature = signatureNow();
    const snapshot = JSON.parse(signature);
    let result;
    try {
      await ensureFonts(songSample(snapshot));
      if (gen !== generation) return;
      const ctx = createSheetContext(snapshot);
      const measurer = createMeasurer();
      let layout;
      try {
        layout = computeLayout(ctx, measurer);
      } finally {
        measurer.dispose();
      }
      if (gen !== generation) return;
      result = { signature, snapshot, ctx, layout, error: null };
    } catch (error) {
      if (gen !== generation) return;
      result = { signature, snapshot, ctx: null, layout: null, error };
    }
    current = result;
    completed = gen;
    if (onResult) onResult(result);
    for (const wake of [...waiters]) wake();
  }

  function schedule(wait = delay) {
    generation += 1;
    clearTimeout(timer);
    if (onStart) onStart();
    const gen = generation;
    timer = setTimeout(() => run(gen), wait);
  }

  store.subscribe((state, scope) => {
    if (!SKIP.has(scope)) schedule();
  });
  // Si un subconjunto de fuente termina de cargar después de medir, las medidas pudieron quedar viejas.
  if (document.fonts && document.fonts.addEventListener) {
    document.fonts.addEventListener('loadingdone', () => schedule(0));
  }
  schedule(0);

  return {
    /** Resuelve con el resultado de la última paginación cuando no queda ninguna pendiente. */
    settled() {
      return new Promise((resolve) => {
        const wake = () => {
          if (completed !== generation) return;
          waiters.delete(wake);
          resolve(current);
        };
        waiters.add(wake);
        wake();
      });
    },
    /** ¿Este resultado sigue siendo exactamente la canción actual, sin paginación pendiente? */
    isCurrent(result) {
      return Boolean(result) && result === current && completed === generation && result.signature === signatureNow();
    },
  };
}
