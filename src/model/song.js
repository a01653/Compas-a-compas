import { createIdFactory } from './ids.js';
import { checkStructure, newInversions, newRepeatWarnings } from './structure.js';

/** Operaciones sobre la canción. Mutan el objeto recibido y no tocan nada más que lo indicado. */

export function createEmptySong() {
  return {
    schemaVersion: 1,
    documentVersion: '1.0',
    title: '',
    key: '',
    measures: [{ id: 'm1', label: '1', chordEvents: [] }],
    structure: { repeats: [], endings: [], markers: [], jumps: [] },
  };
}

const clone = (value) => JSON.parse(JSON.stringify(value));
export const emptyFrets = () => [null, null, null, null, null, null];

/**
 * Canción del botón «Nuevo»: título y tonalidad provisionales para sustituir y un compás con una tarjeta vacía.
 * Las franjas de tonalidad se ocultan para no repetir «Tonalidad» en la primera tarjeta; se activan en los datos de la canción.
 */
export function createStarterSong() {
  const song = createEmptySong();
  song.title = 'Nombre del tema';
  song.key = 'Tonalidad';
  song.showTonalities = false;
  song.measures[0].chordEvents.push({ id: 'e1', chordName: '', family: 'other', voicings: [{ id: 'v1', frets: emptyFrets() }] });
  return song;
}

export function findMeasure(song, id) {
  return song.measures.find((m) => m.id === id) || null;
}

/** Etiqueta propuesta para un compás nuevo: sigue la mayor etiqueta numérica; no renumera nada. */
export function nextLabel(song) {
  const numbers = song.measures.map((m) => m.label).filter((l) => /^\d+$/.test(l)).map(Number);
  return String(numbers.length ? Math.max(...numbers) + 1 : song.measures.length + 1);
}

/* ---------- Compases ---------- */

export function addMeasure(song, index = song.measures.length) {
  const newId = createIdFactory(song);
  const measure = { id: newId('m'), label: nextLabel(song), chordEvents: [] };
  song.measures.splice(Math.max(0, Math.min(index, song.measures.length)), 0, measure);
  return measure;
}

/** Copia con IDs nuevos justo después del original. */
export function duplicateMeasure(song, measureId) {
  const index = song.measures.findIndex((m) => m.id === measureId);
  if (index < 0) return null;
  const newId = createIdFactory(song);
  const copy = clone(song.measures[index]);
  copy.id = newId('m');
  copy.label = `${copy.label} (copia)`;
  // La copia queda justo después del original: «compás anterior» pasa a ser el original (acción explícita, no una copia ciega del ID).
  // Una pareja de dos compases no se copia: la copia sería un destino duplicado. Queda como compás vacío editable.
  delete copy.repeatPreviousTwo;
  if (copy.repeatPrevious) copy.repeatPrevious = { sourceMeasureId: song.measures[index].id };
  for (const event of copy.chordEvents) {
    event.id = newId('e');
    for (const v of event.voicings) v.id = newId('v');
  }
  song.measures.splice(index + 1, 0, copy);
  return copy;
}

/** delta -1 sube, +1 baja. Devuelve { moved, inversions, repeats }: tramos invertidos y repeticiones del compás anterior que dejan de ser válidas. */
export function moveMeasure(song, measureId, delta) {
  const index = song.measures.findIndex((m) => m.id === measureId);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= song.measures.length) return { moved: false, inversions: [], repeats: [] };
  const before = checkStructure(song);
  const [measure] = song.measures.splice(index, 1);
  song.measures.splice(target, 0, measure);
  const after = checkStructure(song);
  return { moved: true, inversions: newInversions(before, after), repeats: newRepeatWarnings(before, after) };
}

/** Borra solo el compás: la estructura que lo referenciaba no se toca ni se redirige. */
export function deleteMeasure(song, measureId) {
  const index = song.measures.findIndex((m) => m.id === measureId);
  if (index < 0) return null;
  return song.measures.splice(index, 1)[0];
}

/* ---------- Repetición del compás anterior ---------- */

