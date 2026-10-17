import { h } from '../render/dom.js';
import { describeParsedMeasure, parseList } from '../model/listImport.js';
import { appendParsedMeasures } from '../model/song.js';
import { openDialog } from './dialog.js';
import { notify } from './notify.js';

const EXAMPLE = `1 | Cm7 @ x 3 5 3 4 3 / 8 10 8 8 8 8
2 | F7 @ 1 3 1 2 1 1 ; Bbmaj7 @ x 1 3 2 3 1
3 |`;

/** Entrada por lista con previsualización. Nada se aplica hasta pulsar «Añadir» y solo si no hay errores. */
export async function openImportDialog(store) {
  const textarea = h('textarea', { id: 'lista-texto', rows: 7, spellcheck: 'false', autocomplete: 'off', 'aria-describedby': 'lista-ayuda lista-resumen' });
  const summary = h('p', { id: 'lista-resumen', class: 'hint', role: 'status' }, 'Escribe o pega la lista para ver la previsualización.');
  const preview = h('ol', { class: 'dialog-list import-preview' });
  const errorsBox = h('ul', { class: 'dialog-list import-errors', 'aria-label': 'Errores por línea' });

  const content = [
    h('div', { class: 'field' },
      h('label', { for: 'lista-texto' }, 'Lista de compases (uno por línea)'),
      textarea,
      h('span', { class: 'hint', id: 'lista-ayuda' }, 'Formato: etiqueta | acorde @ digitación ; acorde @ digitación. Varias tarjetas con el mismo nombre: separa las digitaciones con « / » y espacios. Una barra de bajo como C/E no separa nada. Los compases se añaden al final.')),
    h('pre', { class: 'import-example' }, EXAMPLE),
    summary, errorsBox, preview,
  ];

  const dialogHandle = openDialog({
    title: 'Importar lista de compases',
    content,
    actions: [
      { label: 'Cancelar', value: 'cancel' },
      { label: 'Añadir a la canción', value: 'apply', kind: 'primary' },
    ],
  });
  const applyButton = dialogHandle.buttons.apply;
  applyButton.disabled = true;

  let parsed = { measures: [], errors: [] };
  function update() {
    parsed = parseList(textarea.value);
    errorsBox.replaceChildren(...parsed.errors.map((e) => h('li', null, `Línea ${e.lineNo}: ${e.message}`)));
    preview.replaceChildren(...parsed.measures.map((m) => h('li', null, `Compás ${m.label}: ${describeParsedMeasure(m)}`)));
    const hasText = textarea.value.trim().length > 0;
    const ok = hasText && parsed.errors.length === 0 && parsed.measures.length > 0;
    applyButton.disabled = !ok;
    summary.textContent = !hasText
      ? 'Escribe o pega la lista para ver la previsualización.'
      : parsed.errors.length
        ? `${parsed.errors.length} error(es). No se añade nada hasta corregirlos todos; no hay importación parcial.`
        : `${parsed.measures.length} compás(es) listos para añadir al final de la canción.`;
  }
  textarea.addEventListener('input', update);
  textarea.focus();

  const value = await dialogHandle.result;
  if (value !== 'apply' || parsed.errors.length || !parsed.measures.length) return;
  const created = appendParsedMeasures(store.state.song, parsed.measures);
  store.commit('structure', { measureId: created[0].id });
  notify(`Se añadieron ${created.length} compás(es).`);
}
