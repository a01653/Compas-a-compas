import { paletteDegreeColor } from './palette.js';

/** Grados manuales opcionales: seis etiquetas sexta→primera; null = sin grado. No se infiere nada. */

/** Texto de los seis campos de entrada → array de 6 (null si vacío) o undefined si no hay ninguno. */
export function degreesFromInputs(values) {
  const out = Array.from({ length: 6 }, (_, i) => {
    const text = typeof values[i] === 'string' ? values[i].trim() : '';
    return text === '' ? null : text;
  });
  return out.every((d) => d === null) ? undefined : out;
}

export function degreesToInputs(degrees) {
  return Array.from({ length: 6 }, (_, i) => (Array.isArray(degrees) && typeof degrees[i] === 'string' ? degrees[i] : ''));
}

/** Asigna o elimina voicing.degrees sin tocar frets ni textos. */
export function applyDegrees(voicing, values) {
  const degrees = degreesFromInputs(values);
  if (degrees) voicing.degrees = degrees;
  else delete voicing.degrees;
  return voicing;
}

/** Color definido por la plantilla para un grado manual (acepta ♭ y ♯); null si no hay uno definido. */
export function degreeColor(label, palette) {
  if (typeof label !== 'string') return null;
  return paletteDegreeColor(label, palette);
}

/** Cómo se escribe una etiqueta dentro de un punto: las largas se abrevian en el dibujo, no en el dato. */
export function degreeDisplay(label) {
  const chars = [...String(label)];
  if (chars.length <= 2) return { text: chars.join(''), fontSize: 10.5, truncated: false };
  if (chars.length === 3) return { text: chars.join(''), fontSize: 8.5, truncated: false };
  return { text: `${chars.slice(0, 2).join('')}…`, fontSize: 8.5, truncated: true };
}