/** Compás que precede al dado en el orden escrito, o null. */
export function previousMeasure(song, measureId) {
  const index = song.measures.findIndex((m) => m.id === measureId);
  return index > 0 ? song.measures[index - 1] : null;
}

/**
 * Convierte el compás en «repite el anterior»: guarda solo la referencia al ID del predecesor inmediato y vacía las tarjetas.
 * Etiqueta y marcas del compás no se tocan (viven en `label` y en `structure`). La confirmación previa es cosa de la interfaz.
 */
export function setRepeatPrevious(song, measureId) {
  const measure = findMeasure(song, measureId);
  const previous = previousMeasure(song, measureId);
  if (!measure || !previous) return false;
  measure.chordEvents = [];
  measure.repeatPrevious = { sourceMeasureId: previous.id };
  return true;
}

/** Vuelve a un compás editable y vacío. */
export function clearRepeatPrevious(song, measureId) {
  const measure = findMeasure(song, measureId);
  if (!measure || !measure.repeatPrevious) return false;
  delete measure.repeatPrevious;
  return true;
}

/** Apunta de nuevo al predecesor inmediato (acción expresa tras borrar o mover el origen). */
export function fixRepeatPrevious(song, measureId) {
  const measure = findMeasure(song, measureId);
  const previous = previousMeasure(song, measureId);
  if (!measure?.repeatPrevious || !previous) return false;
  measure.repeatPrevious = { sourceMeasureId: previous.id };
  return true;
}

/* ---------- Repetición de dos compases ---------- */

/**
 * Pareja de repetición a la que pertenece el compás (como primer o segundo destino), o null.
 * Devuelve { first, second } con los compases de destino cuando la marca está en el primero y el segundo es el siguiente.
 */
export function repeatPairOf(song, measureId) {
  const index = song.measures.findIndex((m) => m.id === measureId);
  if (index < 0) return null;
  const own = song.measures[index];
  const pairAt = (i) => {
    const first = song.measures[i];
    const second = song.measures[i + 1];
    return first?.repeatPreviousTwo && second && first.repeatPreviousTwo.targetMeasureIds[0] === first.id
      && first.repeatPreviousTwo.targetMeasureIds[1] === second.id ? { first, second } : null;
  };
  return (own.repeatPreviousTwo && pairAt(index)) || pairAt(index - 1);
}

/** ¿Hay dos compases escritos antes del dado? */
export const canRepeatTwo = (song, measureId) => song.measures.findIndex((m) => m.id === measureId) >= 2;

/**
 * El compás y el siguiente pasan a repetir, como pareja, los dos compases inmediatamente anteriores. Sus tarjetas se vacían;
 * etiquetas y marcas no se tocan. Quita antes cualquier repetición (de uno o dos compases) que afecte a esos destinos.
 */
export function setRepeatPreviousTwo(song, measureId) {
  const index = song.measures.findIndex((m) => m.id === measureId);
  if (index < 2 || index + 1 >= song.measures.length) return false;
  const [a, b] = [song.measures[index - 2], song.measures[index - 1]];
  const [c, d] = [song.measures[index], song.measures[index + 1]];
  for (const target of [c, d]) {
    const pair = repeatPairOf(song, target.id);
    if (pair) delete pair.first.repeatPreviousTwo;
    delete target.repeatPrevious;
    delete target.repeatPreviousTwo;
    target.chordEvents = [];
  }
  c.repeatPreviousTwo = { sourceMeasureIds: [a.id, b.id], targetMeasureIds: [c.id, d.id] };
  return true;
}

/** Quita la pareja a la que pertenece el compás: ambos destinos quedan vacíos y editables. */
export function clearRepeatPreviousTwo(song, measureId) {
  const pair = repeatPairOf(song, measureId);
  if (!pair) return false;
  delete pair.first.repeatPreviousTwo;
  return true;
}

/** Vuelve a apuntar a los dos compases inmediatamente anteriores al primer destino (acción expresa). */
export function fixRepeatPreviousTwo(song, measureId) {
  const first = findMeasure(song, measureId);
  const index = song.measures.indexOf(first);
  const second = song.measures[index + 1];
  if (!first?.repeatPreviousTwo || index < 2 || !second) return false;
  first.repeatPreviousTwo = {
    sourceMeasureIds: [song.measures[index - 2].id, song.measures[index - 1].id],
    targetMeasureIds: [first.id, second.id],
  };
  return true;
}

