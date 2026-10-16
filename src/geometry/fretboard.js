/** Geometría del mástil horizontal. Pura: solo calcula posiciones a partir de las notas. */

export const GEOM = {
  cell: 30,       // ancho de un traste
  gap: 16,        // separación entre cuerdas
  zone: 26,       // zona exterior para cuerdas al aire y mudas
  padTop: 10,
  padBottom: 18,  // números de traste
  minFrets: 3,
};

const isFret = (f) => Number.isInteger(f) && f >= 0;

/** frets: seis valores sexta→primera (entero ≥ 0 o null). */
export function fretRange(frets) {
  const valid = frets.filter(isFret);
  const positives = valid.filter((f) => f > 0);
  const hasOpen = valid.includes(0);
  const start = hasOpen ? 1 : positives.length ? Math.min(...positives) : 1;
  const max = positives.length ? Math.max(...positives) : 0;
  const count = Math.max(GEOM.minFrets, max - start + 1);
  return { start, count, end: start + count - 1, hasOpen };
}

/** Primera cuerda arriba: la fila 0 es frets[5]. No se invierte el dato almacenado. */
export function layoutFretboard(frets, degrees) {
  const { cell, gap, zone, padTop, padBottom } = GEOM;
  const range = fretRange(frets);
  const { start, count, hasOpen } = range;

  const width = zone + count * cell + 4;
  const height = padTop + 5 * gap + padBottom;
  const stringsBottom = padTop + 5 * gap;

  const strings = [];
  const marks = [];
  for (let row = 0; row < 6; row++) {
    const index = 5 - row;
    const y = padTop + row * gap;
    strings.push({ y });
    const fret = frets[index];
    if (!isFret(fret) && fret !== null) continue;
    if (fret === null) marks.push({ kind: 'mute', x: zone - 12, y });
    else if (fret === 0) marks.push({ kind: 'open', x: zone - 12, y });
    else marks.push({ kind: 'dot', x: zone + (fret - start + 0.5) * cell, y, fret, degree: (degrees && degrees[index]) || null });
  }

  const fretLines = Array.from({ length: count + 1 }, (_, k) => ({ x: zone + k * cell, nut: k === 0 && hasOpen }));
  const labels = Array.from({ length: count }, (_, k) => ({ x: zone + (k + 0.5) * cell, y: stringsBottom + 14, text: String(start + k) }));

  return { ...range, width, height, stringsBottom, strings, fretLines, labels, marks };
}
