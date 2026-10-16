/**
 * Proyección de las marcas musicales sobre los compases escritos. Módulo puro, reutilizable por la paginación (fase 4).
 *
 * `projectMarks(song)` calcula, por ID de compás, qué marcas le tocan. `fragmentMarks(marks, { isFirst, isLast })`
 * recorta esa proyección para un fragmento de un compás partido: los signos del borde inicial solo van en el primer
 * fragmento y los del borde final solo en el último; el resto se dibuja como continuación. Un compás entero es
 * un fragmento con isFirst e isLast verdaderos. No expande repeticiones ni recorridos.
 */
import { JUMP_NAMES, MARKER_NAMES } from './structure.js';
import { formatPasses } from './marks.js';

const empty = () => ({ repeatStarts: [], repeatEnds: [], spans: [], endings: [], before: [], after: [] });

/**
 * @returns {{ byMeasure: Map<string, object>, undrawn: Array<{ id: string, reason: string }> }}
 * Los tramos con compases ausentes o invertidos no se dibujan: se listan en `undrawn` (el panel ya los avisa).
 */
export function projectMarks(song) {
  const st = song.structure || {};
  const index = new Map(song.measures.map((m, i) => [m.id, i]));
  const byMeasure = new Map(song.measures.map((m) => [m.id, empty()]));
  const undrawn = [];

  const spanIndexes = (item, what) => {
    const a = index.get(item.startMeasureId);
    const b = index.get(item.endMeasureId);
    if (a === undefined || b === undefined) {
      undrawn.push({ id: item.id, reason: `${what}: falta un compás del tramo.` });
      return null;
    }
    if (a > b) {
      undrawn.push({ id: item.id, reason: `${what}: el tramo está invertido.` });
      return null;
    }
    return [a, b];
  };

  for (const r of st.repeats || []) {
    const ix = spanIndexes(r, `Repetición ×${r.times}`);
    if (!ix) continue;
    const [a, b] = ix;
    byMeasure.get(song.measures[a].id).repeatStarts.push({ id: r.id, times: r.times });
    byMeasure.get(song.measures[b].id).repeatEnds.push({ id: r.id, times: r.times });
    for (let i = a; i <= b; i++) {
      byMeasure.get(song.measures[i].id).spans.push({ id: r.id, times: r.times, continuesBefore: i > a, continuesAfter: i < b });
    }
  }

  for (const e of st.endings || []) {
    const ix = spanIndexes(e, `Casilla ${formatPasses(e.passes)}`);
    if (!ix) continue;
    const [a, b] = ix;
    for (let i = a; i <= b; i++) {
      byMeasure.get(song.measures[i].id).endings.push({
        id: e.id, passes: e.passes, label: formatPasses(e.passes), startsHere: i === a, endsHere: i === b,
      });
    }
  }

  const place = (item, entry) => {
    const bucket = byMeasure.get(item.measureId);
    if (!bucket) {
      undrawn.push({ id: item.id, reason: `${entry.text}: falta el compás asociado.` });
      return;
    }
    (item.edge === 'before' ? bucket.before : bucket.after).push(entry);
  };
  for (const m of st.markers || []) place(m, { id: m.id, kind: 'marker', type: m.type, text: MARKER_NAMES[m.type] || m.type });
  for (const j of st.jumps || []) place(j, { id: j.id, kind: 'jump', type: j.type, text: JUMP_NAMES[j.type] || j.type });

  return { byMeasure, undrawn };
}

/**
 * Marcas de un fragmento de compás.
 * - repeatStarts / before: solo si es el primer fragmento.
 * - repeatEnds / after: solo si es el último.
 * - spans y endings llevan continuesBefore / continuesAfter para dibujar la continuidad al cruzar fila o página.
 */
export function fragmentMarks(marks, { isFirst = true, isLast = true } = {}) {
  const m = marks || empty();
  return {
    repeatStarts: isFirst ? m.repeatStarts : [],
    repeatEnds: isLast ? m.repeatEnds : [],
    spans: m.spans.map((s) => ({ ...s, continuesBefore: s.continuesBefore || !isFirst, continuesAfter: s.continuesAfter || !isLast })),
    endings: m.endings.map((e) => ({ ...e, continuesBefore: !(e.startsHere && isFirst), continuesAfter: !(e.endsHere && isLast) })),
    before: isFirst ? m.before : [],
    after: isLast ? m.after : [],
  };
}

/** ¿Hay algo que dibujar? Sirve para no reservar espacio en compases sin marcas. */
export function hasMarks(f) {
  return Boolean(f.repeatStarts.length || f.repeatEnds.length || f.spans.length || f.endings.length || f.before.length || f.after.length);
}
