import { createIdFactory } from './ids.js';
import { checkStructure, newInversions } from './structure.js';

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
  for (const event of copy.chordEvents) {
    event.id = newId('e');
    for (const v of event.voicings) v.id = newId('v');
  }
  song.measures.splice(index + 1, 0, copy);
  return copy;
}

/** delta -1 sube, +1 baja. Devuelve { moved, inversions } con los tramos que quedan invertidos por este movimiento. */
export function moveMeasure(song, measureId, delta) {
  const index = song.measures.findIndex((m) => m.id === measureId);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= song.measures.length) return { moved: false, inversions: [] };
  const before = checkStructure(song);
  const [measure] = song.measures.splice(index, 1);
  song.measures.splice(target, 0, measure);
  return { moved: true, inversions: newInversions(before, checkStructure(song)) };
}

/** Borra solo el compás: la estructura que lo referenciaba no se toca ni se redirige. */
export function deleteMeasure(song, measureId) {
  const index = song.measures.findIndex((m) => m.id === measureId);
  if (index < 0) return null;
  return song.measures.splice(index, 1)[0];
}

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

export function addEvent(song, measureId, chordName = 'Acorde nuevo') {
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
