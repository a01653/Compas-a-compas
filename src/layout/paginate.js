/**
 * Reparto de compases en filas y hojas. Módulo puro: recibe tamaños ya medidos y devuelve un plan.
 *
 * `measureFragment(unitIndex, from, to)` devuelve { width, height, rows?, extra? } del fragmento [from, to) del compás
 * (con sus marcas, etiqueta y tarjetas) y, si se conocen, `columns` (ancho natural de cada columna, que el renderizador usa para limitar su crecimiento); `rows` desglosa la altura en las pistas que la fila comparte (ver heightParts).
 * Quien llama decide cómo se mide; aquí solo se decide dónde va cada cosa.
 *
 * Anchos manuales (`unit.widthPercent`) y «ajustar línea al ancho» (`unit.fillToEdge`) se resuelven aquí; ver finishRow.
 *
 * Reglas:
 *  - El orden escrito se conserva y cada tarjeta aparece exactamente una vez.
 *  - Un compás entero que cabe en la fila actual va en ella; si no, empieza otra fila; si falta altura, otra hoja.
 *  - Un compás con salto de línea antes (`unit.breakBefore`), o detrás de uno con salto de línea después (`breakAfter`), empieza
 *    siempre otra fila, salvo el segundo destino de una pareja de repetición, que va siempre junto al primero.
 *  - Si un compás entero no cabe a lo ancho en la fila (ni en una vacía) y quien llama sabe medir tarjetas compactas
 *    (`measureCompact`), se prueba la fila entera con las tarjetas estrechadas hasta su mástil; si así cabe, la fila queda
 *    compacta (`row.compact`) y lo que se añada después también se mide compacto. Se intenta antes de partir o pasar de hoja.
 *  - Un compás que no cabe ni en una fila vacía de una hoja nueva se parte entre tarjetas en fragmentos
 *    consecutivos (misma etiqueta, marcados como continuación), llenando antes el hueco de la hoja actual.
 *  - Si una sola tarjeta (o la cabecera) no cabe ni sola, se registra un error, se coloca igualmente (no se
 *    descarta nada) y la hoja queda marcada como desbordada. Quien exporta debe bloquear.
 */

const round = (n) => Math.round(n * 10) / 10;

/**
 * Altura por componentes. Una fila comparte sus pistas (marcas, títulos, franjas, zona del compás) entre todos sus
 * compases: su altura es la SUMA del máximo de cada pista, que puede superar al máximo de las alturas individuales
 * (un compás con título largo y otro con tarjetas altas). Un tamaño medido puede traer `rows` (altura de cada pista)
 * y `extra` (lo que no se alinea); sin `rows` se trata como una sola pista, y la combinación es el máximo de siempre.
 */
const sum = (list) => list.reduce((total, n) => total + n, 0);
export function heightParts(size) {
  if (Array.isArray(size.rows) && size.rows.length) {
    const rows = size.rows.map((n) => (Number.isFinite(n) && n > 0 ? n : 0));
    return { rows, extra: Number.isFinite(size.extra) ? Math.max(0, size.extra) : Math.max(0, size.height - sum(rows)) };
  }
  return { rows: [size.height], extra: 0 };
}
export function mergeHeights(a, b) {
  const length = Math.max(a.rows.length, b.rows.length);
  return {
    rows: Array.from({ length }, (_, i) => Math.max(a.rows[i] ?? 0, b.rows[i] ?? 0)),
    extra: Math.max(a.extra, b.extra),
  };
}
export const totalHeight = (parts) => sum(parts.rows) + parts.extra;

/**
 * @param {object} p
 * @param {Array<{ measureId: string, label: string, atoms: Array<object> }>} p.units
 * @param {(unitIndex: number, from: number, to: number) => { width: number, height: number }} p.measureFragment
 * @param {(unitIndex: number, from: number, to: number) => { width: number, height: number }} [p.measureCompact] el mismo
 *   fragmento con las tarjetas compactas (estrechadas hasta su mástil); sin él no se compacta ninguna fila
 * @param {{ width: number, height: number }} p.content área útil de la hoja
 * @param {number} p.headerHeight altura medida de la cabecera
 * @param {number} [p.maxPerRow] tope de compases (fragmentos) por fila; 0 = automático, como hasta ahora
 */
