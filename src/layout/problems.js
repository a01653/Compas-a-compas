import { findUndrawableVoicings } from '../geometry/fretboard.js';

/**
 * Problemas que impiden una hoja completa. Mientras haya alguno, exportar e imprimir se bloquean:
 *  - 'undrawable': digitación con más trastes que GEOM.maxFrets (los datos se conservan, el dibujo no es legible);
 *  - 'header' | 'width' | 'height': algo no cabe ni solo en la hoja (ver paginate).
 */
export function collectProblems(song, layout) {
  const problems = [];
  for (const bad of findUndrawableVoicings(song)) {
    problems.push({ kind: 'undrawable', message: `Compás ${bad.measureLabel}, ${bad.chordName || 'sin nombre'}: ${bad.message}` });
  }
  for (const error of (layout && layout.errors) || []) problems.push({ kind: error.kind, message: error.message });
  return problems;
}
