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

  // Compases que repiten el anterior: la referencia se conserva aunque deje de ser válida, y se avisa sin redirigirla.
  song.measures.forEach((m, i) => {
    if (!m.repeatPrevious) return;
    const what = `Compás ${m.label} (repite el anterior)`;
    const source = m.repeatPrevious.sourceMeasureId;
    if (source === m.id) return warn('repeat', m.id, `${what}: se referencia a sí mismo.`);
    if (!index.has(source)) return warn('repeat', m.id, `${what}: el compás que repetía ya no existe.`);
    // Ciclo: siguiendo las referencias se vuelve a este compás (A→B→A).
    const seen = new Set();
    let cursor = source;
    while (cursor && cursor !== m.id && !seen.has(cursor)) {
      seen.add(cursor);
      cursor = song.measures[index.get(cursor)]?.repeatPrevious?.sourceMeasureId;
    }
    if (cursor === m.id) return warn('repeat', m.id, `${what}: la cadena de repeticiones forma un ciclo.`);
    if (index.get(source) !== i - 1) warn('repeat', m.id, `${what}: ya no repite el compás inmediatamente anterior (apunta al ${measureName(song, source)}). Puedes corregirlo.`);
  });

  // Repetición de dos compases: marca en el primer destino con los IDs de las dos fuentes y los dos destinos.
  const targeted = new Map(); // ID de destino → primer destino que lo reclama
  song.measures.forEach((m, i) => {
    const pair = m.repeatPreviousTwo;
    if (!pair) return;
    const what = `Compás ${m.label} (repite los dos anteriores)`;
    const { sourceMeasureIds: sources, targetMeasureIds: targets } = pair;
    const all = [...sources, ...targets];
    if (new Set(all).size !== all.length) return warn('repeat', m.id, `${what}: un compás aparece más de una vez entre las fuentes y los destinos (se referencia a sí mismo o forma un ciclo).`);
    const missing = all.filter((id) => !index.has(id));
    if (missing.length) return warn('repeat', m.id, `${what}: algún compás de la pareja ya no existe.`);
    if (targets[0] !== m.id) return warn('repeat', m.id, `${what}: la marca no está en su primer compás de destino.`);
    if (index.get(targets[1]) !== i + 1) return warn('repeat', m.id, `${what}: los dos destinos ya no son compases consecutivos. Puedes corregirlo.`);
    if (index.get(sources[0]) !== i - 2 || index.get(sources[1]) !== i - 1) {
      warn('repeat', m.id, `${what}: ya no repite los dos compases inmediatamente anteriores, en ese orden. Puedes corregirlo.`);
    }
    const second = song.measures[i + 1];
    if (second.chordEvents.length || second.repeatPrevious) warn('repeat', m.id, `${what}: el segundo destino (compás ${second.label}) tiene contenido propio que no se dibuja.`);
    for (const id of targets) {
      if (targeted.has(id)) warn('repeat', m.id, `${what}: se solapa con otra repetición de dos compases.`);
      targeted.set(id, m.id);
    }
    if (song.measures[i].repeatPrevious) warn('repeat', m.id, `${what}: el compás tiene también una repetición de un compás.`);
  });

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

/** Avisos de repetición del compás anterior que aparecen tras un cambio y no existían antes. */
export function newRepeatWarnings(before, after) {
  const known = new Set(before.filter((w) => w.kind === 'repeat').map((w) => `${w.objectId}:${w.message}`));
  return after.filter((w) => w.kind === 'repeat' && !known.has(`${w.objectId}:${w.message}`));
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
  for (const m of song.measures || []) {
    const pair = m.repeatPreviousTwo;
    if (pair && m.id !== measureId && pair.sourceMeasureIds.includes(measureId)) {
      out.push(`El compás ${m.label} repite este compás junto con otro: conservará la referencia, que quedará pendiente (sin redirigirse a otro).`);
    }
    if (pair && pair.targetMeasureIds.includes(measureId)) {
      out.push(`Este compás es un destino de la repetición de dos compases del compás ${m.label}: la pareja quedará incompleta, con la referencia pendiente.`);
    }
    if (m.repeatPrevious?.sourceMeasureId === measureId && m.id !== measureId) {
      out.push(`El compás ${m.label} repite este compás: conservará la referencia, que quedará pendiente (sin redirigirse a otro).`);
    }
  }
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