/** Sale de cualquier modo de repetición del compás (uno o dos compases). Devuelve si hubo algo que quitar. */
export function leaveRepeat(song, measureId) {
  return clearRepeatPrevious(song, measureId) || clearRepeatPreviousTwo(song, measureId);
}

/* ---------- Ancho de compás y ajuste de línea ---------- */

export const MEASURE_WIDTH_MIN = 10;
export const MEASURE_WIDTH_MAX = 100;

/** Porcentaje (entero) del ancho útil de la línea; vacío o no válido = Automático (sin campo). */
export function setMeasureWidth(measure, value) {
  const n = Number(value);
  if (value !== '' && value !== null && Number.isInteger(n) && n >= MEASURE_WIDTH_MIN && n <= MEASURE_WIDTH_MAX) measure.widthPercent = n;
  else delete measure.widthPercent;
}

/**
 * «Ajustar línea al ancho»: la línea se identifica por sus compases. Activar marca solo el primero; desactivar quita la marca de
 * todos los de la línea (vuelve a Automático). Una línea se ajusta si cualquiera de sus compases lleva la marca.
 */
export function setLineFill(song, measureIds, on) {
  const measures = measureIds.map((id) => findMeasure(song, id)).filter(Boolean);
  for (const measure of measures) delete measure.fillToEdge;
  if (on && measures.length) measures[0].fillToEdge = true;
}

/**
 * Saltos de línea forzados. Antes (`breakBefore`): el compás empieza una línea nueva en la hoja aunque cupiera en la anterior.
 * Después (`breakAfter`): el compás termina su línea y el siguiente empieza otra. Solo se guarda `true`.
 * Devuelve los compases que cambian; si alguno de los indicados no lo tiene, se activa en todos, y si no, se quita de todos.
 */
function toggleMeasureFlag(song, measureIds, key) {
  const measures = measureIds.map((id) => findMeasure(song, id)).filter(Boolean);
  const on = measures.some((measure) => measure[key] !== true);
  for (const measure of measures) {
    if (on) measure[key] = true;
    else delete measure[key];
  }
  return { on, measures };
}
export const toggleBreakBefore = (song, measureIds) => toggleMeasureFlag(song, measureIds, 'breakBefore');
export const toggleBreakAfter = (song, measureIds) => toggleMeasureFlag(song, measureIds, 'breakAfter');

/* ---------- Opciones de página (globales) ---------- */

export const MAX_MEASURES_PER_ROW_LIMIT = 16;
export const FRETBOARD_SCALE_MIN = 60;
export const FRETBOARD_SCALE_MAX = 100;

/** Automático = sin campo. Un entero entre 1 y el límite se guarda tal cual. */
export function setMaxMeasuresPerRow(song, value) {
  const n = Number(value);
  if (Number.isInteger(n) && n >= 1 && n <= MAX_MEASURES_PER_ROW_LIMIT) song.maxMeasuresPerRow = n;
  else delete song.maxMeasuresPerRow;
}

/** Escala uniforme de los mástiles. 100 = tamaño normal; normal se representa omitiendo el campo. */
export function setFretboardScalePercent(song, value) {
  const n = Number(value);
  if (Number.isInteger(n) && n >= FRETBOARD_SCALE_MIN && n <= FRETBOARD_SCALE_MAX) {
    if (n === FRETBOARD_SCALE_MAX) delete song.fretboardScalePercent;
    else song.fretboardScalePercent = n;
  } else delete song.fretboardScalePercent;
}

/** Visible es el valor por defecto: solo se guarda el valor «oculto». */
export function setShowMeasureNumbers(song, visible) {
  if (visible) delete song.showMeasureNumbers;
  else song.showMeasureNumbers = false;
}

export const measureNumbersVisible = (song) => song.showMeasureNumbers !== false;