export function paginate({ units, measureFragment, measureCompact = null, content, headerHeight, columnGap = 0, rowGap = 0, headerGap = 0, safety = 0, maxPerRow = 0 }) {
  const errors = [];
  const notices = [];
  const maxW = content.width - safety;
  const bodyH = content.height - headerHeight - headerGap - safety;

  if (headerHeight + headerGap >= content.height - safety) {
    errors.push({
      kind: 'header',
      message: `La cabecera (${round(headerHeight)} px) no deja espacio en la hoja (${round(content.height)} px de alto útil). Acorta el título o la tonalidad.`,
    });
  }

  const cache = new Map();
  const measure = (ui, from, to, compact = false) => {
    const key = `${ui}:${from}:${to}${compact ? ':c' : ''}`;
    let size = cache.get(key);
    if (!size) {
      size = compact ? measureCompact(ui, from, to) : measureFragment(ui, from, to);
      // Ancho manual (porcentaje del ancho útil): solo en el compás entero y nunca por debajo de su contenido natural.
      const unit = units[ui];
      if (unit.widthPercent && from === 0 && to >= unit.atoms.length) {
        const wanted = Math.min(maxW, (content.width * unit.widthPercent) / 100);
        if (wanted >= size.width) size = { ...size, natural: size.width, width: wanted };
        else if (!compact) { // El aviso sale de la medida normal; la compacta no lo repite.
          notices.push({
            kind: 'width',
            measureId: unit.measureId,
            message: `Compás ${unit.label}: el ancho del ${unit.widthPercent} % no deja sitio a su contenido (necesita al menos el ${Math.ceil((size.width / content.width) * 100)} %). Se usa su ancho mínimo, sin recortar ni comprimir.`,
          });
        }
      }
      cache.set(key, size);
    }
    return size;
  };

  const pages = [];
  let page = null;
  let row = null;
  let y = 0; // comienzo vertical de la siguiente fila

  const newPage = () => {
    page = { rows: [], overflow: false };
    pages.push(page);
    row = null;
    y = 0;
  };
  /**
   * Anchos de dibujo de una fila. Cada fragmento con ancho manual, o toda la fila si algún compás pide «ajustar al ancho», lleva
   * `drawWidth` (px) y `tracks` (px por columna): el reparto del espacio sobrante es proporcional al ancho natural de cada columna,
   * así que ninguna se comprime por debajo de su contenido. Las filas automáticas no llevan nada (tope de expansión por tarjeta).
   */
  const finishRow = (r) => {
    r.fill = r.fragments.some((f) => units[f.unitIndex].fillToEdge);
    const gaps = columnGap * (r.fragments.length - 1);
    const sumWidths = r.fragments.reduce((sum, f) => sum + f.width, 0);
    const scale = r.fill && sumWidths > 0 ? Math.max(1, (maxW - gaps) / sumWidths) : 1;
    for (const f of r.fragments) {
      const custom = f.natural !== undefined && f.natural !== f.width;
      if (!(r.fill || custom) || !f.columns) continue;
      const natural = f.natural ?? f.width;
      const drawWidth = f.width * scale;
      const total = f.columns.reduce((sum, n) => sum + n, 0);
      f.drawWidth = drawWidth;
      f.tracks = f.columns.map((n) => Math.floor((n + ((drawWidth - natural) * n) / total) * 100) / 100);
    }
  };
  /**
   * Si varias filas ajustadas de la misma hoja tienen las mismas columnas, usa una sola
   * distribución horizontal para que los bordes de las tarjetas queden alineados.
   * Solo se aplica cuando cabe el ancho natural máximo de cada columna; nunca comprime contenido.
   */
  const alignFilledRows = (targetPage) => {
    const groups = new Map();
    for (const r of targetPage.rows) {
      if (!r.fill || !r.fragments.length || r.fragments.some((f) => !f.columns || !f.tracks || f.natural !== undefined)) continue;
      const shape = r.fragments.map((f) => f.columns.length);
      if (shape.some((n) => n < 1)) continue;
      const innerGaps = r.fragments.map((f) => round(f.width - sum(f.columns)));
      const key = `${shape.join(',')}|${innerGaps.join(',')}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }

    for (const rows of groups.values()) {
      if (rows.length < 2) continue;
      const count = rows[0].fragments.reduce((n, f) => n + f.columns.length, 0);
      const minimums = Array.from({ length: count }, (_, i) => Math.max(...rows.map((r) => r.fragments.flatMap((f) => f.columns)[i])));
      const template = rows[0];
      const fixedGaps = template.fragments.reduce((n, f) => n + f.width - sum(f.columns), 0)
        + columnGap * (template.fragments.length - 1);
      const trackBudget = maxW - fixedGaps;
      const minimumTotal = sum(minimums);
      if (minimumTotal > trackBudget + 0.01) continue;

      const extra = Math.max(0, (trackBudget - minimumTotal) / count);
      const sharedTracks = minimums.map((n) => n + extra);
      for (const r of rows) {
        let offset = 0;
        for (const f of r.fragments) {
          f.tracks = sharedTracks.slice(offset, offset + f.columns.length);
          f.drawWidth = sum(f.tracks) + f.width - sum(f.columns);
          offset += f.columns.length;
        }
        r.aligned = true;
      }
    }
  };
  const isFresh = () => !row && page.rows.length === 0;
  const closeRow = () => {
    if (!row) return;
    finishRow(row);
    page.rows.push(row);
    y += row.height + rowGap;
    row = null;
  };
  // `count` = compases que añade lo que se coloca. Un tope no impide una fila vacía (una pareja de dos compases cabe sola).
  const limited = (count) => maxPerRow > 0 && row && row.fragments.length + count > maxPerRow;
  const fitsRow = (size, count = 1) => {
    const w = row ? row.width + columnGap + size.width : size.width;
    const hgt = totalHeight(row ? mergeHeights(row.heights, heightParts(size)) : heightParts(size));
    return !limited(count) && w <= maxW && y + hgt <= bodyH;
  };
  /**
   * ¿Cabe la fila entera (lo ya colocado más `pieces`, [[ui, from, to]]) con las tarjetas compactas? Solo se prueba si la fila
   * aún no lo es: compactar es el último recurso antes de cerrar la fila, partir el compás o pasar de hoja.
   */
  const fitsCompact = (pieces, count = 1) => {
    if (!measureCompact || row?.compact || limited(count)) return false;
    const all = [...(row ? row.fragments.map((f) => [f.unitIndex, f.from, f.to]) : []), ...pieces];
    const sizes = all.map(([ui, from, to]) => measure(ui, from, to, true));
    const w = sizes.reduce((total, size, i) => total + (i ? columnGap : 0) + size.width, 0);
    const hgt = totalHeight(sizes.map(heightParts).reduce(mergeHeights));
    return w <= maxW && y + hgt <= bodyH;
  };
  const emptyRow = (compact = false) => ({ fragments: [], width: 0, height: 0, heights: { rows: [], extra: 0 }, compact });
  /** Vuelve a colocar lo ya puesto en la fila con sus medidas compactas; lo que se añada después también será compacto. */
  const compactRow = () => {
    const placed = row ? row.fragments : [];
    row = emptyRow(true);
    for (const f of placed) add(f.unitIndex, f.from, f.to, measure(f.unitIndex, f.from, f.to, true));
  };
  /** Coloca [from, to) en la fila actual si cabe, tal cual o compactando la fila. */
  const place = (ui, from, to, count) => {
    const size = measure(ui, from, to, Boolean(row?.compact));
    if (fitsRow(size, count)) {
      add(ui, from, to, size);
      return true;
    }
    if (!fitsCompact([[ui, from, to]], count)) return false;
    compactRow();
    add(ui, from, to, measure(ui, from, to, true));
    return true;
  };
  const add = (ui, from, to, size) => {
    if (!row) row = emptyRow();
    row.width += (row.fragments.length ? columnGap : 0) + size.width;
    row.heights = mergeHeights(row.heights, heightParts(size));
    row.height = totalHeight(row.heights);
    row.fragments.push({ unitIndex: ui, from, to, width: size.width, height: size.height, columns: size.columns, natural: size.natural });
  };

  units.forEach((unit, ui) => {
    const n = unit.atoms.length;
    let from = 0;
    const count = unit.repeatPair === 'second' ? 0 : 1; // El segundo destino ya se contó con el primero.
    if ((unit.breakBefore || units[ui - 1]?.breakAfter) && unit.repeatPair !== 'second') closeRow();
    for (;;) {
      if (!page) newPage();
      const whole = measure(ui, from, n);

      // Pareja de repetición de dos compases: sus dos destinos van siempre en la misma fila (el signo cae sobre la barra común).
      if (from === 0 && unit.repeatPair === 'first' && units[ui + 1]) {
        const pieces = [[ui, 0, n], [ui + 1, 0, units[ui + 1].atoms.length]];
        const pairFits = () => {
          const [a, b] = pieces.map(([i, f, t]) => measure(i, f, t, Boolean(row?.compact)));
          const parts = mergeHeights(heightParts(a), heightParts(b));
          return fitsRow({ width: a.width + columnGap + b.width, height: totalHeight(parts), rows: parts.rows, extra: parts.extra }, 2)
            || fitsCompact(pieces, 2);
        };
        if (!pairFits() && row) {
          closeRow();
          if (!pairFits() && !isFresh()) newPage();
        }
      }

      if (place(ui, from, n, count)) break;
      if (row) {
        closeRow();
        if (place(ui, from, n, count)) break;
      }
      const fresh = isFresh();
      const fitsEmpty = (size) => size.width <= maxW && size.height <= bodyH;
      if (!fresh && (fitsEmpty(whole) || (measureCompact && fitsEmpty(measure(ui, from, n, true))))) {
        newPage();
        if (!place(ui, from, n, count)) add(ui, from, n, whole);
        break;
      }

      // No cabe entero en una fila vacía de esta hoja: partir entre tarjetas, llenando lo que quede.
      let best = null;
      for (let to = from + 1; to < n; to++) {
        const f = measure(ui, from, to);
        if (f.width <= maxW && y + f.height <= bodyH) best = { to, size: f };
        else break;
      }
      if (best) {
        add(ui, from, best.to, best.size);
        closeRow();
        from = best.to;
        continue;
      }
      if (!fresh) {
        newPage();
        continue;
      }

      // Ni una sola tarjeta cabe en una hoja vacía: error visible, sin descartar ni recortar datos.
      const to = n - from > 1 ? from + 1 : n;
      const size = to === n ? whole : measure(ui, from, to);
      const tooWide = size.width > maxW;
      const what = n > 0 ? `la tarjeta ${from + 1}` : 'el contenido';
      errors.push({
        kind: tooWide ? 'width' : 'height',
        unitIndex: ui,
        measureId: unit.measureId,
        from,
        to,
        message: tooWide
          ? `Compás ${unit.label}: ${what} mide ${round(size.width)} px de ancho y el área útil es ${round(content.width)} px. No cabe ni sola; los datos se conservan sin cambios.`
          : `Compás ${unit.label}: ${what} mide ${round(size.height)} px de alto y el área útil bajo la cabecera es ${round(Math.max(bodyH, 0))} px. No cabe ni sola; los datos se conservan sin cambios.`,
      });
      page.overflow = true;
      add(ui, from, to, size);
      closeRow();
      if (to >= n) break;
      from = to;
    }
  });

  if (page) closeRow();
  if (!pages.length) newPage();

  for (const p of pages) alignFilledRows(p);

  return { pages, errors, notices, bodyHeight: bodyH };
}
