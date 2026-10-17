import { icon } from './icons.js';
import { checkStructure } from '../model/structure.js';

export function mountWorkspace(store) {
  document.querySelectorAll('[data-icon]').forEach(el => el.prepend(icon(el.dataset.icon)));
  const open = id => {
    document.querySelectorAll('.action-menu[open]').forEach(menu => menu.open = false);
    const dialog = document.getElementById(id);
    if (!dialog.open) dialog.showModal();
  };
  document.getElementById('open-song').addEventListener('click', () => open('song-dialog'));
  document.getElementById('open-song-menu').addEventListener('click', () => open('song-dialog'));
  document.getElementById('open-marks').addEventListener('click', () => open('marks-dialog'));
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
    const count = Object.values(state.song.structure).reduce((n, list) => n + list.length, 0);
    const warnings = checkStructure(state.song);
    const badge = document.getElementById('marks-count');
    badge.textContent = warnings.length ? `${warnings.length} aviso(s)` : String(count);
    badge.classList.toggle('has-warnings', warnings.length > 0);
    document.getElementById('open-marks').title = warnings.length ? 'Revisar referencias musicales pendientes' : 'Repeticiones, casillas, Segno, Coda y Fine';
  }
  sync(store.state);
  store.subscribe((state, scope) => { if (!['selection', 'zoom', 'status'].includes(scope)) sync(state); });
}
