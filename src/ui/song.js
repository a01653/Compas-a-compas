import { h } from '../render/dom.js';
import { FAMILIES } from '../model/families.js';
import { MAX_MEASURES_PER_ROW_LIMIT, measureNumbersVisible, setFretboardScalePercent, setMaxMeasuresPerRow, setShowMeasureNumbers } from '../model/song.js';
import { normalizeFamily, setKeyFamily, setShowTonalities, tonalitiesVisible } from '../model/tonality.js';

export function mountSongPanel(root, store, { recoveryAvailable = true } = {}) {
  const bind = (key) => (e) => {
    store.state.song[key] = e.target.value;
    store.emit('text');
  };

  const title = h('input', { id: 'f-titulo', type: 'text', autocomplete: 'off', oninput: bind('title') });
  const key = h('input', { id: 'f-tono', type: 'text', autocomplete: 'off', oninput: bind('key') });
  const docVersion = h('input', { id: 'f-version', type: 'text', autocomplete: 'off', oninput: bind('documentVersion') });
  const recovery = h('p', { class: 'hint', id: 'hint-recuperacion' });
  // Selector y casilla son cambios discretos: cada uno es su propio paso de historial, separado de la escritura.
  const keyFamily = h('select', { id: 'f-tono-calidad', onchange: e => {
    store.endEdit(); setKeyFamily(store.state.song, e.target.value); store.emit('text');
  } }, Object.entries(FAMILIES).map(([value, family]) => h('option', { value }, family.label)));
  const showTonalities = h('input', { id: 'f-mostrar-tonalidades', type: 'checkbox', 'aria-describedby': 'hint-mostrar-tonalidades', onchange: e => {
    store.endEdit(); setShowTonalities(store.state.song, e.target.checked); store.emit('text');
  } });

  const showNumbers = h('input', { id: 'f-mostrar-numeros', type: 'checkbox', 'aria-describedby': 'hint-mostrar-numeros', onchange: e => {
    store.endEdit(); setShowMeasureNumbers(store.state.song, e.target.checked); store.emit('text');
  } });
  const maxPerRow = h('select', { id: 'f-max-compases', 'aria-describedby': 'hint-max-compases', onchange: e => {
    store.endEdit(); setMaxMeasuresPerRow(store.state.song, e.target.value); store.emit('text');
  } }, h('option', { value: '' }, 'Automático'),
  Array.from({ length: MAX_MEASURES_PER_ROW_LIMIT }, (_, i) => h('option', { value: String(i + 1) }, String(i + 1))));
  const fretboardScale = h('select', { id: 'f-escala-mastiles', 'aria-describedby': 'hint-escala-mastiles', onchange: e => {
    store.endEdit(); setFretboardScalePercent(store.state.song, e.target.value); store.emit('text');
  } }, [100, 90, 80, 75, 70, 65, 60].map(value => h('option', { value: String(value) }, `${value} %`)));

  root.append(
    h('div', { class: 'panel-head' }, h('h2', { id: 't-cancion' }, 'Canción')),
    h('div', { class: 'field' }, h('label', { for: 'f-titulo' }, 'Nombre de la canción'), title),
    h('div', { class: 'field' }, h('label', { for: 'f-tono' }, 'Tonalidad'), key),
    h('div', { class: 'field' }, h('label', { for: 'f-tono-calidad' }, 'Calidad de tonalidad'), keyFamily),
    h('div', { class: 'field field-check' }, h('label', { for: 'f-mostrar-tonalidades' }, showTonalities, 'Mostrar tonalidades de las tarjetas'),
      h('p', { class: 'hint', id: 'hint-mostrar-tonalidades' }, 'Muestra u oculta los cambios de tonalidad de las tarjetas. No oculta la tonalidad del título.')),
    h('div', { class: 'field field-check' }, h('label', { for: 'f-mostrar-numeros' }, showNumbers, 'Mostrar números de compás'),
      h('p', { class: 'hint', id: 'hint-mostrar-numeros' }, 'Oculta las etiquetas de todos los compases en la hoja (útil para una hoja de acordes). Se conservan en el archivo; repeticiones, Coda, Fine y casillas siguen visibles.')),
    h('div', { class: 'field' }, h('label', { for: 'f-max-compases' }, 'Máximo de compases por línea'), maxPerRow,
      h('p', { class: 'hint', id: 'hint-max-compases' }, 'Automático reparte según el ancho disponible. Un número es un tope: puede haber menos compases por línea si no caben.')),
    h('div', { class: 'field' }, h('label', { for: 'f-escala-mastiles' }, 'Tamaño de los mástiles'), fretboardScale,
      h('p', { class: 'hint', id: 'hint-escala-mastiles' }, 'Reduce proporcionalmente los diagramas para que quepan más filas por página. No cambia trastes ni notas.')),
    h('div', { class: 'field' }, h('label', { for: 'f-version' }, 'Versión del documento (opcional)'), docVersion,
      h('p', { class: 'hint' }, 'Texto libre para tus revisiones de la hoja. No es la versión de la aplicación ni la del formato del archivo.')),
    recovery);

  function setRecoveryHint(available) {
    recovery.textContent = available
      ? 'Los cambios se copian automáticamente en este navegador como recuperación. No sustituye a «Guardar JSON».'
      : 'La copia de recuperación del navegador no está disponible: usa «Guardar JSON» para no perder el trabajo.';
  }

  function sync(state) {
    title.value = state.song.title || '';
    key.value = state.song.key || '';
    keyFamily.value = normalizeFamily(state.song.keyFamily);
    showTonalities.checked = tonalitiesVisible(state.song);
    showNumbers.checked = measureNumbersVisible(state.song);
    maxPerRow.value = Number.isInteger(state.song.maxMeasuresPerRow) ? String(state.song.maxMeasuresPerRow) : '';
    fretboardScale.value = String(state.song.fretboardScalePercent ?? 100);
    docVersion.value = state.song.documentVersion || '';
  }

  setRecoveryHint(recoveryAvailable);
  sync(store.state);
  // Solo al sustituir la canción se reescriben los campos; al escribir no se toca el input activo.
  store.subscribe((state, scope) => { if (scope === 'document' || scope === 'history') sync(state); });
  return { setRecoveryHint };
}
