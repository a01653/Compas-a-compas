import { h } from '../render/dom.js';

let timer = null;

/**
 * Aviso breve visible y anunciado a lectores de pantalla. `action` ({ label, run }) añade un botón al aviso, por ejemplo
 * Deshacer tras borrar; mientras lo lleva, el aviso deja de estar oculto a la accesibilidad para poder pulsarlo.
 */
export function notify(message, { duration = 5000, action = null } = {}) {
  const live = document.getElementById('estado-vivo');
  const toast = document.getElementById('toast');
  live.textContent = '';
  live.textContent = action ? `${message} ${action.label} está disponible en el aviso.` : message;
  toast.replaceChildren(message);
  if (action) {
    toast.append(h('button', { type: 'button', class: 'toast-action', onclick: () => { toast.hidden = true; action.run(); } }, action.label));
    toast.removeAttribute('aria-hidden');
  } else toast.setAttribute('aria-hidden', 'true');
  toast.hidden = false;
  clearTimeout(timer);
  timer = setTimeout(() => { toast.hidden = true; }, action ? Math.max(duration, 9000) : duration);
}

/** Enfoca un elemento tras el siguiente renderizado. */
export function focusSoon(id, { select = false } = {}) {
  requestAnimationFrame(() => {
    const el = document.getElementById(id);
    if (!el) return;
    el.focus();
    if (select && typeof el.select === 'function') el.select();
  });
}
