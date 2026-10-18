import { FAMILIES } from './families.js';
import { isColor, paletteDefaults } from './paletteDefaults.js';

export { isColor };

/** Tinta oscura general (líneas, textos, barras) y base del cálculo de contraste. No es el color de las notas sin grado. */
export const inkColor = () => paletteDefaults().ink;
/** Tinta atenuada de las etiquetas del mástil (números de traste) cuando la tarjeta no tiene un fondo propio que obligue a otro color. */
export const mutedColor = () => paletteDefaults().muted;
/** Fondo neutro de las notas sin grado o sin color propio (independiente de la tinta). */
export const defaultNoteColor = () => paletteDefaults().note.bg;
/** Texto predeterminado de un grado. */
export const defaultTextColor = () => paletteDefaults().text.default;
export const normalizeDegree = label => String(label).trim().replace(/♭/g, 'b').replace(/♯/g, '#');
export const isPaletteLabel = label => typeof label === 'string' && label.length > 0 && label.length <= 64 && [...label].length <= 32 && !['__proto__', 'constructor', 'prototype'].includes(label);
const own = (object, key) => object && Object.prototype.hasOwnProperty.call(object, key);

function luminance(hex) {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}

/** Selección automática entre tinta y blanco para que se lea sobre cualquier fondo elegido. */
export function foreground(bg) {
  const lum = luminance(bg);
  const { ink, text } = paletteDefaults();
  const dark = (lum + .05) / (luminance(ink) + .05);
  const light = 1.05 / (lum + .05);
  if (dark < 4.5 && light < 4.5) return text.fallback;
  return dark >= light ? ink : text.light;
}

/** Color de plantilla de un grado (config/palette-defaults.json); los alterados no listados usan el de su grado natural. */
export function defaultDegreeColor(label) {
  const { degrees, naturalDegrees } = paletteDefaults();
  if (own(degrees, label)) return degrees[label];
  const match = /^(?:bb|##|b|#)?([1-9]|1[0-3])$/.exec(label);
  return match ? degrees[naturalDegrees[match[1]]] : null;
}

/** Fondo, borde y acento predeterminados de una calidad de acorde. */
export function familyOf(key) {
  const { families } = paletteDefaults();
  return own(families, key) ? families[key] : families.other;
}

export function familyStyle(key) {
  const f = familyOf(key);
  return `--fam-bg:${f.bg};--fam-bd:${f.bd}`;
}

/** Valor de un mapa por etiqueta, con ♭/♯ normalizados (b3 y ♭3 son la misma entrada). */
function lookup(entries, key) {
  if (own(entries, key)) return entries[key];
  return Object.entries(entries || {}).find(([name]) => normalizeDegree(name) === key)?.[1];
}

/**
 * Fondo y texto efectivos de una nota sin grado o sin color propio.
 * El texto predeterminado es blanco si el usuario eligió el fondo y tinta oscura sobre el gris claro de serie.
 */
export function neutralNote(palette) {
  const custom = isColor(palette?.note);
  const { note } = paletteDefaults();
  const bg = custom ? palette.note : note.bg;
  return { bg, fg: isColor(palette?.noteText) ? palette.noteText : custom ? note.textOnCustomBg : note.text };
}

/**
 * Color de un grado: { bg, fg } o null si no hay nada definido para esa etiqueta (la nota usa entonces neutralNote).
 * Fondo y texto son independientes: un texto propio nunca lo sobrescribe el cálculo de contraste, y sin texto propio el
 * predeterminado es blanco, salvo el texto de la plantilla (config/palette-defaults.json) en los grados que lo definen, p. ej. los dorados, (b7, 7, 13…) mientras su fondo no se
 * personalice. Con un fondo personalizado el texto vuelve a ser blanco.
 */
export function paletteDegreeColor(label, palette) {
  const key = normalizeDegree(label);
  const bgValue = lookup(palette?.degrees, key);
  const textValue = lookup(palette?.degreeText, key);
  const customBg = isColor(bgValue);
  const customText = isColor(textValue);
  const base = customBg ? null : defaultDegreeColor(key);
  if (!customBg && !customText) return base;
  const bg = customBg ? bgValue : base ? base.bg : neutralNote(palette).bg;
  const fg = customText ? textValue : base && !customBg ? base.fg : defaultTextColor();
  return { bg, fg };
}

export function familyBackground(key, palette) {
  const family = own(FAMILIES, key) ? key : 'other';
  const value = own(palette?.families, family) ? palette.families[family] : null;
  return isColor(value) ? value : familyOf(family).bg;
}

export function familyForeground(key, palette) {
  const family = own(FAMILIES, key) ? key : 'other';
  return isColor(palette?.families?.[family]) ? foreground(familyBackground(family, palette)) : null;
}

export function paletteFamilyStyle(key, palette, card = false) {
  const family = own(FAMILIES, key) ? key : 'other';
  if (!isColor(palette?.families?.[family])) return familyStyle(family);
  const bg = palette.families[family];
  const fg = foreground(bg);
  const border = '#' + [1, 3, 5].map(i => Math.round(parseInt(bg.slice(i, i + 2), 16) * .75).toString(16).padStart(2, '0')).join('');
  return `--fam-bg:${bg};--fam-bd:${border}` + (card ? `;--ink-deep:${fg};--ink-soft:${fg};--ink-mute:${fg}` : '');
}

const mixColor = (a, b, amount) => '#' + [1, 3, 5].map(i => Math.round(
  parseInt(a.slice(i, i + 2), 16) * amount + parseInt(b.slice(i, i + 2), 16) * (1 - amount)
).toString(16).padStart(2, '0')).join('');

/** Respeta la calidad y la paleta sin almacenar colores derivados en la canción. */
export function tonalityBandStyle(key, palette) {
  const family = own(FAMILIES, key) ? key : 'other';
  // Acento de la franja: el de la paleta o el predeterminado de la calidad; fondo al 10 % y línea inferior como en la plantilla.
  const color = isColor(palette?.families?.[family]) ? palette.families[family] : familyOf(family).accent;
  const background = mixColor(color, '#ffffff', .1);
  let ink = color;
  for (let i = 0; i < 24 && (luminance(background) + .05) / (luminance(ink) + .05) < 4.5; i++) {
    ink = mixColor(ink, '#000000', .85);
  }
  return `--tonal-color:${color};--tonal-bg:${background};--tonal-ink:${ink}`;
}

export function setPaletteColor(song, group, key, color) {
  if (!isColor(color)) return false;
  if (group === 'families' && !own(FAMILIES, key)) return false;
  if (group === 'degrees' || group === 'degreeText') { if (typeof key !== 'string') return false; key = normalizeDegree(key); if (!isPaletteLabel(key)) return false; }
  if (!['families', 'degrees', 'degreeText', 'note', 'noteText'].includes(group)) return false;
  song.palette ??= {};
  if (group === 'note' || group === 'noteText') song.palette[group] = color;
  else { song.palette[group] ??= {}; song.palette[group][key] = color; }
  return true;
}

export function resetPaletteColor(song, group, key) {
  if (!song.palette) return;
  if (group === 'note' || group === 'noteText') delete song.palette[group];
  else if (song.palette[group]) {
    delete song.palette[group][key];
    if (!Object.keys(song.palette[group]).length) delete song.palette[group];
  }
  if (!Object.keys(song.palette).length) delete song.palette;
}
