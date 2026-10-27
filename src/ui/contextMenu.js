import { h } from '../render/dom.js';

let closeCurrent = null;

export function closeContextMenu() {
  closeCurrent?.();
}

export const contextMenuOpen = () => closeCurrent !== null;

/**
 * Menú contextual flotante. `items`: { label, hint, title, disabled, danger, run }, { separator: true } o { heading }.
 * Se coloca en (x, y) sin salirse de la ventana. Flechas, Inicio y Fin recorren las opciones activas; Esc, Tab, un clic fuera,
 * desplazar o redimensionar lo cierran. Al cerrarse con el teclado el foco vuelve a `returnFocus`.
 */
export function openContextMenu({ x, y, label, items, returnFocus = null }) {
  closeContextMenu();
  const menu = h('div', { class: 'context-menu', role: 'menu', 'aria-label': label });
  const buttons = [];
  for (const item of items) {
    if (item.separator) menu.append(h('div', { class: 'context-sep', role: 'separator' }));
    else if (item.heading) menu.append(h('div', { class: 'context-heading', role: 'presentation' }, item.heading));
    else {
      const button = h('button', {
        type: 'button', role: 'menuitem', tabindex: '-1', disabled: item.disabled, title: item.title || null,
        class: item.danger ? 'context-item danger' : 'context-item',
        onclick: () => { close(false); item.run(); },
      }, h('span', null, item.label), item.hint ? h('kbd', null, item.hint) : null);
      buttons.push(button);
      menu.append(button);
    }
  }
  document.body.append(menu);
  const { width, height } = menu.getBoundingClientRect();
  menu.style.left = `${Math.max(8, Math.min(x, innerWidth - width - 8))}px`;
  menu.style.top = `${Math.max(8, y + height > innerHeight - 8 ? innerHeight - height - 8 : y)}px`;

  const enabled = () => buttons.filter((b) => !b.disabled);
  const focusAt = (index) => {
    const list = enabled();
    if (list.length) list[(index + list.length) % list.length].focus();
  };
  function onKey(event) {
    const list = enabled();
    const at = list.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') focusAt(at + 1);
    else if (event.key === 'ArrowUp') focusAt(at < 0 ? -1 : at - 1);
    else if (event.key === 'Home') focusAt(0);
    else if (event.key === 'End') focusAt(-1);
    else if (event.key === 'Escape' || event.key === 'Tab') close(false);
    else return;
    event.preventDefault();
    event.stopPropagation();
  }
  const outside = (event) => { if (!menu.contains(event.target)) close(true); };
  const onScroll = (event) => { if (!menu.contains(event.target)) close(true); };
  const onResize = () => close(true);
  function close(silent) {
    if (closeCurrent !== close) return;
    closeCurrent = null;
    document.removeEventListener('pointerdown', outside, true);
    document.removeEventListener('scroll', onScroll, true);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('blur', onResize);
    const hadFocus = menu.contains(document.activeElement);
    menu.remove();
    if (!silent && hadFocus) returnFocus?.focus();
  }
  menu.addEventListener('keydown', onKey);
  document.addEventListener('pointerdown', outside, true);
  document.addEventListener('scroll', onScroll, true);
  window.addEventListener('resize', onResize);
  window.addEventListener('blur', onResize);
  closeCurrent = close;
  focusAt(0);
  return close;
}
