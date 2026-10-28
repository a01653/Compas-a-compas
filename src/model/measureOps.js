import { createIdFactory, listIds } from './ids.js';
import { checkStructure, newInversions, newRepeatWarnings } from './structure.js';
import { findMeasure, fixRepeatPrevious, fixRepeatPreviousTwo, nextLabel, repeatPairOf } from './song.js';

/**
 * Edición estructural de compases sueltos o en bloque: insertar, borrar, mover, intercambiar, copiar, pegar, duplicar y sustituir.
 * Mutan la canción recibida. Las marcas de `structure` siguen a sus compases por ID y nunca se redirigen. En las copias, las
 * repeticiones se rehacen respecto a su nueva posición, como al duplicar. Las etiquetas numéricas se renumeran con runStructural.
 */

const clone = (value) => JSON.parse(JSON.stringify(value));
const NUMERIC = /^\d+$/;

/* ---------- Selección ---------- */

/** IDs de compases existentes, en orden escrito y sin repetidos. */
export function orderedIds(song, ids) {
  const wanted = new Set(ids);
  return song.measures.filter((m) => wanted.has(m.id)).map((m) => m.id);
}

/**
 * Unidades que se desplazan juntas: cada compás suelto o los dos destinos de una repetición de dos compases que se dibuja como
 * pareja (marca en el primero y el segundo justo detrás). Mover un destino sin el otro separaría la pareja.
 */
export function measureUnits(song) {
  const units = [];
  for (let i = 0; i < song.measures.length; i++) {
    const measure = song.measures[i];
    const pair = measure.repeatPreviousTwo ? repeatPairOf(song, measure.id) : null;
    if (pair && pair.first === measure) {
      units.push([measure.id, pair.second.id]);
      i++;
    } else units.push([measure.id]);
  }
  return units;
}

/** Selección ampliada a unidades completas (ver measureUnits), en orden escrito. */
export function expandToUnits(song, ids) {
  const wanted = new Set(ids);
  return measureUnits(song).filter((unit) => unit.some((id) => wanted.has(id))).flat();
}

const pickedUnits = (units, ids) => {
  const wanted = new Set(ids);
  return units.map((unit) => unit.some((id) => wanted.has(id)));
};

/** Reordena `song.measures` en el sitio según la lista de unidades. */
function applyUnits(song, units) {
  const byId = new Map(song.measures.map((m) => [m.id, m]));
  song.measures.splice(0, song.measures.length, ...units.flat().map((id) => byId.get(id)));
}

/* ---------- Etiquetas ---------- */

/** Ausente equivale a renumerar: solo se guarda `false`. */
export const renumberEnabled = (song) => song.renumberMeasures !== false;

export function setRenumberMeasures(song, on) {
  if (on) delete song.renumberMeasures;
  else song.renumberMeasures = false;
}

/** Número del primer compás con etiqueta numérica, o 1. Así una canción que empieza en el compás 0 o en el 17 lo conserva. */
export function numberingStart(song) {
  const first = song.measures.find((m) => NUMERIC.test(m.label));
  return first ? Number(first.label) : 1;
}

/**
 * Renumera en orden escrito las etiquetas numéricas desde `start`. Las demás («Intro», «12a», «4 (copia)») se conservan y no
 * consumen número. Devuelve los IDs de los compases cuya etiqueta ha cambiado.
 */
export function renumberLabels(song, start = numberingStart(song)) {
  const changed = [];
  let n = start;
  for (const measure of song.measures) {
    if (!NUMERIC.test(measure.label)) continue;
    const label = String(n++);
    if (measure.label !== label) {
      measure.label = label;
      changed.push(measure.id);
    }
  }
  return changed;
}

/**
 * Ejecuta una operación estructural y, si la canción renumera, ajusta después las etiquetas numéricas desde el número con el
 * que empezaba antes de la operación (borrar el primer compás no cambia el inicio). Añade `relabeled`: cuántos compases que ya
 * existían cambiaron de etiqueta. Los avisos de la operación se vuelven a redactar con las etiquetas nuevas.
 */
export function runStructural(song, operation) {
  const renumber = renumberEnabled(song);
  const start = numberingStart(song);
  const existing = new Set(song.measures.map((m) => m.id));
  const result = operation({ renumber }) || {};
  const changed = renumber ? renumberLabels(song, start) : [];
  result.relabeled = changed.filter((id) => existing.has(id)).length;
  if (changed.length) {
    const now = checkStructure(song);
    const refresh = (list) => {
      const keys = new Set(list.map((w) => `${w.kind}:${w.objectId}`));
      return now.filter((w) => keys.has(`${w.kind}:${w.objectId}`));
    };
    if (result.repeats) result.repeats = refresh(result.repeats);
    if (result.inversions) result.inversions = refresh(result.inversions);
  }
  return result;
}

