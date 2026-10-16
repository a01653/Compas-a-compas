let timer = null;

/** Aviso breve visible y anunciado a lectores de pantalla. */
export function notify(message, { duration = 5000 } = {}) {
  const live = document.getElementById('estado-vivo');
  const toast = document.getElementById('toast');
  live.textContent = '';
  live.textContent = message;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(timer);
  timer = setTimeout(() => { toast.hidden = true; }, duration);
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
