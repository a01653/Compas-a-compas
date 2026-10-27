import { createIdFactory } from './ids.js';
import { addVoicing, emptyFrets, findMeasure, setCardText, setEventDefault } from './song.js';

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

/* ---------- Copiar, pegar y ordenar tarjetas ---------- */

const position = (cards, eventId, voicingId) => cards.findIndex(card => card.event.id === eventId && (card.voicing ? card.voicing.id : null) === (voicingId ?? null));

/** Contenido copiable de una tarjeta: datos del acorde (nombre, calidad y textos) y su voicing completo, o null si no existe. */
export function copyCard(measure, eventId, voicingId = null) {
  const card = flatCards(measure)[position(flatCards(measure), eventId, voicingId)];
  if (!card) return null;
  return { event: shell(clone(card.event), card.event.id, []), voicing: card.voicing ? clone(card.voicing) : null };
}

/** Tarjeta independiente con IDs nuevos, justo después de la seleccionada (o al final si el compás está vacío). */
export function pasteCard(song, measureId, selected, payload) {
  const [created] = pasteCards(song, measureId, selected, payload ? [payload] : []);
  if (!created) return null;
  const event = findMeasure(song, measureId).chordEvents.find(e => e.id === created.eventId);
  return { event, voicing: event.voicings[0] || null };
}

/** Parte el acorde justo antes de la tarjeta si la preceden otras; devuelve la posición de inserción delante de ella. */
function insertionBefore(measure, event, voicing, newId) {
  const eventIndex = measure.chordEvents.indexOf(event);
  const index = voicing ? event.voicings.indexOf(voicing) : -1;
  if (index > 0) {
    const tail = shell(event, newId('e'), event.voicings.slice(index));
    event.voicings = event.voicings.slice(0, index);
    measure.chordEvents.splice(eventIndex + 1, 0, tail);
    return eventIndex + 1;
  }
  return eventIndex;
}

/**
 * Pega tarjetas copiadas como tarjetas independientes con IDs nuevos, en su orden, antes o después de la seleccionada. Sin
 * tarjeta seleccionada van al principio ('before') o al final ('after') del compás. Devuelve sus selecciones completas.
 */
export function pasteCards(song, measureId, selected, payloads, side = 'after') {
  const measure = findMeasure(song, measureId);
  if (!measure || !payloads?.length) return [];
  const newId = createIdFactory(song);
  const event = measure.chordEvents.find(e => e.id === selected?.eventId);
  const voicing = event?.voicings.find(v => v.id === selected?.voicingId) || null;
  const at = !event ? (side === 'before' ? 0 : measure.chordEvents.length)
    : side === 'before' ? insertionBefore(measure, event, voicing, newId) : insertionAfter(song, measure, event, voicing, newId);
  const created = payloads.map(p => shell(clone(p.event), newId('e'), p.voicing ? [{ ...clone(p.voicing), id: newId('v') }] : []));
  measure.chordEvents.splice(at, 0, ...created);
  return created.map(e => ({ measureId, eventId: e.id, voicingId: e.voicings[0]?.id ?? null }));
}

/** Campos que forman la digitación de un voicing. */
export const FINGERING_FIELDS = ['frets', 'degrees', 'anchorFret'];

/**
 * Cambia solo la digitación de la tarjeta por la de `source`: trastes, grados por cuerda y traste de referencia. Nombre,
 * calidad, textos, grado de la tarjeta y tonalidad no cambian. Una tarjeta pendiente recibe su voicing. Devuelve el voicing.
 */
export function pasteFingering(song, event, voicing, source) {
  const target = voicing || addVoicing(song, event);
  for (const key of FINGERING_FIELDS) {
    if (source[key] === undefined) delete target[key];
    else target[key] = clone(source[key]);
  }
  return target;
}

/** ¿Puede la tarjeta desplazarse una posición dentro del compás? delta -1 antes, +1 después. */
export function canMoveCard(measure, eventId, voicingId, delta) {
  const cards = flatCards(measure);
  const p = position(cards, eventId, voicingId);
  return p >= 0 && p + delta >= 0 && p + delta < cards.length;
}