/* ---------- Posición de inserción ---------- */

/**
 * Índice para insertar antes del primer compás o después del último de la selección. Si cae entre los dos destinos de una
 * pareja de repetición, se desplaza fuera de ella hacia el lado pedido (`shifted`), para no separarla.
 */
export function insertionPoint(song, ids, side) {
  const targets = orderedIds(song, ids);
  let index;
  if (!targets.length) index = side === 'before' ? 0 : song.measures.length;
  else if (side === 'before') index = song.measures.findIndex((m) => m.id === targets[0]);
  else index = song.measures.findIndex((m) => m.id === targets.at(-1)) + 1;
  const previous = song.measures[index - 1];
  const next = song.measures[index];
  const pair = previous && next ? repeatPairOf(song, previous.id) : null;
  if (pair && pair.first === previous && pair.second === next) return { index: side === 'before' ? index - 1 : index + 1, shifted: true };
  return { index, shifted: false };
}

/* ---------- Insertar y borrar ---------- */

/** Compás vacío antes o después de la selección. */
export function insertEmptyMeasure(song, ids, side) {
  const { index, shifted } = insertionPoint(song, ids, side);
  const before = checkStructure(song);
  const measure = { id: createIdFactory(song)('m'), label: nextLabel(song), chordEvents: [] };
  song.measures.splice(index, 0, measure);
  return { ids: [measure.id], shifted, repeats: newRepeatWarnings(before, checkStructure(song)) };
}

/** Borra los compases indicados. Las marcas que los usaban se conservan con la referencia pendiente (ver measureConsequences). */
export function deleteMeasures(song, ids) {
  const targets = orderedIds(song, ids);
  if (!targets.length) return { removed: [], neighbourId: null, repeats: [] };
  const first = song.measures.findIndex((m) => m.id === targets[0]);
  const before = checkStructure(song);
  const doomed = new Set(targets);
  const removed = song.measures.filter((m) => doomed.has(m.id));
  song.measures.splice(0, song.measures.length, ...song.measures.filter((m) => !doomed.has(m.id)));
  const neighbour = song.measures[Math.min(first, song.measures.length - 1)] || null;
  return { removed, neighbourId: neighbour ? neighbour.id : null, repeats: newRepeatWarnings(before, checkStructure(song)) };
}

/* ---------- Mover e intercambiar ---------- */

/** ¿Puede la selección desplazarse una posición? delta -1 sube (antes), +1 baja (después). */
export function canMoveMeasures(song, ids, delta) {
  const units = measureUnits(song);
  const picked = pickedUnits(units, ids);
  const first = picked.indexOf(true);
  if (first < 0) return false;
  return delta < 0 ? first > 0 : picked.lastIndexOf(true) < units.length - 1;
}

/**
 * Desplaza una posición la selección, aunque no sea contigua, conservando su orden: cada tramo seleccionado salta por encima
 * de la unidad vecina. Una pareja de repetición se mueve entera. Devuelve { moved, ids, inversions, repeats }, con `ids` la
 * selección ampliada a unidades y los avisos nuevos de tramos invertidos y de repeticiones sin su origen inmediato.
 */
export function moveMeasures(song, ids, delta) {
  const units = measureUnits(song);
  const picked = pickedUnits(units, ids);
  const movedIds = units.filter((_, i) => picked[i]).flat();
  if (!canMoveMeasures(song, ids, delta)) return { moved: false, ids: movedIds, inversions: [], repeats: [] };
  const before = checkStructure(song);
  const step = delta < 0 ? -1 : 1;
  for (let n = 0; n < units.length; n++) {
    const i = step < 0 ? n : units.length - 1 - n;
    const j = i + step;
    if (picked[i] && j >= 0 && j < units.length && !picked[j]) {
      [units[i], units[j]] = [units[j], units[i]];
      [picked[i], picked[j]] = [picked[j], picked[i]];
    }
  }
  applyUnits(song, units);
  const after = checkStructure(song);
  return { moved: true, ids: movedIds, inversions: newInversions(before, after), repeats: newRepeatWarnings(before, after) };
}

/** Las dos unidades que intercambiar, o null si la selección no abarca exactamente dos. */
function swapUnits(song, ids) {
  const units = measureUnits(song);
  const picked = pickedUnits(units, ids);
  const positions = picked.flatMap((on, i) => (on ? [i] : []));
  return positions.length === 2 ? { units, a: positions[0], b: positions[1] } : null;
}

