import { notify } from './notify.js';

/**
 * Acciones de fases posteriores: se muestran como no disponibles (aria-disabled) y, al pulsarlas,
 * explican por qué. No ejecutan nada ni simulan guardar o exportar.
 */
export function mountDisabledActions() {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[aria-disabled="true"]');
    if (!button) return;
    event.preventDefault();
    notify(button.dataset.reason || 'Esta acción llega en una fase posterior.', { duration: 4500 });
  });
}
