/** Geometría del mástil horizontal. Pura: solo calcula posiciones a partir de las notas. */

export const GEOM = {
  cell: 30,       // ancho de un traste
  gap: 16,        // separación entre cuerdas
  zone: 26,       // zona exterior para cuerdas al aire y mudas
  padTop: 10,
  padBottom: 18,  // números de traste
  minFrets: 3,
  maxFrets: 32,   // capacidad legible de UNA fila A4 (1123 - 64 márgenes - 48 barra/relleno - 30 zone+4) / 30 = 32 trastes
};

const isFret = (f) => Number.isInteger(f) && f >= 0;

/**
 * frets: seis valores sexta→primera (entero ≥ 0 o null). Un solo recorrido, sin copias:
 * valores enormes solo producen un número grande en `count`, nunca una estructura grande.
 */
export function fretRange(frets) {
  let min = Infinity;
  let max = 0;
  let hasOpen = false;
  for (const f of Array.isArray(frets) ? frets : []) {
    if (!isFret(f)) continue;
    if (f === 0) hasOpen = true;
    else {
      if (f < min) min = f;
      if (f > max) max = f;
    }
  }
  const start = hasOpen ? 1 : max > 0 ? min : 1;
  const count = Math.max(GEOM.minFrets, max - start + 1);
  return { start, count, end: start + count - 1, hasOpen };
}

/** Texto de aviso si el rango no se puede dibujar legiblemente; null si se puede. */
export function spanMessage(range) {
  if (range.count <= GEOM.maxFrets) return null;
  const shown = range.count > 9999 ? 'más de 9999' : String(range.count);
  return `abarca ${shown} trastes y no se puede dibujar legiblemente (máximo ${GEOM.maxFrets}). Los datos se conservan sin cambios.`;
}

/** Primera cuerda arriba: la fila 0 es frets[5]. No se invierte el dato almacenado. */
export function layoutFretboard(frets, degrees) {
  const { cell, gap, zone, padTop, padBottom } = GEOM;
  const range = fretRange(frets);
  const { start, count, hasOpen } = range;
  const stringsBottom = padTop + 5 * gap;
  const height = padTop + 5 * gap + padBottom;

  const reason = spanMessage(range);
  if (reason) {
    // No se construye ninguna lista por traste: el coste no depende del valor de las notas.
    return { ...range, drawable: false, reason, width: zone + GEOM.minFrets * cell + 4, height, stringsBottom, strings: [], fretLines: [], labels: [], marks: [] };
  }

  const width = zone + count * cell + 4;
  const strings = [];
  const marks = [];
  for (let row = 0; row < 6; row++) {
    const index = 5 - row;
    const y = padTop + row * gap;
    strings.push({ y });
    const fret = frets[index];
    const degree = (degrees && typeof degrees[index] === 'string' && degrees[index] !== '' && degrees[index]) || null;
    if (fret === null) marks.push({ kind: 'mute', x: zone - 12, y, degree: null });
    else if (!isFret(fret)) continue;
    else if (fret === 0) marks.push({ kind: 'open', x: zone - 12, y, degree });
    else marks.push({ kind: 'dot', x: zone + (fret - start + 0.5) * cell, y, fret, degree });
  }

  const fretLines = Array.from({ length: count + 1 }, (_, k) => ({ x: zone + k * cell, nut: k === 0 && hasOpen }));
  const labels = Array.from({ length: count }, (_, k) => ({ x: zone + (k + 0.5) * cell, y: stringsBottom + 14, text: String(start + k) }));

  return { ...range, drawable: true, reason: null, width, height, stringsBottom, strings, fretLines, labels, marks };
}

/** Voicings que no se pueden dibujar legiblemente. La exportación (fase 4) debe bloquearse si hay alguno. */
export function findUndrawableVoicings(song) {
  const found = [];
  for (const measure of song.measures || []) {
    for (const event of measure.chordEvents || []) {
      for (const voicing of event.voicings || []) {
        const range = fretRange(voicing.frets);
        const message = spanMessage(range);
        if (message) {
          found.push({
            measureId: measure.id, measureLabel: measure.label,
            eventId: event.id, chordName: event.chordName,
            voicingId: voicing.id, count: range.count, message,
          });
        }
      }
    }
  }
  return found;
}
