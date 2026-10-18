/**
 * Tonalidades por posición y grado del voicing.
 *
 * La tonalidad es un contexto que se hereda en el orden escrito del documento (compases → acordes → posiciones).
 * No se reinicia por filas ni páginas y no expande repeticiones. Es independiente de la familia del acorde.
 */
export const TONALITY_FAMILIES = ['major', 'minor', 'dominant', 'half-diminished', 'diminished', 'other'];
export const DEFAULT_TONALITY_FAMILY = 'other';

const isFamily = value => TONALITY_FAMILIES.includes(value);
export const normalizeFamily = value => (isFamily(value) ? value : DEFAULT_TONALITY_FAMILY);

/* ---------- Edición ---------- */

/** Grado romano libre de la posición. Vacío borra el campo. */
export function setVoicingDegree(voicing, value) {
  const clean = String(value ?? '').trim();
  if (clean) voicing.voicingDegree = clean;
  else delete voicing.voicingDegree;
}

/** Traste de referencia que se resalta como una columna del mástil. Vacío elimina el campo. */
export function setAnchorFret(voicing, value) {
  const clean = String(value ?? '').trim();
  if (!clean) { delete voicing.anchorFret; return true; }
  if (!/^[1-9]\d*$/.test(clean)) return false;
  const fret = Number(clean);
  if (!Number.isSafeInteger(fret)) return false;
  voicing.anchorFret = fret;
  return true;
}

/** Texto vacío borra la tonalidad propia (la posición hereda). La calidad no se infiere del texto. */
export function setTonality(voicing, value, family = DEFAULT_TONALITY_FAMILY) {
  const clean = String(value ?? '').trim();
  if (!clean) { delete voicing.tonality; return; }
  voicing.tonality = { text: clean, family: normalizeFamily(family) };
}

/** Cambia la calidad solo si la posición tiene tonalidad propia; devuelve si hubo cambio de datos. */
export function setTonalityFamily(voicing, family) {
  if (!voicing.tonality || !isFamily(family) || voicing.tonality.family === family) return false;
  voicing.tonality.family = family;
  return true;
}

/** «Otro» es el valor por defecto: no se escribe. */
export function setKeyFamily(song, family) {
  if (isFamily(family) && family !== DEFAULT_TONALITY_FAMILY) song.keyFamily = family;
  else delete song.keyFamily;
}

/** Visible es el valor por defecto: solo se guarda el valor «oculto». */
export function setShowTonalities(song, visible) {
  if (visible) delete song.showTonalities;
  else song.showTonalities = false;
}

export const tonalitiesVisible = song => song.showTonalities !== false;

/* ---------- Contexto derivado ---------- */

/** Contexto inicial: la tonalidad general si existe. Nunca se infiere ni se inventa. */
export function initialTonality(song) {
  const text = typeof song.key === 'string' ? song.key.trim() : '';
  return text ? { text, family: normalizeFamily(song.keyFamily) } : null;
}

/**
 * Map voiceId → null | { text, family, explicit, show, source }.
 *  - explicit: la posición define su propia tonalidad.
 *  - show: debe imprimirse etiqueta nueva (cambio explícito, o el contexto general en la primera posición del documento).
 *  - source: 'key' o el id de la posición que fijó el contexto.
 * Las posiciones sin ningún contexto (sin tonalidad general ni cambios previos) devuelven null.
 */
export function deriveTonalityContext(song) {
  const result = new Map();
  let current = initialTonality(song);
  let source = current ? 'key' : null;
  let first = true;
  for (const measure of song.measures || []) {
    for (const event of measure.chordEvents || []) {
      for (const voicing of event.voicings || []) {
        const own = voicing.tonality;
        if (own && typeof own.text === 'string' && own.text.trim()) {
          current = { text: own.text.trim(), family: normalizeFamily(own.family) };
          source = voicing.id;
          result.set(voicing.id, { ...current, explicit: true, show: true, source });
        } else if (current) {
          result.set(voicing.id, { ...current, explicit: false, show: first && source === 'key', source });
        } else {
          result.set(voicing.id, null);
        }
        first = false;
      }
    }
  }
  return result;
}

/** Texto de ayuda del editor: distingue el valor heredado del propio. */
export function describeTonality(entry) {
  if (!entry) return 'Sin tonalidad: no hay tonalidad general ni cambios anteriores.';
  if (entry.explicit) return `Esta tarjeta cambia la tonalidad a «${entry.text}».`;
  const origin = entry.source === 'key' ? 'la tonalidad general' : 'una tarjeta anterior';
  return `Hereda «${entry.text}» de ${origin}.`;
}
