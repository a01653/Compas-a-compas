/**
 * Alta, edición, borrado y validación de marcas musicales (repeticiones, casillas, Segno/Coda/Fine y saltos).
 * Módulo puro: sin DOM. Todo se asocia por ID; nada se redirige ni se deduce de textos.
 */
import { createIdFactory } from './ids.js';
import { JUMP_NAMES, MARKER_NAMES, JUMP_NEEDS, measureName } from './structure.js';

export const KINDS = ['repeat', 'ending', 'marker', 'jump'];
const COLLECTION = { repeat: 'repeats', ending: 'endings', marker: 'markers', jump: 'jumps' };
const ID_PREFIX = { repeat: 'rep', ending: 'cas', jump: 'salto', segno: 'segno', coda: 'coda', fine: 'fine' };
export const KIND_NAMES = { repeat: 'Repetición', ending: 'Casilla', marker: 'Segno / Coda / Fine', jump: 'Salto' };
export const EDGES = ['before', 'after'];
export const EDGE_NAMES = { before: 'antes del', after: 'después del' };
export const JUMP_TYPES = Object.keys(JUMP_NAMES);
export const MARKER_TYPES = Object.keys(MARKER_NAMES);

/** Destinos que necesita un tipo de salto: [{ field, type }]. */
export function jumpNeeds(jumpType) {
  return (JUMP_NEEDS[jumpType] || []).map(([field, type]) => ({ field, type }));
}

export function ensureStructure(song) {
  if (!song.structure || typeof song.structure !== 'object') song.structure = {};
  for (const key of Object.values(COLLECTION)) if (!Array.isArray(song.structure[key])) song.structure[key] = [];
  return song.structure;
}

const listOf = (song, kind) => ensureStructure(song)[COLLECTION[kind]];

/** Localiza una marca por ID: { kind, item } o null. */
export function findMark(song, id) {
  for (const kind of KINDS) {
    const item = listOf(song, kind).find((x) => x.id === id);
    if (item) return { kind, item };
  }
  return null;
}

/** Etiqueta legible de un compás para listas: «Compás 3 (posición 3) · Cm7, F7». La posición desambigua etiquetas repetidas. */
export function measureLabel(song, measure, index) {
  const chords = measure.chordEvents.map((e) => e.chordName).filter(Boolean);
  return `Compás ${measure.label || 'sin etiqueta'} (posición ${index + 1})${chords.length ? ` · ${chords.join(', ')}` : ''}`;
}

export function measureOptions(song) {
  return song.measures.map((m, i) => ({ value: m.id, label: measureLabel(song, m, i) }));
}

/** Marcas de un tipo como destinos de salto, con etiqueta legible. */
export function markerOptions(song, type) {
  const index = new Map(song.measures.map((m, i) => [m.id, i]));
  return listOf(song, 'marker').filter((mk) => mk.type === type).map((mk) => {
    const i = index.get(mk.measureId);
    const where = i === undefined ? 'compás desaparecido' : `compás ${song.measures[i].label || 'sin etiqueta'}, posición ${i + 1}`;
    return { value: mk.id, label: `${MARKER_NAMES[type]} ${EDGE_NAMES[mk.edge]} ${where}` };
  });
}

export function repeatOptions(song) {
  return listOf(song, 'repeat').map((r) => ({ value: r.id, label: `×${r.times}, ${rangeText(song, r)}` }));
}

/**
 * Añade, si falta, la opción de un valor guardado que ya no corresponde a ninguna opción (destino ausente).
 * Nunca sustituye el valor por la primera opción: el valor pendiente sigue seleccionable y se conserva al guardar.
 */
export function withPending(options, value, pendingLabel) {
  if (!value || options.some((o) => o.value === value)) return options;
  return [...options, { value, label: pendingLabel, pending: true }];
}

function rangeText(song, span) {
  const a = measureName(song, span.startMeasureId);
  const b = measureName(song, span.endMeasureId);
  return span.startMeasureId === span.endMeasureId ? a : `${a} a ${b}`;
}

/** Pasadas ordenadas y legibles: [1,2] → «1., 2.»; [1,2,3] → «1.–3.». */
export function formatPasses(passes) {
  const sorted = [...new Set(passes)].sort((a, b) => a - b);
  const parts = [];
  for (let i = 0; i < sorted.length;) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    if (j - i >= 2) parts.push(`${sorted[i]}.–${sorted[j]}.`);
    else for (let k = i; k <= j; k++) parts.push(`${sorted[k]}.`);
    i = j + 1;
  }
  return parts.join(', ');
}

