import { iconButton } from './icons.js';
import { notify } from './notify.js';

export function mountHistoryControls(store) {
  // Las acciones de cabecera quedan inactivas mientras hay un diálogo modal abierto.
  for (const id of ['song-dialog', 'marks-dialog', 'colors-dialog']) {
    const controls = document.createElement('div');
    controls.className = 'history-actions';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Historial de cambios');
    for (const [action, label] of [['undo', 'Deshacer'], ['redo', 'Rehacer']]) {
      const button = iconButton(action, label, null);
      button.dataset.history = action;
      controls.append(button);
    }
    document.querySelector(`#${id} .dialog-actions`).prepend(controls);
  }
  const buttons = [...document.querySelectorAll('[data-history]')];
  function run(action) {
    if (store[action]()) notify(action === 'undo' ? 'Cambio deshecho.' : 'Cambio rehecho.');
  }
  for (const button of buttons) button.addEventListener('click', () => run(button.dataset.history));
  function sync(state) {
    for (const button of buttons) button.disabled = !(button.dataset.history === 'undo' ? state.canUndo : state.canRedo);
  }
  const editable = element => element instanceof Element && Boolean(element.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'));
  document.addEventListener('focusin', event => {
    if (event.target.matches('input[type="text"], input[type="color"], textarea')) store.beginEdit();
  });
  document.addEventListener('focusout', () => store.endEdit());
  document.addEventListener('keydown', event => {
    // Dentro de los campos se conserva el deshacer nativo, incluido el borrador de una marca.
    if (event.defaultPrevented || event.isComposing || event.altKey || !(event.ctrlKey || event.metaKey) || editable(event.target)) return;
    const modal = [...document.querySelectorAll('dialog[open]')].at(-1);
    if (modal && !modal.matches('#song-dialog, #marks-dialog, #colors-dialog')) return;
    const key = event.key.toLowerCase();
    const action = key === 'z' ? (event.shiftKey ? 'redo' : 'undo') : key === 'y' && !event.shiftKey ? 'redo' : null;
    if (!action) return;
    event.preventDefault(); run(action);
  });
  sync(store.state);
  store.subscribe(sync);
}
