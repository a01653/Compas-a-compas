/**
 * Calidades de acorde: claves y etiquetas. Los colores (fondo, borde, acento) viven en config/palette-defaults.json
 * y se leen con familyOf() (model/palette.js); «disminuido» y «otro» son neutros propuestos.
 */
export const FAMILIES = {
  major: { label: 'Mayor' },
  minor: { label: 'Menor' },
  dominant: { label: 'Dominante' },
  'half-diminished': { label: 'Semidisminuido' },
  diminished: { label: 'Disminuido' },
  other: { label: 'Otro' },
};