/** Texto de una marca para listas: { title, detail }. */
export function describeMark(song, kind, item) {
  const where = (id) => measureName(song, id);
  if (kind === 'repeat') return { title: `Repetición ×${item.times}`, detail: rangeText(song, item) };
  if (kind === 'ending') {
    const rep = item.repeatId ? listOf(song, 'repeat').find((r) => r.id === item.repeatId) : null;
    const link = item.repeatId ? (rep ? `, de la repetición ×${rep.times}` : ', repetición asociada pendiente') : '';
    return { title: `Casilla ${formatPasses(item.passes)}`, detail: `${rangeText(song, item)}${link}` };
  }
  if (kind === 'marker') return { title: MARKER_NAMES[item.type], detail: `${EDGE_NAMES[item.edge]} ${where(item.measureId)}` };
  const targets = jumpNeeds(item.type).map(({ field, type }) => {
    const id = item[field];
    const target = id ? listOf(song, 'marker').find((m) => m.id === id) : null;
    return `${MARKER_NAMES[type]}: ${!id ? 'falta' : target && target.type === type ? `${EDGE_NAMES[target.edge]} ${where(target.measureId)}` : 'pendiente'}`;
  });
  return {
    title: JUMP_NAMES[item.type] || item.type,
    detail: `${EDGE_NAMES[item.edge]} ${where(item.measureId)}${targets.length ? ` → ${targets.join('; ')}` : ''}`,
  };
}

/** Todas las marcas en orden de lista: [{ kind, item, title, detail }]. */
export function listMarks(song) {
  return KINDS.flatMap((kind) => listOf(song, kind).map((item) => ({ kind, item, ...describeMark(song, kind, item) })));
}

function parseInteger(value) {
  if (typeof value === 'number') return Number.isSafeInteger(value) ? value : null;
  const text = String(value ?? '').trim();
  return /^\d{1,9}$/.test(text) ? Number(text) : null;
}

/**
 * Valida el contenido de un formulario sin modificar la canción.
 * Devuelve { ok, errors, warnings, value }. Los errores bloquean; los avisos (destinos ausentes o sin elegir) se conservan visibles.
 * `value` contiene solo los campos del esquema que corresponden al tipo.
 */
export function validateMark(song, kind, input) {
  const errors = [];
  const warnings = [];
  const index = new Map(song.measures.map((m, i) => [m.id, i]));
  const str = (v) => (typeof v === 'string' ? v : '');
  const measureField = (id, what) => {
    if (!id) errors.push(`${what}: elige un compás.`);
    else if (!index.has(id)) warnings.push(`${what}: el compás guardado ya no existe; queda pendiente hasta que elijas otro.`);
  };
  const span = () => {
    const start = str(input.startMeasureId);
    const end = str(input.endMeasureId);
    measureField(start, 'Inicio');
    measureField(end, 'Final');
    if (index.has(start) && index.has(end) && index.get(start) > index.get(end)) {
      errors.push('El tramo está invertido: el inicio debe ser el mismo compás que el final o ir antes.');
    }
    return { startMeasureId: start, endMeasureId: end };
  };
  const edge = () => {
    if (!EDGES.includes(input.edge)) errors.push('Elige si la marca va antes o después del compás.');
    return input.edge;
  };
  let value = null;

  if (!KINDS.includes(kind)) {
    errors.push('Tipo de marca desconocido.');
  } else if (kind === 'repeat') {
    const times = parseInteger(input.times);
    if (times === null || times < 2) errors.push('Las pasadas totales deben ser un número entero de 2 o más.');
    value = { ...span(), times };
  } else if (kind === 'ending') {
    const raw = Array.isArray(input.passes) ? input.passes : [];
    const passes = raw.map(parseInteger);
    if (!passes.length) errors.push('Marca al menos una pasada.');
    else if (passes.some((p) => p === null || p < 1)) errors.push('Las pasadas deben ser números enteros positivos.');
    else if (new Set(passes).size !== passes.length) errors.push('No repitas una pasada dentro de la misma casilla.');
    value = { ...span(), passes: passes.filter((p) => p !== null).sort((a, b) => a - b) };
    const repeatId = str(input.repeatId);
    if (repeatId) {
      const rep = listOf(song, 'repeat').find((r) => r.id === repeatId);
      if (!rep) warnings.push('La repetición asociada ya no existe; queda pendiente hasta que elijas otra.');
      else if (value.passes.some((p) => p > rep.times)) errors.push(`Alguna pasada supera las ${rep.times} de la repetición elegida.`);
      value.repeatId = repeatId;
    }
  } else if (kind === 'marker') {
    if (!MARKER_TYPES.includes(input.type)) errors.push('Elige Segno, Coda o Fine.');
    measureField(str(input.measureId), 'Compás');
    value = { type: input.type, measureId: str(input.measureId), edge: edge() };
  } else {
    if (!JUMP_TYPES.includes(input.type)) errors.push('Elige uno de los saltos de la lista.');
    measureField(str(input.measureId), 'Compás');
    value = { type: input.type, measureId: str(input.measureId), edge: edge() };
    for (const { field, type } of jumpNeeds(input.type)) {
      const id = str(input[field]);
      if (!id) warnings.push(`Falta el destino ${MARKER_NAMES[type]}; la marca queda incompleta pero se conserva.`);
      else {
        const target = listOf(song, 'marker').find((m) => m.id === id);
        if (!target || target.type !== type) warnings.push(`El destino ${MARKER_NAMES[type]} guardado está pendiente; no se ha cambiado por otro.`);
        value[field] = id;
      }
    }
  }
  return { ok: errors.length === 0, errors, warnings, value };
}

