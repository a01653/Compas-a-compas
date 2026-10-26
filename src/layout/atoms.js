/**
 * Unidades de reparto. Módulo puro: no mide ni dibuja.
 *
 * Cada compás es una unidad y cada tarjeta (un voicing, o un evento sin digitación) es un átomo indivisible:
 * el título exterior y su tarjeta nunca se separan. Un compás se parte siempre entre átomos, en fragmentos
 * contiguos [from, to) que conservan el orden escrito.
 */

/** @returns {Array<{ measureId: string, label: string, index: number, atoms: Array<object> }>} */
export function buildUnits(song) {
  // Parejas de repetición de dos compases válidas para dibujar: el primer destino lleva la marca y el siguiente está vacío.
  const pairRole = new Map();
  song.measures.forEach((measure, index) => {
    const pair = measure.repeatPreviousTwo;
    const second = song.measures[index + 1];
    if (pair && second && pair.targetMeasureIds[0] === measure.id && pair.targetMeasureIds[1] === second.id
      && !measure.chordEvents.length && !second.chordEvents.length && !second.repeatPrevious && !second.repeatPreviousTwo
      && !pairRole.has(measure.id)) {
      pairRole.set(measure.id, 'first');
      pairRole.set(second.id, 'second');
    }
  });
  return song.measures.map((measure, index) => {
    const atoms = [];
    measure.chordEvents.forEach((event, eventIndex) => {
      if (!event.voicings.length) {
        atoms.push({ eventId: event.id, voicingId: null, eventIndex, firstOfEvent: true, lastOfEvent: true });
        return;
      }
      event.voicings.forEach((voicing, i) => {
        atoms.push({
          eventId: event.id,
          voicingId: voicing.id,
          eventIndex,
          firstOfEvent: i === 0,
          lastOfEvent: i === event.voicings.length - 1,
        });
      });
    });
    return { measureId: measure.id, label: measure.label, index, atoms, repeatPrevious: Boolean(measure.repeatPrevious) && !pairRole.has(measure.id),
      repeatPair: pairRole.get(measure.id) || null,
      widthPercent: Number.isFinite(measure.widthPercent) ? measure.widthPercent : null,
      fillToEdge: measure.fillToEdge === true };
  });
}

/** Primer y último fragmento de un compás: de ellos depende qué símbolos de borde se dibujan (ver fragmentMarks). */
export function fragmentFlags(unit, from, to) {
  return { isFirst: from === 0, isLast: to >= unit.atoms.length };
}

/**
 * Agrupa los átomos [from, to) por evento. `cutBefore`/`cutAfter` indican que el evento continúa en el
 * fragmento anterior o en el siguiente, para que los voicings de un mismo acorde sigan siendo reconocibles.
 */
export function groupAtoms(unit, from, to) {
  const groups = [];
  for (let i = from; i < to; i++) {
    const atom = unit.atoms[i];
    const last = groups[groups.length - 1];
    if (last && last.eventId === atom.eventId) last.atoms.push(atom);
    else groups.push({ eventId: atom.eventId, eventIndex: atom.eventIndex, atoms: [atom], cutBefore: !atom.firstOfEvent, cutAfter: false });
  }
  for (const group of groups) group.cutAfter = !group.atoms[group.atoms.length - 1].lastOfEvent;
  return groups;
}

/**
 * Columnas de los títulos exteriores de un fragmento, a partir del título efectivo de cada tarjeta ('' = sin título).
 * Cada título empieza en su tarjeta y ocupa las siguientes hasta la próxima con título o el final del fragmento:
 * [{ start, end }] con `end` exclusivo, en índices de tarjeta del fragmento.
 */
export function titleSpans(texts) {
  const starts = texts.flatMap((text, i) => (text ? [i] : []));
  return starts.map((start, k) => ({ start, end: k + 1 < starts.length ? starts[k + 1] : texts.length }));
}
