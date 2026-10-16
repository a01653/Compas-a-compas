/** Paletas pastel por familia (valores de la plantilla; «disminuido» y «otro» son neutros propuestos). */
export const FAMILIES = {
  major: { label: 'Mayor', bg: '#eaf4fe', bd: '#a6cbe9' },
  minor: { label: 'Menor', bg: '#efeafc', bd: '#bfb1e8' },
  dominant: { label: 'Dominante', bg: '#e7f8f3', bd: '#93d6c4' },
  'half-diminished': { label: 'Semidisminuido', bg: '#fdf6e2', bd: '#e6cd92' },
  diminished: { label: 'Disminuido', bg: '#fdecef', bd: '#e8a9b8' },
  other: { label: 'Otro', bg: '#f1f2f6', bd: '#c3c9d6' },
};

export function familyOf(key) {
  return FAMILIES[key] || FAMILIES.other;
}

export function familyStyle(key) {
  const f = familyOf(key);
  return `--fam-bg:${f.bg};--fam-bd:${f.bd}`;
}

/** Colores de grados manuales definidos en la plantilla. */
const GOLD = { bg: '#EDBC07', fg: '#3d2f00' };
const VIOLET = { bg: '#7C3AED', fg: '#ffffff' };
const SKY = { bg: '#0284C7', fg: '#ffffff' };
const GREEN = { bg: '#059669', fg: '#ffffff' };
export const DEGREE_COLORS = {
  '1': { bg: '#E11D48', fg: '#ffffff' },
  b3: SKY, '3': SKY,
  '5': GREEN, b5: GREEN,
  b7: GOLD, '7': GOLD, '13': GOLD, b13: GOLD,
  '9': VIOLET, b9: VIOLET, '11': VIOLET, '#9': VIOLET, '#11': VIOLET,
};
