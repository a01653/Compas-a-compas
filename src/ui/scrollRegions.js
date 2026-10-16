/**
 * Las zonas de edición con scroll propio reciben foco de teclado (para desplazarlas con flechas) solo
 * cuando realmente desplazan: columnas con ancho >= 1181px, columna única de edición entre 761 y 1180px.
 * En pantallas estrechas el scroll es el de la página y no se añade ninguna parada de tabulación.
 */
const WIDE = window.matchMedia('(min-width: 1181px)');
const MEDIUM = window.matchMedia('(min-width: 761px)');

function setRegion(el, on) {
  if (!el) return;
  if (on) {
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', el.dataset.region || 'Zona de edición');
  } else {
    el.removeAttribute('tabindex');
    el.removeAttribute('role');
    el.removeAttribute('aria-label');
  }
}

function apply() {
  setRegion(document.getElementById('col-lista'), WIDE.matches);
  setRegion(document.getElementById('col-editor'), WIDE.matches);
  setRegion(document.getElementById('edicion'), MEDIUM.matches && !WIDE.matches);
}

apply();
WIDE.addEventListener('change', apply);
MEDIUM.addEventListener('change', apply);