/** Añade compases ya analizados por la entrada por lista (todo o nada: quien llama comprueba que no hay errores). */
export function appendParsedMeasures(song, parsedMeasures) {
  const newId = createIdFactory(song);
  const created = parsedMeasures.map((pm) => ({
    id: newId('m'),
    label: pm.label,
    chordEvents: pm.events.map((pe) => ({
      id: newId('e'),
      chordName: pe.chordName,
      family: 'other',
      voicings: pe.voicings.map((frets) => ({ id: newId('v'), frets: [...frets] })),
    })),
  }));
  song.measures.push(...created);
  return created;
}

/* ---------- Acordes (eventos) y voicings ---------- */

export function addEvent(song, measureId, chordName = '') {
  const measure = findMeasure(song, measureId);
  if (!measure) return null;
  const newId = createIdFactory(song);
  const event = { id: newId('e'), chordName, family: 'other', voicings: [] };
  measure.chordEvents.push(event);
  return event;
}

export function removeEvent(song, measureId, eventId) {
  const measure = findMeasure(song, measureId);
  if (!measure) return null;
  const index = measure.chordEvents.findIndex((e) => e.id === eventId);
  return index < 0 ? null : measure.chordEvents.splice(index, 1)[0];
}

/** Voicing nuevo con todas las cuerdas mudas: no se inventan notas. */
export function addVoicing(song, event, frets = emptyFrets()) {
  const newId = createIdFactory(song);
  const voicing = { id: newId('v'), frets: [...frets] };
  event.voicings.push(voicing);
  return voicing;
}

export function duplicateVoicing(song, event, voicingId) {
  const index = event.voicings.findIndex((v) => v.id === voicingId);
  if (index < 0) return null;
  const newId = createIdFactory(song);
  const copy = clone(event.voicings[index]);
  copy.id = newId('v');
  event.voicings.splice(index + 1, 0, copy);
  return copy;
}

export function removeVoicing(event, voicingId) {
  const index = event.voicings.findIndex((v) => v.id === voicingId);
  return index < 0 ? null : event.voicings.splice(index, 1)[0];
}

/* ---------- Textos de tarjeta: herencia, personalización y ocultación ---------- */

/** Texto efectivo: ausencia en el voicing hereda del acorde; cadena vacía oculta. */
export function effectiveText(event, voicing, key) {
  if (voicing && voicing[key] !== undefined) return voicing[key];
  return event[key] || '';
}

/** { mode: 'inherit' | 'custom' | 'hidden', value, inherited } */
export function textState(event, voicing, key) {
  const inherited = event[key] || '';
  if (!voicing || voicing[key] === undefined) return { mode: 'inherit', value: inherited, inherited };
  if (voicing[key] === '') return { mode: 'hidden', value: '', inherited };
  return { mode: 'custom', value: voicing[key], inherited };
}

/** Ayuda visible bajo un campo de tarjeta; depende del valor actual del acorde. */
export function describeTextMode(mode, inherited) {
  if (mode === 'inherit') {
    return inherited ? `Se muestra el valor del acorde: «${inherited}».` : 'El acorde no define este texto; no se muestra nada.';
  }
  if (mode === 'hidden') return 'El texto queda oculto en esta tarjeta (cadena vacía).';
  return 'Vacío equivale a ocultar el texto en esta tarjeta.';
}

export function setTextMode(event, voicing, key, mode) {
  if (mode === 'inherit') delete voicing[key];
  else if (mode === 'hidden') voicing[key] = '';
  else if (voicing[key] === undefined) voicing[key] = event[key] || '';
}

/** Valor por defecto del acorde: vacío = sin valor. Las tarjetas con su propio valor no cambian. */
export function setEventDefault(event, key, value) {
  if (value === '') delete event[key];
  else event[key] = value;
}

/** Edita el texto visible; aplicar a todas sustituye también los valores propios de ese campo. */
export function setCardText(event, voicing, key, value, allPositions = false) {
  if (allPositions) {
    setEventDefault(event, key, value);
    for (const position of event.voicings) delete position[key];
  } else if (effectiveText(event, voicing, key) !== value) {
    voicing[key] = value; // Cadena vacía oculta el texto heredado en esta posición.
  }
}
