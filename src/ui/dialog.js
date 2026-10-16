import { h } from '../render/dom.js';

let counter = 0;

/**
 * Diálogo modal con <dialog>. actions: [{ label, value, kind: 'primary' | 'danger' | 'plain' }].
 * Devuelve { result, dialog, buttons }: result se resuelve con el valor pulsado o 'cancel' (Esc).
 */
export function openDialog({ title, content, actions }) {
  const titleId = `dialogo-${++counter}`;
  const buttons = {};
  const dialog = h('dialog', { class: 'dialog', 'aria-labelledby': titleId });
  const bar = h('div', { class: 'dialog-actions' }, actions.map((a) => {
    const button = h('button', {
      type: 'button',
      class: a.kind === 'primary' ? 'btn btn-primary' : a.kind === 'danger' ? 'btn btn-danger' : 'btn',
      onclick: () => dialog.close(a.value),
    }, a.label);
    buttons[a.value] = button;
    return button;
  }));
  dialog.append(h('h2', { id: titleId }, title), h('div', { class: 'dialog-body' }, content), bar);

  const result = new Promise((resolve) => {
    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve(dialog.returnValue || 'cancel');
    });
  });
  document.body.append(dialog);
  dialog.showModal();
  return { result, dialog, buttons };
}

export function messageList(items) {
  return h('ul', { class: 'dialog-list' }, items.map((item) => h('li', null, item)));
}

/** Confirmación simple. Devuelve el valor de la acción elegida. */
export function confirmDialog({ title, intro, items = [], actions }) {
  const content = [intro ? h('p', null, intro) : null, items.length ? messageList(items) : null];
  return openDialog({ title, content, actions }).result;
}

/** Informa de errores sin cambiar nada. */
export function errorDialog({ title, intro, errors }) {
  return confirmDialog({ title, intro, items: errors, actions: [{ label: 'Entendido', value: 'ok', kind: 'primary' }] });
}
