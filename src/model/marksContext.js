import { listMarks } from './marks.js';

/** Vista de las marcas que están escritas en un compás o cuyo tramo lo incluye. No modifica datos. */
export function marksForMeasure(song, measureId) {
  const index = song.measures.findIndex(measure => measure.id === measureId);
  if (index < 0) return [];
  return listMarks(song).filter(({ kind, item }) => {
    if (kind === 'marker' || kind === 'jump') return item.measureId === measureId;
    const start = song.measures.findIndex(measure => measure.id === item.startMeasureId);
    const end = song.measures.findIndex(measure => measure.id === item.endMeasureId);
    // Un extremo pendiente sigue localizable desde el que aún existe, y en «Ver todas».
    if (start < 0 || end < 0) return item.startMeasureId === measureId || item.endMeasureId === measureId;
    return index >= Math.min(start, end) && index <= Math.max(start, end);
  });
}
