import { createIdFactory } from './ids.js';
import { emptyFrets, findMeasure, setCardText, setEventDefault } from './song.js';

/**
 * Tarjetas independientes sobre el formato actual (sin migración).
 * Una tarjeta es un voicing o, si el acorde no tiene ninguno, el propio acorde (tarjeta pendiente).
 * Un archivo histórico puede agrupar varios voicings bajo un acorde; esas tarjetas solo se separan cuando se edita su
 * nombre o su calidad (isolateCard), nunca al abrir, guardar o seleccionar.
 */

const clone = value => JSON.parse(JSON.stringify(value));
const EVENT_FIELDS = ['chordName', 'aboveText', 'insideText', 'family'];

/** Clave plana y sin ambigüedad entre IDs: `v:<voicingId>` o `e:<eventId>` (tarjeta pendiente). */
export const cardKey = (event, voicing) => (voicing ? `v:${voicing.id}` : `e:${event.id}`);
export const selectionOf = card => ({ eventId: card.event.id, voicingId: card.voicing ? card.voicing.id : null });

export function flatCards(measure) {
  const cards = [];
  (measure?.chordEvents || []).forEach((event, eventIndex) => {
    if (!event.voicings.length) cards.push({ key: `e:${event.id}`, event, voicing: null, eventIndex, voicingIndex: -1 });
    else event.voicings.forEach((voicing, voicingIndex) => cards.push({ key: `v:${voicing.id}`, event, voicing, eventIndex, voicingIndex }));
  });
  return cards;
}

export const findCard = (measure, key) => flatCards(measure).find(card => card.key === key) || null;

/** Evento nuevo con los datos de nivel acorde de `event`: así los textos efectivos (ausente o vacío) no cambian. */
function shell(event, id, voicings) {
  const copy = { id };
  for (const key of EVENT_FIELDS) if (event[key] !== undefined) copy[key] = event[key];
  copy.voicings = voicings;
  return copy;
}

/**
 * Deja la tarjeta sola en su evento. Conserva el orden de todas las tarjetas y el ID del primer fragmento:
 * [a, b, c] aislando b → a (ID original), b (ID nuevo), c (ID nuevo). Devuelve el evento que contiene la tarjeta.
 */
export function isolateCard(song, measure, event, voicing) {
  if (!voicing || event.voicings.length < 2) return event;
  const index = event.voicings.indexOf(voicing);
  if (index < 0) return event;
  const newId = createIdFactory(song); // Antes de mover nada: los voicings desplazados deben seguir contando como usados.
  const head = event.voicings.slice(0, index);
  const tail = event.voicings.slice(index + 1);
  const inserts = [];
  let solo = event;
  if (head.length) {
    solo = shell(event, newId('e'), [voicing]);
    inserts.push(solo);
  }
  if (tail.length) inserts.push(shell(event, newId('e'), tail));
  event.voicings = head.length ? head : [voicing];
  measure.chordEvents.splice(measure.chordEvents.indexOf(event) + 1, 0, ...inserts);
  return solo;
}

/** Parte el acorde justo después de la tarjeta si le siguen otras; devuelve la posición de inserción tras ella. */
function insertionAfter(song, measure, event, voicing, newId) {
  const eventIndex = measure.chordEvents.indexOf(event);
  const index = voicing ? event.voicings.indexOf(voicing) : -1;
  if (voicing && index >= 0 && index < event.voicings.length - 1) {
    const tail = shell(event, newId('e'), event.voicings.slice(index + 1));
    event.voicings = event.voicings.slice(0, index + 1);
    measure.chordEvents.splice(eventIndex + 1, 0, tail);
  }
  return eventIndex + 1;
}

/** Tarjeta nueva e independiente (un acorde con una digitación vacía) justo después de la seleccionada. */
export function addCard(song, measureId, selected = null, chordName = '') {
  const measure = findMeasure(song, measureId);
  if (!measure) return null;
  const newId = createIdFactory(song);
  const eventId = newId('e');
  const voicingId = newId('v');
  const event = measure.chordEvents.find(e => e.id === selected?.eventId);
  const voicing = event?.voicings.find(v => v.id === selected?.voicingId) || null;
  const at = event ? insertionAfter(song, measure, event, voicing, newId) : measure.chordEvents.length;
  const created = { id: eventId, chordName, family: 'other', voicings: [{ id: voicingId, frets: emptyFrets() }] };
  measure.chordEvents.splice(at, 0, created);
  return { event: created, voicing: created.voicings[0] };
}

/** Copia profunda e independiente justo después: IDs nuevos, textos efectivos, grado y tonalidad propios incluidos. */
export function duplicateCard(song, measureId, eventId, voicingId) {
  const measure = findMeasure(song, measureId);
  const event = measure?.chordEvents.find(e => e.id === eventId);
  if (!event) return null;
  const voicing = voicingId ? event.voicings.find(v => v.id === voicingId) : null;
  if (voicingId && !voicing) return null;
  const newId = createIdFactory(song);
  const copyEventId = newId('e');
  const copyVoicing = voicing ? { ...clone(voicing), id: newId('v') } : null;
  const at = insertionAfter(song, measure, event, voicing, newId);
  const created = shell(clone(event), copyEventId, copyVoicing ? [copyVoicing] : []);
  measure.chordEvents.splice(at, 0, created);
  return { event: created, voicing: copyVoicing };
}

/**
 * Quita solo esa tarjeta (y el acorde si se queda sin ninguna). Devuelve { removed, next }, con `next` la selección
 * que ocupa su lugar (la siguiente, o la anterior si era la última) o null si el compás queda vacío.
 */
export function removeCard(song, measureId, eventId, voicingId = null) {
  const measure = findMeasure(song, measureId);
  const before = flatCards(measure);
  const position = before.findIndex(card => card.event.id === eventId && (card.voicing ? card.voicing.id : null) === voicingId);
  if (position < 0) return { removed: false, next: null };
  const { event, voicing } = before[position];
  if (voicing) event.voicings.splice(event.voicings.indexOf(voicing), 1);
  if (!voicing || !event.voicings.length) measure.chordEvents.splice(measure.chordEvents.indexOf(event), 1);
  const after = flatCards(measure);
  const next = after[Math.min(position, after.length - 1)];
  return { removed: true, next: next ? selectionOf(next) : null };
}

/** Texto de la tarjeta (solo de ella): en una tarjeta pendiente se guarda en el acorde, que solo la contiene a ella. */
export function setCardTextValue(event, voicing, key, value) {
  if (voicing) setCardText(event, voicing, key, value, false);
  else setEventDefault(event, key, value);
}
