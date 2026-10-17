import { h } from '../render/dom.js';

export function mountSongPanel(root, store, { recoveryAvailable = true } = {}) {
  const bind = (key) => (e) => {
    store.state.song[key] = e.target.value;
    store.emit('text');
  };

  const title = h('input', { id: 'f-titulo', type: 'text', autocomplete: 'off', oninput: bind('title') });
  const key = h('input', { id: 'f-tono', type: 'text', autocomplete: 'off', oninput: bind('key') });
  const docVersion = h('input', { id: 'f-version', type: 'text', autocomplete: 'off', oninput: bind('documentVersion') });
  const recovery = h('p', { class: 'hint', id: 'hint-recuperacion' });

  root.append(
    h('div', { class: 'panel-head' }, h('h2', { id: 't-cancion' }, 'Canción')),
    h('div', { class: 'field' }, h('label', { for: 'f-titulo' }, 'Nombre de la canción'), title),
    h('div', { class: 'field' }, h('label', { for: 'f-tono' }, 'Tonalidad'), key),
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
    docVersion.value = state.song.documentVersion || '';
  }

  setRecoveryHint(recoveryAvailable);
  sync(store.state);
  // Solo al sustituir la canción se reescriben los campos; al escribir no se toca el input activo.
  store.subscribe((state, scope) => { if (scope === 'document' || scope === 'history') sync(state); });
  return { setRecoveryHint };
}
