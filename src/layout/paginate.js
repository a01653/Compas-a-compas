/**
 * Reparto de compases en filas y hojas. Módulo puro: recibe tamaños ya medidos y devuelve un plan.
 *
 * `measureFragment(unitIndex, from, to)` devuelve { width, height } del fragmento [from, to) del compás
 * (con sus marcas, etiqueta y tarjetas). Quien llama decide cómo se mide; aquí solo se decide dónde va cada cosa.
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
 * @param {object} p
 * @param {Array<{ measureId: string, label: string, atoms: Array<object> }>} p.units
 * @param {(unitIndex: number, from: number, to: number) => { width: number, height: number }} p.measureFragment
 * @param {{ width: number, height: number }} p.content área útil de la hoja
 * @param {number} p.headerHeight altura medida de la cabecera
 */
export function paginate({ units, measureFragment, content, headerHeight, columnGap = 0, rowGap = 0, headerGap = 0, safety = 0 }) {
  const errors = [];
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
  const isFresh = () => !row && page.rows.length === 0;
  const closeRow = () => {
    if (!row) return;
    page.rows.push(row);
    y += row.height + rowGap;
    row = null;
  };
  const fitsRow = (size) => {
    const w = row ? row.width + columnGap + size.width : size.width;
    const hgt = row ? Math.max(row.height, size.height) : size.height;
    return w <= maxW && y + hgt <= bodyH;
  };
  const add = (ui, from, to, size) => {
    if (!row) row = { fragments: [], width: 0, height: 0 };
    row.width += (row.fragments.length ? columnGap : 0) + size.width;
    row.height = Math.max(row.height, size.height);
    row.fragments.push({ unitIndex: ui, from, to, width: size.width, height: size.height });
  };

  units.forEach((unit, ui) => {
    const n = unit.atoms.length;
    let from = 0;
    for (;;) {
      if (!page) newPage();
      const whole = measure(ui, from, n);

      if (fitsRow(whole)) {
        add(ui, from, n, whole);
        break;
      }
      if (row) {
        closeRow();
        if (fitsRow(whole)) {
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

  return { pages, errors, bodyHeight: bodyH };
}
