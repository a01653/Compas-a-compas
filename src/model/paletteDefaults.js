import { FAMILIES } from './families.js';

/**
 * Colores predeterminados de la aplicación (fondos y textos de calidades, grados y notas). Única fuente: config/palette-defaults.json.
 * La aplicación lo carga al iniciarse (`loadPaletteDefaults`) y lo valida; sin él no arranca y se muestra el motivo. La paleta de un JSON
 * (`song.palette`) siempre tiene prioridad y nunca se rellena con estos valores al abrir o guardar.
 */

export const PALETTE_DEFAULTS_PATH = 'config/palette-defaults.json';

export const isColor = (value) => typeof value === 'string' && value.length === 7 && /^#[0-9a-fA-F]{6}$/.test(value);

export class PaletteDefaultsError extends Error {
  constructor(problems) {
    super(`No se pueden usar los colores predeterminados (${PALETTE_DEFAULTS_PATH}): ${problems.join(' · ')}`);
    this.name = 'PaletteDefaultsError';
    this.problems = problems;
  }
}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const RESERVED = ['__proto__', 'constructor', 'prototype'];
const TOP = ['version', 'ink', 'muted', 'text', 'families', 'degrees', 'naturalDegrees', 'note'];

/** Lista de problemas (vacía si el fichero es válido). No modifica nada. */
export function validatePaletteDefaults(data) {
  const problems = [];
  const color = (value, path) => { if (!isColor(value)) problems.push(`${path} debe ser un color #RRGGBB (es ${JSON.stringify(value)})`); };
  const group = (value, path, keys, required = true) => {
    if (!isObject(value)) { problems.push(`${path} debe ser un objeto`); return false; }
    for (const key of Object.keys(value)) if (!keys.includes(key)) problems.push(`${path}.${key}: campo desconocido`);
    if (required) for (const key of keys) if (!Object.prototype.hasOwnProperty.call(value, key)) problems.push(`${path}.${key}: falta`);
    return true;
  };

  if (!isObject(data)) return ['el archivo debe contener un objeto JSON'];
  group(data, 'raíz', TOP);
  if (data.version !== 1) problems.push(`version debe ser 1 (es ${JSON.stringify(data.version)})`);
  color(data.ink, 'ink');
  color(data.muted, 'muted');
  if (group(data.text, 'text', ['default', 'light', 'fallback'])) for (const key of ['default', 'light', 'fallback']) color(data.text[key], `text.${key}`);
  if (group(data.note, 'note', ['bg', 'text', 'textOnCustomBg'])) for (const key of ['bg', 'text', 'textOnCustomBg']) color(data.note[key], `note.${key}`);
  if (group(data.families, 'families', Object.keys(FAMILIES))) {
    for (const family of Object.keys(FAMILIES)) {
      if (group(data.families[family], `families.${family}`, ['bg', 'bd', 'accent'])) {
        for (const key of ['bg', 'bd', 'accent']) color(data.families[family][key], `families.${family}.${key}`);
      }
    }
  }
  if (isObject(data.degrees)) {
    const labels = Object.keys(data.degrees);
    if (!labels.length) problems.push('degrees debe definir al menos un grado');
    for (const label of labels) {
      if (!label || [...label].length > 32 || RESERVED.includes(label)) problems.push(`degrees.${label}: etiqueta no admitida (1 a 32 caracteres)`);
      if (group(data.degrees[label], `degrees.${label}`, ['bg', 'fg'])) {
        color(data.degrees[label].bg, `degrees.${label}.bg`);
        color(data.degrees[label].fg, `degrees.${label}.fg`);
      }
    }
    if (isObject(data.naturalDegrees)) {
      const numbers = Array.from({ length: 13 }, (_, i) => String(i + 1));
      if (group(data.naturalDegrees, 'naturalDegrees', numbers)) {
        for (const n of numbers) {
          if (typeof data.naturalDegrees[n] !== 'string' || !Object.prototype.hasOwnProperty.call(data.degrees, data.naturalDegrees[n])) {
            problems.push(`naturalDegrees.${n} debe nombrar un grado definido en degrees (es ${JSON.stringify(data.naturalDegrees[n])})`);
          }
        }
      }
    } else problems.push('naturalDegrees debe ser un objeto');
  } else problems.push('degrees debe ser un objeto');
  return problems;
}

let active = null;

/** Valida e instala los valores. Lanza PaletteDefaultsError con todos los problemas encontrados. */
export function installPaletteDefaults(data) {
  const problems = validatePaletteDefaults(data);
  if (problems.length) throw new PaletteDefaultsError(problems);
  active = JSON.parse(JSON.stringify(data));
  return active;
}

/** Valores instalados; falla con un mensaje claro si todavía no se han cargado. */
export function paletteDefaults() {
  if (!active) throw new Error(`Los colores predeterminados no están cargados: falta instalar ${PALETTE_DEFAULTS_PATH} antes de usar la paleta.`);
  return active;
}

export const paletteDefaultsLoaded = () => active !== null;

/** Carga, valida e instala config/palette-defaults.json (navegador). Los errores indican qué falla. */
export async function loadPaletteDefaults(url = new URL('../../config/palette-defaults.json', import.meta.url)) {
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new PaletteDefaultsError([`no se pudo leer el archivo (${error.message})`]);
  }
  if (!response.ok) throw new PaletteDefaultsError([`no se encuentra el archivo (HTTP ${response.status})`]);
  let data;
  try {
    data = JSON.parse(await response.text());
  } catch (error) {
    throw new PaletteDefaultsError([`no es un JSON válido (${error.message})`]);
  }
  return installPaletteDefaults(data);
}
