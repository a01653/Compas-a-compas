/** Todos los identificadores del documento comparten un único espacio de nombres. */

/** Devuelve la lista de [id, ruta] de todo objeto con id (compases, acordes, voicings y estructura). */
export function listIds(song) {
  const entries = [];
  const add = (obj, path) => {
    if (obj && typeof obj === 'object' && typeof obj.id === 'string') entries.push([obj.id, path]);
  };
  (Array.isArray(song.measures) ? song.measures : []).forEach((m, i) => {
    add(m, `measures[${i}]`);
    (Array.isArray(m && m.chordEvents) ? m.chordEvents : []).forEach((e, j) => {
      add(e, `measures[${i}].chordEvents[${j}]`);
      (Array.isArray(e && e.voicings) ? e.voicings : []).forEach((v, k) => add(v, `measures[${i}].chordEvents[${j}].voicings[${k}]`));
    });
  });
  const st = song.structure && typeof song.structure === 'object' ? song.structure : {};
  for (const key of ['repeats', 'endings', 'markers', 'jumps']) {
    (Array.isArray(st[key]) ? st[key] : []).forEach((item, i) => add(item, `structure.${key}[${i}]`));
  }
  return entries;
}

/** [{ id, paths: [...] }] de los identificadores que aparecen más de una vez. */
export function findDuplicateIds(song) {
  const seen = new Map();
  for (const [id, path] of listIds(song)) {
    if (!seen.has(id)) seen.set(id, []);
    seen.get(id).push(path);
  }
  return [...seen].filter(([, paths]) => paths.length > 1).map(([id, paths]) => ({ id, paths }));
}

/** Generador de IDs nuevos que no colisiona con el documento ni con los ya generados. */
export function createIdFactory(song) {
  const used = new Set(listIds(song).map(([id]) => id));
  return (prefix) => {
    let n = used.size + 1;
    while (used.has(`${prefix}${n}`)) n++;
    const id = `${prefix}${n}`;
    used.add(id);
    return id;
  };
}
