/** Zoom de la vista previa. Puro: el zoom no interviene en la paginación ni en la exportación. */

export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 1.5;

export function clampZoom(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
}

/**
 * Escala para que la hoja ocupe el ancho disponible. El mínimo es bajo a propósito: en un móvil de 360 px el
 * contenedor útil mide unos 300 px y la hoja debe caber entera, así que la escala puede ser inferior al 30 %.
 */
export function fitZoom(innerWidth, sheetWidth) {
  if (!(innerWidth > 0) || !(sheetWidth > 0)) return ZOOM_MIN;
  return clampZoom(innerWidth / sheetWidth);
}
