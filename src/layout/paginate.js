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
 * @param {{ width: number, height: number }} p.content área útil de la hoja
 * @param {number} p.headerHeight altura medida de la cabecera
 * @param {number} [p.maxPerRow] tope de compases (fragmentos) por fila; 0 = automático, como hasta ahora
 */
export function paginate({ units, measureFragment, content, headerHeight, columnGap = 0, rowGap = 0, headerGap = 0, safety = 0, maxPerRow = 0 }) {
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
  const measure = (ui, from, to) => {
    const key = `${ui}:${from}:${to}`;
    let size = cache.get(key);
    if (!size) {
      size = measureFragment(ui, from, to);
      // Ancho manual (porcentaje del ancho útil): solo en el compás entero y nunca por debajo de su contenido natural.
      const unit = units[ui];
      if (unit.widthPercent && from === 0 && to >= unit.atoms.length) {
        const wanted = Math.min(maxW, (content.width * unit.widthPercent) / 100);
        if (wanted >= size.width) size = { ...size, natural: size.width, width: wanted };
        else {
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
  const isFresh = () => !row && page.rows.length === 0;
  const closeRow = () => {
    if (!row) return;
    finishRow(row);
    page.rows.push(row);
    y += row.height + rowGap;
    row = null;
  };
  // `count` = compases que añade lo que se coloca. Un tope no impide una fila vacía (una pareja de dos compases cabe sola).
  const fitsRow = (size, count = 1) => {
    const w = row ? row.width + columnGap + size.width : size.width;
    const hgt = totalHeight(row ? mergeHeights(row.heights, heightParts(size)) : heightParts(size));
    const limited = maxPerRow > 0 && row && row.fragments.length + count > maxPerRow;
    return !limited && w <= maxW && y + hgt <= bodyH;
  };
  const add = (ui, from, to, size) => {
    if (!row) row = { fragments: [], width: 0, height: 0, heights: { rows: [], extra: 0 } };
    row.width += (row.fragments.length ? columnGap : 0) + size.width;
    row.heights = mergeHeights(row.heights, heightParts(size));
    row.height = totalHeight(row.heights);
    row.fragments.push({ unitIndex: ui, from, to, width: size.width, height: size.height, columns: size.columns, natural: size.natural });
  };

  units.forEach((unit, ui) => {
    const n = unit.atoms.length;
    let from = 0;
    const count = unit.repeatPair === 'second' ? 0 : 1; // El segundo destino ya se contó con el primero.
    for (;;) {
      if (!page) newPage();
      const whole = measure(ui, from, n);

      // Pareja de repetición de dos compases: sus dos destinos van siempre en la misma fila (el signo cae sobre la barra común).
      if (from === 0 && unit.repeatPair === 'first' && units[ui + 1]) {
        const next = measure(ui + 1, 0, units[ui + 1].atoms.length);
        const parts = mergeHeights(heightParts(whole), heightParts(next));
        const pair = { width: whole.width + columnGap + next.width, height: totalHeight(parts), rows: parts.rows, extra: parts.extra };
        if (!fitsRow(pair, 2) && row) {
          closeRow();
          if (!fitsRow(pair, 2) && !isFresh()) newPage();
        }
      }

      if (fitsRow(whole, count)) {
        add(ui, from, n, whole);
        break;
      }
      if (row) {
        closeRow();
        if (fitsRow(whole, count)) {
          add(ui, from, n, whole);
          break;
        }
      }
      const fresh = isFresh();
      if (!fresh && whole.width <= maxW && whole.height <= bodyH) {
        newPage();
        add(ui, from, n, whole);
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

  return { pages, errors, notices, bodyHeight: bodyH };
}
