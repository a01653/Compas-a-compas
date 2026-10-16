import { parseFrets } from './frets.js';

/**
 * Formato: `etiqueta | acorde @ digitación ; acorde @ digitación`, una línea por compás.
 * Otro voicing del mismo acorde se separa con « / » (con espacios) dentro de la digitación.
 * La barra de «C/E» no separa nada: solo se analiza después de «@».
 * Devuelve { measures, errors }. Si hay errores no se debe aplicar nada.
 */
export function parseList(input) {
  const measures = [];
  const errors = [];

  String(input).split(/\r?\n/).forEach((raw, i) => {
    const lineNo = i + 1;
    if (!raw.trim()) return;
    const lineErrors = [];
    const bar = raw.indexOf('|');
    if (bar < 0) {
      errors.push({ lineNo, message: 'falta «|» después de la etiqueta del compás' });
      return;
    }
    const label = raw.slice(0, bar).trim();
    if (!label) lineErrors.push('la etiqueta del compás está vacía');

    const events = [];
    const rest = raw.slice(bar + 1).trim();
    if (rest) {
      rest.split(';').forEach((segment, k) => {
        const seg = segment.trim();
        if (!seg) {
          lineErrors.push(`el acorde ${k + 1} está vacío (¿sobra un «;»?)`);
          return;
        }
        const at = seg.indexOf('@');
        const chordName = (at < 0 ? seg : seg.slice(0, at)).trim();
        if (!chordName) {
          lineErrors.push(`el acorde ${k + 1} no tiene nombre`);
          return;
        }
        const voicings = [];
        if (at >= 0) {
          const fretsText = seg.slice(at + 1).trim();
          if (!fretsText) {
            lineErrors.push(`«${chordName}»: falta la digitación después de «@»`);
          } else {
            fretsText.split(/\s+\/\s+/).forEach((part, j) => {
              const result = parseFrets(part);
              if (result.error) lineErrors.push(`«${chordName}», voicing ${j + 1}: ${result.error}`);
              else voicings.push(result.frets);
            });
          }
        }
        events.push({ chordName, voicings });
      });
    }

    if (lineErrors.length) lineErrors.forEach((message) => errors.push({ lineNo, message }));
    else measures.push({ label, events });
  });

  return { measures, errors };
}

/** Resumen legible de un compás de la previsualización. */
export function describeParsedMeasure(m) {
  if (!m.events.length) return 'vacío';
  return m.events
    .map((e) => `${e.chordName} (${e.voicings.length === 0 ? 'sin digitación' : e.voicings.length === 1 ? '1 voicing' : `${e.voicings.length} voicings`})`)
    .join(' · ');
}