/**
 * ID nuevo que no colisiona con el documento ni con ninguna referencia colgante: si se reutilizase el ID de una marca
 * borrada, un salto con destino pendiente quedaría enlazado en silencio a la marca nueva.
 */
function newId(song, kind, value) {
  const st = ensureStructure(song);
  const dangling = new Set([
    ...st.endings.map((e) => e.repeatId),
    ...st.jumps.flatMap((j) => [j.segnoMarkerId, j.codaMarkerId, j.fineMarkerId]),
  ].filter(Boolean));
  const next = createIdFactory(song);
  const prefix = ID_PREFIX[kind === 'marker' ? value.type : kind];
  let id = next(prefix);
  while (dangling.has(id)) id = next(prefix);
  return id;
}

/** Añade una marca ya validada (`validateMark(...).value`). Devuelve el objeto creado. */
export function addMark(song, kind, value) {
  const list = listOf(song, kind);
  const item = { id: newId(song, kind, value), ...value };
  list.push(item);
  return item;
}

/** Sustituye los campos de una marca, conservando su ID. Si el ID no existe no hace nada y devuelve null. */
export function updateMark(song, id, value) {
  const found = findMark(song, id);
  if (!found) return null;
  const list = listOf(song, found.kind);
  const next = { id, ...value };
  list[list.indexOf(found.item)] = next;
  return next;
}

/**
 * Consecuencias de borrar una marca. Nunca se redirige nada: lo que dependía de ella queda con referencia pendiente.
 */
export function markConsequences(song, id) {
  const found = findMark(song, id);
  if (!found) return [];
  const out = [];
  const st = ensureStructure(song);
  if (found.kind === 'repeat') {
    for (const e of st.endings.filter((x) => x.repeatId === id)) {
      out.push(`La casilla ${formatPasses(e.passes)} sigue apuntando a esta repetición: quedará con la repetición pendiente, sin pasar a otra.`);
    }
  } else if (found.kind === 'marker') {
    for (const j of st.jumps) {
      for (const { field, type } of jumpNeeds(j.type)) {
        if (j[field] === id) out.push(`${JUMP_NAMES[j.type]} usa este ${MARKER_NAMES[type]} como destino: quedará con el destino pendiente, sin pasar a otro.`);
      }
    }
  }
  if (!out.length) out.push('Ninguna otra marca depende de ésta.');
  return out;
}

/** Borra una marca. Las referencias que apuntaban a ella se conservan (pendientes). Devuelve true si existía. */
export function deleteMark(song, id) {
  const found = findMark(song, id);
  if (!found) return false;
  const list = listOf(song, found.kind);
  list.splice(list.indexOf(found.item), 1);
  return true;
}

/** Valores iniciales de formulario para un tipo de marca, tomando el compás indicado. */
export function defaultFields(kind, measureId = '') {
  return {
    startMeasureId: measureId, endMeasureId: measureId, times: '2', passes: [1], repeatId: '',
    type: kind === 'jump' ? 'dc' : 'segno', measureId, edge: 'after', segnoMarkerId: '', codaMarkerId: '', fineMarkerId: '',
  };
}

/** Campos de formulario a partir de una marca guardada (conserva destinos ausentes tal cual). */
export function fieldsFromMark(kind, item) {
  return { ...defaultFields(kind), ...item, times: String(item.times ?? '2'), passes: item.passes ? [...item.passes] : [1], repeatId: item.repeatId || '' };
}
