import { icon } from './icons.js';
import { checkStructure } from '../model/structure.js';
import { marksForMeasure } from '../model/marksContext.js';

export function mountWorkspace(store, { marksPanel }) {
  document.querySelectorAll('[data-icon]').forEach(el => el.prepend(icon(el.dataset.icon)));
  const open = id => {
    document.querySelectorAll('.action-menu[open]').forEach(menu => menu.open = false);
    const dialog = document.getElementById(id);
    if (!dialog.open) dialog.showModal();
  };
  document.getElementById('open-song').addEventListener('click', () => open('song-dialog'));
  document.getElementById('open-song-menu').addEventListener('click', () => open('song-dialog'));
  document.getElementById('open-marks').addEventListener('click', () => {
    marksPanel.openForSelectedMeasure();
    open('marks-dialog');
  });
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.close).close()));
  const menus = () => [...document.querySelectorAll('.action-menu')];
  document.addEventListener('click', event => {
    for (const menu of menus()) if (!menu.contains(event.target) || event.target.closest('button')) menu.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    for (const menu of menus().filter(menu => menu.open)) { menu.open = false; menu.querySelector('summary').focus(); }
  });
  for (const menu of menus()) menu.addEventListener('toggle', () => {
    if (menu.open) for (const other of menus()) if (other !== menu) other.open = false;
  });
  function sync(state) {
    document.getElementById('song-title').textContent = state.song.title || 'Canción sin título';
    document.getElementById('song-key').textContent = state.song.key || 'Sin tonalidad';
    const measure = state.song.measures.find(m => m.id === state.selection.measureId);
    const count = marksForMeasure(state.song, measure?.id).length;
    const warnings = checkStructure(state.song);
    const badge = document.getElementById('marks-count');
    badge.textContent = warnings.length ? `${warnings.length} aviso(s)` : String(count);
    badge.classList.toggle('has-warnings', warnings.length > 0);
    const button = document.getElementById('open-marks');
    button.title = `Marcas del compás ${measure?.label || 'sin seleccionar'}: repeticiones, casillas, Segno, Coda y Fine`;
    button.setAttribute('aria-label', `Marcas del compás ${measure?.label || 'sin seleccionar'}`);
  }
  sync(store.state);
  store.subscribe((state, scope) => { if (!['zoom', 'status'].includes(scope)) sync(state); });
}
