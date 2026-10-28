import { h } from '../render/dom.js';
import { fragmentNode, headerNode } from '../render/sheet.js';
import { pageStyleVars } from './spec.js';

/**
 * Medición real en el DOM, con las fuentes ya cargadas. Dibuja los mismos nodos que la vista previa y la
 * exportación (fragmentNode, headerNode) en una caja fuera de pantalla y lee su tamaño. No decide dónde
 * va nada: eso es paginate.js.
 */
export function createMeasurer() {
  const row = h('div', { class: 'fila' });
  const box = h('div', { class: 'hoja-medida', 'aria-hidden': 'true', style: pageStyleVars() }, row);
  document.body.append(box);

  return {
    /** Área útil de la hoja: tamaño exterior menos márgenes, leído del CSS real. */
    content() {
      const probe = h('section', { class: 'hoja' });
      box.append(probe);
      const style = getComputedStyle(probe);
      const rect = probe.getBoundingClientRect();
      const px = (name) => parseFloat(style[name]) || 0;
      const content = {
        width: rect.width - px('paddingLeft') - px('paddingRight') - px('borderLeftWidth') - px('borderRightWidth'),
        height: rect.height - px('paddingTop') - px('paddingBottom') - px('borderTopWidth') - px('borderBottomWidth'),
      };
      probe.remove();
      return content;
    },

    /** Altura de la cabecera con el ancho útil y el mayor formato de numeración razonable. */
    headerHeight(song, contentWidth) {
      const holder = h('div', { class: 'cab-medida' });
      holder.style.width = `${contentWidth}px`;
      holder.append(headerNode(song, '99/99'));
      box.append(holder);
      const height = holder.getBoundingClientRect().height;
      holder.remove();
      return height;
    },

    /**
     * Tamaño del fragmento solo en una fila, con la altura desglosada en las pistas que la fila comparte entre compases.
     * `compact` lo mide en una fila compacta (tarjetas estrechadas hasta su mástil, ver .fila-compacta en sheet.css).
     */
    fragment(ctx, unitIndex, from, to, { compact = false } = {}) {
      const node = fragmentNode(ctx, unitIndex, from, to);
      row.classList.toggle('fila-compacta', compact);
      row.append(node);
      const rect = row.getBoundingClientRect();
      const width = node.getBoundingClientRect().width;
      const style = getComputedStyle(row);
      const tracks = style.gridTemplateRows.split(/\s+/).map(parseFloat);
      // Ancho natural de cada columna (pista) de la fila medida a su contenido: base del tope de crecimiento de cada tarjeta.
      const cols = style.gridTemplateColumns.split(/\s+/).map(parseFloat);
      node.remove();
      const rows = tracks.length > 1 && tracks.every(Number.isFinite) ? tracks : undefined;
      const columns = cols.length && cols.every((n) => Number.isFinite(n) && n > 0) ? cols : undefined;
      return { width, height: rect.height, ...(rows ? { rows } : {}), ...(columns ? { columns } : {}) };
    },

    dispose() {
      box.remove();
    },
  };
}