/**
 * Intercambia la tarjeta con su vecina. Dentro de un mismo acorde (archivos con varios voicings por acorde) se reordenan sus
 * voicings; entre acordes distintos, cada tarjeta se separa antes en su propio acorde (isolateCard) y se intercambian los
 * acordes, sin cambiar textos efectivos. Devuelve la nueva selección de la tarjeta movida, o null.
 */
export function moveCard(song, measureId, eventId, voicingId, delta) {
  const measure = findMeasure(song, measureId);
  if (!measure || !canMoveCard(measure, eventId, voicingId, delta)) return null;
  const cards = flatCards(measure);
  const p = position(cards, eventId, voicingId);
  const a = cards[p];
  const b = cards[p + delta];
  if (a.event === b.event) {
    const list = a.event.voicings;
    [list[a.voicingIndex], list[b.voicingIndex]] = [list[b.voicingIndex], list[a.voicingIndex]];
    return selectionOf(a);
  }
  const moving = isolateCard(song, measure, a.event, a.voicing);
  const other = isolateCard(song, measure, b.event, b.voicing);
  const i = measure.chordEvents.indexOf(moving);
  const j = measure.chordEvents.indexOf(other);
  [measure.chordEvents[i], measure.chordEvents[j]] = [measure.chordEvents[j], measure.chordEvents[i]];
  return { eventId: moving.id, voicingId: a.voicing ? a.voicing.id : null };
}

/* ---------- Varias tarjetas (selección múltiple) ---------- */

/** Clave de una selección { eventId, voicingId }, igual que la de flatCards. */
export const selectionKey = sel => (sel.voicingId ? `v:${sel.voicingId}` : `e:${sel.eventId}`);

/** Todas las tarjetas de la canción en orden escrito, cada una con su compás. */
export function songCards(song) {
  return song.measures.flatMap(measure => flatCards(measure).map(card => ({ ...card, measure })));
}

/** Selección completa ({ measureId, eventId, voicingId }) de una clave de tarjeta, o null si ya no existe. */
export function cardSelection(song, key) {
  const card = songCards(song).find(c => c.key === key);
  return card ? { measureId: card.measure.id, ...selectionOf(card) } : null;
}

const cardsOf = (song, keys) => {
  const wanted = new Set(keys);
  return songCards(song).filter(card => wanted.has(card.key));
};

/** ¿Hay exactamente dos tarjetas distintas que intercambiar? */
export const canSwapCards = (song, keys) => new Set(keys).size === 2 && cardsOf(song, keys).length === 2;

/**
 * Intercambia las posiciones de dos tarjetas, en el mismo compás o en compases distintos. Cada una viaja con su nombre, calidad,
 * textos, grado, tonalidad y digitación, como al moverla (moveCard): dentro de un mismo acorde se reordenan sus voicings; si no,
 * cada tarjeta se separa antes en su propio acorde (isolateCard) y se intercambian los acordes. Devuelve las dos selecciones
 * resultantes en orden escrito, o [] si no son exactamente dos.
 */
export function swapCards(song, keys) {
  if (!canSwapCards(song, keys)) return [];
  const [a, b] = cardsOf(song, keys);
  if (a.event === b.event) {
    const list = a.event.voicings;
    [list[a.voicingIndex], list[b.voicingIndex]] = [list[b.voicingIndex], list[a.voicingIndex]];
  } else {
    const first = isolateCard(song, a.measure, a.event, a.voicing);
    const second = isolateCard(song, b.measure, b.event, b.voicing);
    const i = a.measure.chordEvents.indexOf(first);
    const j = b.measure.chordEvents.indexOf(second);
    a.measure.chordEvents[i] = second;
    b.measure.chordEvents[j] = first;
  }
  const order = songCards(song).map(card => card.key);
  return keys.map(key => cardSelection(song, key)).filter(Boolean)
    .sort((x, y) => order.indexOf(selectionKey(x)) - order.indexOf(selectionKey(y)));
}

/** Contenido copiable de varias tarjetas, en orden escrito aunque estén salteadas o en compases distintos. */
export function copyCards(song, keys) {
  return cardsOf(song, keys).map(card => copyCard(card.measure, card.event.id, card.voicing ? card.voicing.id : null));
}

