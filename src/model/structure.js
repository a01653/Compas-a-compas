/** Lectura y comprobación de la estructura musical. No interpreta recorridos ni redirige destinos. */

export const JUMP_NAMES = {
  dc: 'D.C.',
  ds: 'D.S.',
  'dc-al-coda': 'D.C. al Coda',
  'ds-al-coda': 'D.S. al Coda',
  'dc-al-fine': 'D.C. al Fine',
  'ds-al-fine': 'D.S. al Fine',
  'to-coda': 'To Coda',
};
export const MARKER_NAMES = { segno: 'Segno', coda: 'Coda', fine: 'Fine' };

/** Destinos que necesita cada salto: [campo, tipo de marca]. */
export const JUMP_NEEDS = {
  dc: [],
  ds: [['segnoMarkerId', 'segno']],
  'dc-al-coda': [['codaMarkerId', 'coda']],
  'ds-al-coda': [['segnoMarkerId', 'segno'], ['codaMarkerId', 'coda']],
  'dc-al-fine': [['fineMarkerId', 'fine']],
  'ds-al-fine': [['segnoMarkerId', 'segno'], ['fineMarkerId', 'fine']],
  'to-coda': [['codaMarkerId', 'coda']],
};

function structureOf(song) {
  const st = (song && song.structure) || {};
  return {
    repeats: st.repeats || [],
    endings: st.endings || [],
    markers: st.markers || [],
    jumps: st.jumps || [],
  };
}

export function measureName(song, id) {
  const m = song.measures.find((x) => x.id === id);
  return m ? `compás ${m.label}` : 'compás desaparecido';
}

/**
 * Avisos de referencias incompletas. Cada aviso: { kind, objectId, message }.
 * kind: 'missing' (compás o destino inexistente), 'inverted' (tramo invertido), 'ref' (referencia o requisito).
 */
export function checkStructure(song) {
  const warnings = [];
  const st = structureOf(song);
  const index = new Map(song.measures.map((m, i) => [m.id, i]));
  const markers = new Map(st.markers.map((m) => [m.id, m]));
  const repeats = new Map(st.repeats.map((r) => [r.id, r]));
  const warn = (kind, objectId, message) => warnings.push({ kind, objectId, message });

  const checkSpan = (item, what) => {
    const a = index.get(item.startMeasureId);
    const b = index.get(item.endMeasureId);
    if (a === undefined) warn('missing', item.id, `${what}: el compás de inicio ya no existe.`);
    if (b === undefined) warn('missing', item.id, `${what}: el compás final ya no existe.`);
    if (a !== undefined && b !== undefined && a > b) {
      warn('inverted', item.id, `${what}: el tramo está invertido (empieza en el ${measureName(song, item.startMeasureId)} y termina antes, en el ${measureName(song, item.endMeasureId)}).`);
    }
  };

  for (const r of st.repeats) checkSpan(r, `Repetición ×${r.times}`);
  for (const e of st.endings) {
    const what = `Casilla ${e.passes.join(', ')}`;
    checkSpan(e, what);
    if (e.repeatId !== undefined) {
      const rep = repeats.get(e.repeatId);
      if (!rep) warn('ref', e.id, `${what}: la repetición asociada ya no existe.`);
      else if (e.passes.some((p) => p > rep.times)) warn('ref', e.id, `${what}: alguna pasada supera las ${rep.times} de su repetición.`);
    }
  }
  for (const m of st.markers) {
    if (!index.has(m.measureId)) warn('missing', m.id, `${MARKER_NAMES[m.type]}: el compás asociado ya no existe.`);
  }
  for (const j of st.jumps) {
    const what = JUMP_NAMES[j.type] || j.type;
    if (!index.has(j.measureId)) warn('missing', j.id, `${what}: el compás asociado ya no existe.`);
    for (const [field, type] of JUMP_NEEDS[j.type] || []) {
      const targetId = j[field];
      if (!targetId) warn('ref', j.id, `${what}: falta el destino ${MARKER_NAMES[type]}.`);
      else {
        const target = markers.get(targetId);
        if (!target) warn('missing', j.id, `${what}: el destino ${MARKER_NAMES[type]} ya no existe.`);
        else if (target.type !== type) warn('ref', j.id, `${what}: el destino elegido no es un ${MARKER_NAMES[type]}.`);
      }
    }
  }
  return warnings;
}

/** Avisos de tramos invertidos que aparecen tras un cambio y no existían antes. */
export function newInversions(before, after) {
  const known = new Set(before.filter((w) => w.kind === 'inverted').map((w) => w.objectId));
  return after.filter((w) => w.kind === 'inverted' && !known.has(w.objectId));
}

/** Qué le pasa a la estructura si se borra un compás. Nada se redirige: las marcas quedan con referencia pendiente. */
export function measureConsequences(song, measureId) {
  const st = structureOf(song);
  const out = [];
  for (const r of st.repeats) {
    if (r.startMeasureId === measureId) out.push(`La repetición ×${r.times} empieza en este compás: quedará con el inicio pendiente.`);
    if (r.endMeasureId === measureId) out.push(`La repetición ×${r.times} termina en este compás: quedará con el final pendiente.`);
  }
  for (const e of st.endings) {
    if (e.startMeasureId === measureId || e.endMeasureId === measureId) out.push(`La casilla ${e.passes.join(', ')} usa este compás como límite: quedará con un extremo pendiente.`);
  }
  const markerIds = new Set();
  for (const m of st.markers) {
    if (m.measureId === measureId) {
      markerIds.add(m.id);
      out.push(`${MARKER_NAMES[m.type]} (${m.edge === 'before' ? 'antes' : 'después'} de este compás): la marca se conserva sin compás.`);
    }
  }
  for (const j of st.jumps) {
    if (j.measureId === measureId) out.push(`${JUMP_NAMES[j.type] || j.type} está en este compás: se conserva sin compás.`);
    for (const field of ['segnoMarkerId', 'codaMarkerId', 'fineMarkerId']) {
      if (j[field] && markerIds.has(j[field])) out.push(`${JUMP_NAMES[j.type] || j.type} apunta a una marca de este compás: quedará con el destino pendiente, sin redirigirse a otro.`);
    }
  }
  return out;
}
