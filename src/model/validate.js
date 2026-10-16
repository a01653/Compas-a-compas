import { findDuplicateIds } from './ids.js';
import { checkStructure } from './structure.js';

export const SCHEMA_VERSION = 1;
export const FAMILY_KEYS = ['major', 'minor', 'dominant', 'half-diminished', 'diminished', 'other'];

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const at = (path, key) => (path ? `${path}.${key}` : key);
const fail = (errors, path, message) => errors.push({ path, message });

// Cada validador de propiedad recibe (valor, ruta, errores) y añade los errores que encuentre.
const text = (v, p, e) => { if (typeof v !== 'string') fail(e, p, 'debe ser un texto'); };
const nonEmptyText = (v, p, e) => { if (typeof v !== 'string' || v.length === 0) fail(e, p, 'debe ser un texto no vacío'); };
const oneOf = (list) => (v, p, e) => { if (!list.includes(v)) fail(e, p, `debe ser uno de: ${list.join(', ')}`); };
const integer = (min) => (v, p, e) => { if (!Number.isInteger(v) || v < min) fail(e, p, `debe ser un entero ≥ ${min}`); };

function list(itemCheck, { min = 0, exact, unique = false } = {}) {
  return (v, p, e) => {
    if (!Array.isArray(v)) return fail(e, p, 'debe ser una lista');
    if (exact !== undefined && v.length !== exact) fail(e, p, `debe tener exactamente ${exact} valores y tiene ${v.length}`);
    if (min && v.length < min) fail(e, p, `debe tener al menos ${min} elemento(s)`);
    if (unique && new Set(v).size !== v.length) fail(e, p, 'no admite valores repetidos');
    v.forEach((item, i) => itemCheck(item, `${p}[${i}]`, e));
  };
}

function object({ required = [], props }) {
  return (v, p, e) => {
    if (!isObject(v)) return fail(e, p || '(raíz)', 'debe ser un objeto');
    for (const key of Object.keys(v)) {
      if (!hasOwn(props, key)) fail(e, at(p, key), 'campo no permitido; no se descarta en silencio, así que el archivo no se abre');
    }
    for (const key of required) {
      if (!hasOwn(v, key)) fail(e, at(p, key), 'falta este campo obligatorio');
    }
    for (const key of Object.keys(props)) {
      if (hasOwn(v, key)) props[key](v[key], at(p, key), e);
    }
  };
}

const fret = (v, p, e) => { if (v !== null && (!Number.isInteger(v) || v < 0)) fail(e, p, 'debe ser un entero ≥ 0 o null (cuerda muda)'); };
const degree = (v, p, e) => { if (v !== null && typeof v !== 'string') fail(e, p, 'debe ser un texto o null'); };

const voicing = object({
  required: ['id', 'frets'],
  props: {
    id: nonEmptyText,
    frets: list(fret, { exact: 6 }),
    degrees: list(degree, { exact: 6 }),
    aboveText: text,
    insideText: text,
  },
});

const chordEvent = object({
  required: ['id', 'chordName', 'voicings'],
  props: {
    id: nonEmptyText,
    chordName: nonEmptyText,
    aboveText: text,
    insideText: text,
    family: oneOf(FAMILY_KEYS),
    voicings: list(voicing),
  },
});

const measure = object({
  required: ['id', 'label', 'chordEvents'],
  props: { id: nonEmptyText, label: nonEmptyText, chordEvents: list(chordEvent) },
});

const edge = oneOf(['before', 'after']);

const repeat = object({
  required: ['id', 'startMeasureId', 'endMeasureId', 'times'],
  props: { id: nonEmptyText, startMeasureId: nonEmptyText, endMeasureId: nonEmptyText, times: integer(2) },
});

const ending = object({
  required: ['id', 'startMeasureId', 'endMeasureId', 'passes'],
  props: {
    id: nonEmptyText,
    startMeasureId: nonEmptyText,
    endMeasureId: nonEmptyText,
    passes: list(integer(1), { min: 1, unique: true }),
    repeatId: nonEmptyText,
  },
});

const marker = object({
  required: ['id', 'type', 'measureId', 'edge'],
  props: { id: nonEmptyText, type: oneOf(['segno', 'coda', 'fine']), measureId: nonEmptyText, edge },
});

const jump = object({
  required: ['id', 'type', 'measureId', 'edge'],
  props: {
    id: nonEmptyText,
    type: oneOf(['dc', 'ds', 'dc-al-coda', 'ds-al-coda', 'dc-al-fine', 'ds-al-fine', 'to-coda']),
    measureId: nonEmptyText,
    edge,
    segnoMarkerId: nonEmptyText,
    codaMarkerId: nonEmptyText,
    fineMarkerId: nonEmptyText,
  },
});

const structure = object({
  required: ['repeats', 'endings', 'markers', 'jumps'],
  props: { repeats: list(repeat), endings: list(ending), markers: list(marker), jumps: list(jump) },
});

const song = object({
  required: ['schemaVersion', 'title', 'key', 'measures', 'structure'],
  props: {
    schemaVersion: () => {},
    documentVersion: text,
    title: text,
    key: text,
    measures: list(measure),
    structure,
  },
});

/** Errores de forma, tipos, campos permitidos y versión. No modifica nada. */
export function validateSongShape(data) {
  const errors = [];
  if (!isObject(data)) {
    fail(errors, '(raíz)', 'el archivo debe contener un objeto JSON');
    return errors;
  }
  if (!hasOwn(data, 'schemaVersion')) {
    fail(errors, 'schemaVersion', 'falta schemaVersion; no se puede saber qué versión del formato es');
    return errors;
  }
  if (data.schemaVersion !== SCHEMA_VERSION) {
    fail(errors, 'schemaVersion', `versión de esquema no soportada (${JSON.stringify(data.schemaVersion)}). Esta aplicación entiende la versión ${SCHEMA_VERSION}; abrirla requeriría una migración explícita.`);
    return errors;
  }
  song(data, '', errors);
  return errors;
}

/**
 * Validación completa. errors bloquean la apertura (forma, versión, IDs duplicados);
 * warnings son referencias musicales incompletas, que se abren para poder corregirlas.
 */
export function validateSong(data) {
  const errors = validateSongShape(data);
  if (errors.length === 0) {
    for (const dup of findDuplicateIds(data)) {
      fail(errors, dup.paths.join(' y '), `el identificador «${dup.id}» está repetido`);
    }
  }
  const warnings = errors.length === 0 ? checkStructure(data) : [];
  return { errors, warnings };
}

export function formatError(error) {
  return `${error.path}: ${error.message}`;
}
