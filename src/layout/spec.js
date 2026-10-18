/**
 * Medidas de la hoja. Única fuente: el renderizador las vuelca en variables CSS de cada hoja (pageStyleVars),
 * así vista previa, medición y exportación usan exactamente los mismos milímetros.
 */

export const MM_PX = 96 / 25.4;

/** A4 apaisado con márgenes explícitos. El área útil es 287 × 200 mm. */
export const PAGE = { widthMm: 297, heightMm: 210, marginMm: 5 };

export const PAGE_PX = { width: PAGE.widthMm * MM_PX, height: PAGE.heightMm * MM_PX };

/** Separaciones en píxeles CSS: entre compases de una fila, entre filas y entre la cabecera y la primera fila. */
export const GAPS = { column: 6, row: 8, header: 10 };

/**
 * Expansión máxima de CADA columna (tarjeta) respecto a su ancho natural medido (0.25 = hasta un 25 % más). Ninguna columna
 * supera ese tope; el sobrante de la hoja queda a la derecha en lugar de estirar tarjetas y compases. Valor inicial: ajustar tras revisar capturas.
 */
export const MAX_ROW_EXPANSION = 0.25;

/** Margen que se resta al área útil al repartir, para que una diferencia de subpíxel no desborde una fila. */
export const SAFETY_PX = 1;

/** Separación entre hojas en la vista previa (px, a zoom 100 %). */
export const PREVIEW_GAP = 24;

export function pageStyleVars() {
  return [
    `--hoja-w:${PAGE.widthMm}mm`,
    `--hoja-h:${PAGE.heightMm}mm`,
    `--hoja-margen:${PAGE.marginMm}mm`,
    `--col-gap:${GAPS.column}px`,
    `--fila-gap:${GAPS.row}px`,
    `--cab-gap:${GAPS.header}px`,
  ].join(';');
}
