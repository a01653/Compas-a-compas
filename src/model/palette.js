import { DEGREE_COLORS, FAMILIES, familyStyle } from './families.js';

export const DEFAULT_NOTE_COLOR = '#14183a';
export const isColor = value => typeof value === 'string' && value.length === 7 && /^#[0-9a-fA-F]{6}$/.test(value);
export const normalizeDegree = label => String(label).trim().replace(/♭/g, 'b').replace(/♯/g, '#');
export const isPaletteLabel = label => typeof label === 'string' && label.length > 0 && label.length <= 64 && [...label].length <= 32 && !['__proto__', 'constructor', 'prototype'].includes(label);
const own = (object, key) => object && Object.prototype.hasOwnProperty.call(object, key);

const NATURAL = {
  '1': DEGREE_COLORS['1'], '2': DEGREE_COLORS['9'], '3': DEGREE_COLORS['3'],
  '4': DEGREE_COLORS['11'], '5': DEGREE_COLORS['5'], '6': DEGREE_COLORS['13'],
  '7': DEGREE_COLORS['7'], '8': DEGREE_COLORS['1'], '9': DEGREE_COLORS['9'],
  '10': DEGREE_COLORS['3'], '11': DEGREE_COLORS['11'], '12': DEGREE_COLORS['5'], '13': DEGREE_COLORS['13'],
};

function luminance(hex) {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}

/** Selección automática entre tinta y blanco para que se lea sobre cualquier fondo elegido. */
export function foreground(bg) {
  const lum = luminance(bg);
  const dark = (lum + .05) / (luminance(DEFAULT_NOTE_COLOR) + .05);
  const light = 1.05 / (lum + .05);
  if (dark < 4.5 && light < 4.5) return '#000000';
  return dark >= light ? DEFAULT_NOTE_COLOR : '#ffffff';
}

export function defaultDegreeColor(label) {
  if (own(DEGREE_COLORS, label)) return DEGREE_COLORS[label];
  const match = /^(?:bb|##|b|#)?([1-9]|1[0-3])$/.exec(label);
  return match ? NATURAL[match[1]] : null;
}

export function paletteDegreeColor(label, palette) {
  const key = normalizeDegree(label);
  const entries = palette?.degrees;
  const value = own(entries, key) ? entries[key] : Object.entries(entries || {}).find(([name]) => normalizeDegree(name) === key)?.[1];
  if (isColor(value)) return { bg: value, fg: foreground(value) };
  return defaultDegreeColor(key);
}

export function familyBackground(key, palette) {
  const family = own(FAMILIES, key) ? key : 'other';
  const value = own(palette?.families, family) ? palette.families[family] : null;
  return isColor(value) ? value : FAMILIES[family].bg;
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

export function setPaletteColor(song, group, key, color) {
  if (!isColor(color)) return false;
  if (group === 'families' && !own(FAMILIES, key)) return false;
  if (group === 'degrees') { if (typeof key !== 'string') return false; key = normalizeDegree(key); if (!isPaletteLabel(key)) return false; }
  if (!['families', 'degrees', 'note'].includes(group)) return false;
  song.palette ??= {};
  if (group === 'note') song.palette.note = color;
  else { song.palette[group] ??= {}; song.palette[group][key] = color; }
  return true;
}

export function resetPaletteColor(song, group, key) {
  if (!song.palette) return;
  if (group === 'note') delete song.palette.note;
  else if (song.palette[group]) {
    delete song.palette[group][key];
    if (!Object.keys(song.palette[group]).length) delete song.palette[group];
  }
  if (!Object.keys(song.palette).length) delete song.palette;
}