export const canSwapMeasures = (song, ids) => swapUnits(song, ids) !== null;

/** Intercambia las posiciones de dos compases (o de una pareja de repetición y otro compás). Contenido, IDs y marcas viajan con cada uno. */
export function swapMeasures(song, ids) {
  const found = swapUnits(song, ids);
  if (!found) return { swapped: false, ids: [], inversions: [], repeats: [] };
  const { units, a, b } = found;
  const before = checkStructure(song);
  [units[a], units[b]] = [units[b], units[a]];
  applyUnits(song, units);
  const after = checkStructure(song);
  return { swapped: true, ids: [...units[a], ...units[b]], inversions: newInversions(before, after), repeats: newRepeatWarnings(before, after) };
}

/* ---------- Copiar, pegar y duplicar ---------- */

/** Copia profunda de los compases en orden escrito: tarjetas, voicings, textos, tonalidades, ancho y repeticiones. Sin `structure`. */
export function copyMeasures(song, ids) {
  return orderedIds(song, ids).map((id) => clone(findMeasure(song, id)));
}

const contentIds = (measure) => [measure.id, ...measure.chordEvents.flatMap((e) => [e.id, ...e.voicings.map((v) => v.id)])];

/**
 * Rehace las repeticiones de los compases recién colocados según su posición, como al duplicar: «repite el anterior» apunta al
 * compás que ahora tiene delante, y una pareja solo se conserva si su segundo destino también se ha copiado justo detrás. Si no
 * pueden cumplirse, el compás queda vacío y se devuelve una nota.
 */
function relinkRepeats(song, copies, idMap) {
  const notes = [];
  const placed = new Set(copies.map((c) => c.id));
  for (const copy of copies) {
    const i = song.measures.indexOf(copy);
    if (copy.repeatPrevious) {
      const previous = song.measures[i - 1];
      if (previous) copy.repeatPrevious = { sourceMeasureId: previous.id };
      else {
        delete copy.repeatPrevious;
        notes.push('Un compás que repetía el anterior queda vacío: al principio no hay compás anterior que repetir.');
      }
    }
    if (copy.repeatPreviousTwo) {
      const second = song.measures[i + 1];
      const wanted = idMap.get(copy.repeatPreviousTwo.targetMeasureIds[1]);
      if (i >= 2 && second && placed.has(second.id) && second.id === wanted) {
        copy.repeatPreviousTwo = {
          sourceMeasureIds: [song.measures[i - 2].id, song.measures[i - 1].id],
          targetMeasureIds: [copy.id, second.id],
        };
      } else {
        delete copy.repeatPreviousTwo;
        notes.push('Una repetición de dos compases copiada sin su segundo destino, o sin dos compases delante, queda como compás vacío.');
      }
    }
  }
  return notes;
}

/**
 * Inserta en `index` copias de `measures` (de copyMeasures, quizá de otra canción). Compases, acordes y voicings reciben IDs
 * nuevos. Con `reuseIds` (pegar lo cortado en la misma canción) se conservan los IDs que siguen libres: así las marcas que se
 * quedaron esperando esos compases vuelven a encontrarlos, como en un movimiento. Una copia conserva su etiqueta numérica para
 * renumerarla; sin renumeración, o si no es numérica, se marca «(copia)». Lo recuperado de un corte conserva su etiqueta.
 * Las copias no heredan `fillToEdge`, `breakBefore` ni `breakAfter`: ajustar, empezar o terminar la línea pertenece a la línea
 * donde estaba el original, no al contenido.
 */
export function pasteMeasures(song, measures, index, { renumber = true, reuseIds = false } = {}) {
  const inUse = new Set(listIds(song).map(([id]) => id));
  const kept = new Set();
  if (reuseIds) for (const measure of measures) for (const id of contentIds(measure)) if (!inUse.has(id)) kept.add(id);
  const newId = createIdFactory(song, [...kept]);
  const ident = (id, prefix) => (kept.has(id) ? id : newId(prefix));
  const idMap = new Map();
  let reused = 0;
  const copies = measures.map((source) => {
    const copy = clone(source);
    copy.id = ident(source.id, 'm');
    idMap.set(source.id, copy.id);
    if (copy.id === source.id) reused++;
    else {
      copy.label = renumber && NUMERIC.test(source.label) ? source.label : `${source.label} (copia)`;
      delete copy.fillToEdge;
      delete copy.breakBefore;
      delete copy.breakAfter;
    }
    for (const event of copy.chordEvents) {
      event.id = ident(event.id, 'e');
      for (const voicing of event.voicings) voicing.id = ident(voicing.id, 'v');
    }
    return copy;
  });
  const before = checkStructure(song);
  const at = Math.max(0, Math.min(index, song.measures.length));
  song.measures.splice(at, 0, ...copies);
  const notes = relinkRepeats(song, copies, idMap);
  return { ids: copies.map((c) => c.id), reused, notes, repeats: newRepeatWarnings(before, checkStructure(song)) };
}

