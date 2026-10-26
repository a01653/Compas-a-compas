import { titleFileName } from '../model/serialize.js';

/** Ensambla el HTML autónomo. Puro: recibe estilos y hojas ya serializadas; no lleva JavaScript ni peticiones externas. */

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Impide que un texto dentro de <style> pueda cerrar la etiqueta. */
export function neutralizeStyle(css) {
  return String(css).replace(/<\/(style)/gi, '<\\/$1');
}

/** Nombre del HTML exportado: el título de las hojas, el mismo que da nombre al PDF. */
export function htmlFileName(song) {
  return titleFileName(exportTitle(song.title), 'html', exportTitle(''));
}

/** Título de las hojas exportadas; también da nombre al PDF que propone el navegador al imprimir. */
export function exportTitle(title) {
  return String(title || '').trim() || 'Hojas de acordes';
}

/**
 * @param {{ title: string, css: string, bodyHtml: string }} p
 * `bodyHtml` debe venir de serializar nodos DOM (los textos de usuario salen escapados). Como defensa
 * adicional se rechaza cualquier <script o <link/<img/<iframe sin escapar en el cuerpo.
 */
export function buildExportDocument({ title, css, bodyHtml }) {
  if (/<\s*(script|link|iframe|object|embed|base|meta)\b/i.test(bodyHtml)) {
    throw new Error('El cuerpo de la exportación contiene etiquetas no permitidas.');
  }
  const heading = exportTitle(title);
  return [
    '<!doctype html>',
    '<html lang="es">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapeHtml(heading)}</title>`,
    `<style>\n${neutralizeStyle(css)}\n</style>`,
    '</head>',
    '<body class="exportada">',
    `<main class="hojas">${bodyHtml}</main>`,
    '</body>',
    '</html>',
    '',
  ].join('\n');
}