/**
 * Quita varias tarjetas (y cada acorde que se quede sin ninguna). `next` es la tarjeta que ocupa el lugar de la primera
 * quitada en su compás, o null si ese compás queda vacío.
 */
export function removeCards(song, keys) {
  const cards = cardsOf(song, keys);
  if (!cards.length) return { removed: 0, measureId: null, next: null };
  const first = cards[0];
  const at = flatCards(first.measure).findIndex(card => card.key === first.key);
  for (const { measure, event, voicing } of cards) {
    if (voicing) event.voicings.splice(event.voicings.indexOf(voicing), 1);
    if (!voicing || !event.voicings.length) measure.chordEvents.splice(measure.chordEvents.indexOf(event), 1);
  }
  const after = flatCards(first.measure);
  const next = after[Math.min(at, after.length - 1)];
  return { removed: cards.length, measureId: first.measure.id, next: next ? selectionOf(next) : null };
}

/** Una digitación copiada sirve para todas las tarjetas; varias, para otras tantas y en orden. Todas deben tener digitación. */
export function canReplaceFingerings(targetCount, payloads) {
  return targetCount > 0 && Boolean(payloads?.length) && payloads.every(p => p.voicing)
    && (payloads.length === 1 || payloads.length === targetCount);
}

/** Sustituye la digitación de cada tarjeta (pasteFingering). Devuelve las selecciones, que cambian si una tarjeta estaba pendiente. */
export function replaceFingerings(song, keys, payloads) {
  const cards = cardsOf(song, keys);
  if (!canReplaceFingerings(cards.length, payloads)) return [];
  return cards.map((card, i) => {
    const target = pasteFingering(song, card.event, card.voicing, payloads[payloads.length === 1 ? 0 : i].voicing);
    return { measureId: card.measure.id, eventId: card.event.id, voicingId: target.id };
  });
}

/** Duplica las tarjetas: en cada compás, las copias van en orden tras la última tarjeta duplicada. Devuelve sus selecciones. */
export function duplicateCards(song, keys) {
  const groups = new Map();
  for (const card of cardsOf(song, keys)) {
    if (!groups.has(card.measure.id)) groups.set(card.measure.id, []);
    groups.get(card.measure.id).push(card);
  }
  const created = [];
  for (const [measureId, cards] of groups) {
    const payloads = cards.map(card => copyCard(card.measure, card.event.id, card.voicing ? card.voicing.id : null));
    created.push(...pasteCards(song, measureId, selectionOf(cards.at(-1)), payloads));
  }
  return created;
}

/** Una tarjeta copiada sustituye a todas las seleccionadas; varias, a otras tantas y en orden. */
export function canReplaceCards(targetCount, payloads) {
  return targetCount > 0 && Boolean(payloads?.length) && (payloads.length === 1 || payloads.length === targetCount);
}

/**
 * Sustituye cada tarjeta entera por una copiada: nombre, calidad, textos, grado, tonalidad y digitación. Conserva su posición y
 * su ID (una tarjeta que compartía acorde con otras se separa antes con isolateCard). Devuelve las selecciones resultantes.
 */
export function replaceCards(song, keys, payloads) {
  const wanted = cardsOf(song, keys).map(card => card.key);
  if (!canReplaceCards(wanted.length, payloads)) return [];
  return wanted.map((key, i) => {
    const card = songCards(song).find(c => c.key === key); // Se busca de nuevo: separar una tarjeta cambia el acorde de sus vecinas.
    const source = payloads[payloads.length === 1 ? 0 : i];
    const own = isolateCard(song, card.measure, card.event, card.voicing);
    for (const field of EVENT_FIELDS) {
      if (source.event[field] === undefined) delete own[field];
      else own[field] = clone(source.event[field]);
    }
    const id = card.voicing ? card.voicing.id : source.voicing ? createIdFactory(song)('v') : null;
    own.voicings = source.voicing ? [{ ...clone(source.voicing), id }] : [];
    return { measureId: card.measure.id, eventId: own.id, voicingId: id };
  });
}