/** Copia del bloque justo después de su último compás (fuera de una pareja si cae dentro), con IDs nuevos. */
export function duplicateMeasures(song, ids, { renumber = true } = {}) {
  const targets = orderedIds(song, ids);
  if (!targets.length) return { ids: [], reused: 0, notes: [], repeats: [] };
  const { index } = insertionPoint(song, targets, 'after');
  return pasteMeasures(song, copyMeasures(song, targets), index, { renumber });
}

/* ---------- Sustituir ---------- */

/** Una fuente sirve para cualquier número de compases; varias fuentes, para otros tantos compases (en orden). */
export const canReplaceMeasures = (song, ids, sources) => {
  const count = orderedIds(song, ids).length;
  return count > 0 && sources.length > 0 && (sources.length === 1 || sources.length === count);
};

/**
 * Sustituye todo el contenido de cada compás por el de su fuente: tarjetas (con IDs nuevos), voicings, textos, tonalidades,
 * ancho y «repite el anterior». Conserva el ID, la etiqueta, el ajuste de línea y las marcas del compás. Si el compás estaba en
 * una pareja de repetición, la pareja se quita (ambos destinos quedan editables) y se devuelve una nota.
 */
export function replaceMeasures(song, ids, sources) {
  const targets = orderedIds(song, ids);
  if (!canReplaceMeasures(song, targets, sources)) return { replaced: false, ids: [], notes: [], repeats: [] };
  const before = checkStructure(song);
  const newId = createIdFactory(song);
  const notes = [];
  targets.forEach((id, n) => {
    const target = findMeasure(song, id);
    const source = sources.length === 1 ? sources[0] : sources[n];
    const pair = repeatPairOf(song, id);
    if (pair) {
      delete pair.first.repeatPreviousTwo;
      notes.push(`Se quitó la repetición de dos compases de los compases ${pair.first.label} y ${pair.second.label}: ambos quedan editables.`);
    }
    delete target.repeatPrevious;
    delete target.repeatPreviousTwo;
    target.chordEvents = clone(source.chordEvents).map((event) => ({
      ...event,
      id: newId('e'),
      voicings: event.voicings.map((voicing) => ({ ...voicing, id: newId('v') })),
    }));
    if (source.widthPercent !== undefined) target.widthPercent = source.widthPercent;
    else delete target.widthPercent;
    const index = song.measures.indexOf(target);
    if (source.repeatPrevious) {
      if (index > 0) target.repeatPrevious = { sourceMeasureId: song.measures[index - 1].id };
      else notes.push(`El compás ${target.label} queda vacío: al principio no hay compás anterior que repetir.`);
    }
    if (source.repeatPreviousTwo) notes.push(`El compás ${target.label} queda vacío: una repetición de dos compases no se sustituye compás a compás.`);
  });
  return { replaced: true, ids: targets, notes, repeats: newRepeatWarnings(before, checkStructure(song)) };
}

/* ---------- Corregir referencias de repetición ---------- */

/**
 * Acción expresa tras un aviso: apunta las repeticiones de los compases indicados a los compases inmediatamente anteriores.
 * Una pareja solo se corrige si con ello desaparece su aviso (por ejemplo, no se toma como segundo destino un compás con
 * tarjetas). Devuelve cuántas referencias han cambiado.
 */
export function fixRepeatReferences(song, ids) {
  const warned = (id) => checkStructure(song).some((w) => w.kind === 'repeat' && w.objectId === id);
  let fixed = 0;
  for (const id of new Set(ids)) {
    const measure = findMeasure(song, id);
    if (measure?.repeatPrevious) {
      const was = measure.repeatPrevious.sourceMeasureId;
      if (fixRepeatPrevious(song, id) && measure.repeatPrevious.sourceMeasureId !== was) fixed++;
    } else if (measure?.repeatPreviousTwo) {
      const saved = clone(measure.repeatPreviousTwo);
      if (fixRepeatPreviousTwo(song, id) && !warned(id)) {
        if (JSON.stringify(saved) !== JSON.stringify(measure.repeatPreviousTwo)) fixed++;
      } else measure.repeatPreviousTwo = saved;
    }
  }
  return fixed;
}
