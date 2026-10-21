import { h } from '../render/dom.js';
import { pageNode } from '../render/sheet.js';
import { buildExportDocument, htmlFileName, exportTitle } from '../export/document.js';
import { collectProblems } from '../layout/problems.js';
import { ensureFonts, songSample } from '../layout/fonts.js';
import { checkStructure } from '../model/structure.js';
import { openDialog, messageList, errorDialog } from './dialog.js';
import { notify } from './notify.js';

const ASSET_URLS = ['../../references/fonts.css', '../../styles/tokens.css', '../../styles/sheet.css', '../../styles/export.css']
  .map((path) => new URL(path, import.meta.url));

const PRINT_TIPS = [
  'Destino: «Guardar como PDF» (o tu impresora).',
  'Tamaño de papel: A4. Orientación: horizontal.',
  'Márgenes: «Ninguno» (la hoja ya incluye sus propios márgenes de 5 mm).',
  'Desactiva «Encabezados y pies de página»: el navegador añadiría fecha, dirección y su propia numeración, y la hoja ya lleva la suya.',
  'Activa «Gráficos de fondo» si el navegador lo ofrece, para conservar los colores de las tarjetas.',
];

let assetsPromise = null;

/** Estilos de la exportación, leídos en el momento (fuentes incluidas). Se guardan para no repetir las peticiones. */
function loadAssets() {
  if (!assetsPromise) {
    assetsPromise = Promise.all(ASSET_URLS.map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${url.pathname}: HTTP ${response.status}`);
      return response.text();
    })).then((parts) => parts.join('\n')).catch((error) => {
      assetsPromise = null;
      throw error;
    });
  }
  return assetsPromise;
}

function buildHtml({ result, css }) {
  const { snapshot, ctx, layout } = result;
  const total = layout.pages.length;
  const holder = h('div');
  layout.pages.forEach((page, i) => holder.append(pageNode(ctx, page, i + 1, total)));
  return buildExportDocument({ title: snapshot.title, css, bodyHtml: holder.innerHTML });
}

async function saveHtml(text, suggestedName) {
  if (typeof window.showSaveFilePicker === 'function') {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [{ description: 'Hojas de acordes (HTML)', accept: { 'text/html': ['.html'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return handle.name;
    } catch (error) {
      if (error && error.name === 'AbortError') return null;
      throw error;
    }
  }
  const url = URL.createObjectURL(new Blob([text], { type: 'text/html;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = suggestedName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return suggestedName;
}

let printFrame = null;
let appTitle = null;

/** Devuelve a la pestaña el título de la aplicación tras imprimir. */
function restoreTitle() {
  if (appTitle === null) return;
  document.title = appTitle;
  appTitle = null;
}

/**
 * Imprime el mismo HTML de la exportación desde un marco oculto: sin editor, sin selección resaltada.
 * Chromium propone el nombre del PDF a partir del título de la página principal, no del marco, así que
 * mientras dura la impresión la pestaña lleva el título de la canción.
 */
function printHtml(html, sample, title) {
  if (printFrame) printFrame.remove();
  return new Promise((resolve, reject) => {
    const frame = h('iframe', { class: 'print-frame', title: 'Hojas para imprimir', 'aria-hidden': 'true', tabindex: '-1' });
    printFrame = frame;
    const cleanup = () => {
      if (printFrame === frame) {
        printFrame = null;
        restoreTitle();
      }
      frame.remove();
    };
    frame.addEventListener('load', async () => {
      try {
        const win = frame.contentWindow;
        await ensureFonts(sample, win.document);
        // Dos fotogramas para que el marco termine de componer; el plazo evita esperar si el navegador no los entrega.
        await Promise.race([
          new Promise((done) => win.requestAnimationFrame(() => win.requestAnimationFrame(done))),
          new Promise((done) => setTimeout(done, 500)),
        ]);
        win.addEventListener('afterprint', cleanup, { once: true });
        setTimeout(cleanup, 10 * 60 * 1000);
        if (appTitle === null) appTitle = document.title;
        document.title = title;
        win.focus();
        win.print();
        resolve();
      } catch (error) {
        cleanup();
        reject(error);
      }
    }, { once: true });
    frame.srcdoc = html;
    document.body.append(frame);
  });
}

/** Exportar HTML e Imprimir / PDF. Ambos esperan a la última paginación y se bloquean si la hoja está incompleta. */
export function mountExportControls(store, paginator) {
  const exportButton = document.getElementById('btn-exportar-html');
  const printButton = document.getElementById('btn-imprimir');
  let busy = false;

  const setBusy = (on) => {
    busy = on;
    for (const button of [exportButton, printButton]) {
      button.disabled = on;
      button.setAttribute('aria-busy', on ? 'true' : 'false');
    }
  };

  function pendingBlock(pending) {
    if (!pending.length) return null;
    return h('div', null,
      h('p', null, `Hay ${pending.length} referencia(s) musical(es) pendiente(s). Se incluirán tal como están: no se corrigen ni se redirigen, y la exportación no valida el recorrido de la partitura.`),
      messageList(pending.map((w) => w.message)));
  }

  /** Pide la decisión visible antes de exportar. Devuelve true si el usuario continúa. */
  async function decide(kind, pending) {
    if (kind === 'html' && !pending.length) return true;
    const content = [
      pendingBlock(pending),
      kind === 'print'
        ? h('div', null, h('p', null, 'Se abrirá el diálogo de impresión del navegador. Para que el resultado coincida con las hojas:'), messageList(PRINT_TIPS))
        : null,
    ].filter(Boolean);
    const { result } = openDialog({
      title: kind === 'print' ? 'Imprimir / PDF' : 'Exportar con avisos',
      content,
      actions: [
        { label: 'Cancelar', value: 'cancel' },
        { label: kind === 'print' ? 'Abrir impresión' : 'Exportar de todos modos', value: 'go', kind: 'primary' },
      ],
    });
    return (await result) === 'go';
  }

  /** Última paginación válida + estilos, o null si se cancela o falla. Repite si se edita durante la espera. */
  async function prepare(kind) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await paginator.settled();
      if (!result || result.error) {
        await errorDialog({
          title: 'No se pueden preparar las hojas',
          intro: 'La canción no se ha modificado.',
          errors: [`Error al medir las hojas: ${(result && result.error && result.error.message) || 'desconocido'}`],
        });
        return null;
      }
      let css;
      try {
        css = await loadAssets();
      } catch (error) {
        await errorDialog({
          title: 'No se pudieron leer los estilos y fuentes',
          intro: 'La exportación necesita los archivos locales de la aplicación. Abre la aplicación desde el servidor local (consulta el README).',
          errors: [error.message || String(error)],
        });
        return null;
      }
      if (!paginator.isCurrent(result)) continue;

      const problems = collectProblems(result.snapshot, result.layout);
      if (problems.length) {
        await errorDialog({
          title: 'Exportación bloqueada: la hoja está incompleta',
          intro: 'Algo no se puede dibujar o no cabe en una hoja. No se ha cambiado ninguna nota, pero exportar así daría una hoja incorrecta. Corrígelo en el editor:',
          errors: problems.map((p) => p.message),
        });
        return null;
      }
      if (!(await decide(kind, checkStructure(result.snapshot)))) return null;
      if (!paginator.isCurrent(result)) continue;
      return { result, css };
    }
    notify('La canción siguió cambiando mientras se preparaban las hojas. Vuelve a intentarlo cuando termines de editar.', { duration: 6000 });
    return null;
  }

  async function guarded(task) {
    if (busy) return;
    setBusy(true);
    try {
      await task();
    } catch (error) {
      await errorDialog({ title: 'No se pudo completar la acción', intro: 'La canción sigue abierta y sin cambios.', errors: [error.message || String(error)] });
    } finally {
      setBusy(false);
    }
  }

  exportButton.addEventListener('click', () => guarded(async () => {
    const prepared = await prepare('html');
    if (!prepared) return;
    const html = buildHtml(prepared);
    const name = await saveHtml(html, htmlFileName(prepared.result.snapshot));
    if (name === null) return;
    const total = prepared.result.layout.pages.length;
    notify(`Exportadas ${total} ${total === 1 ? 'hoja' : 'hojas'} como ${name}. Revisa el resultado antes de usarlo.`, { duration: 7000 });
  }));

  printButton.addEventListener('click', () => guarded(async () => {
    const prepared = await prepare('print');
    if (!prepared) return;
    const { snapshot } = prepared.result;
    await printHtml(buildHtml(prepared), songSample(snapshot), exportTitle(snapshot.title));
  }));
}
