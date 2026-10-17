import { s, h } from '../render/dom.js';
const PATHS = {
  undo: ['M9 4L4 9l5 5', 'M4 9h9a7 7 0 0 1 7 7v4'],
  redo: ['M15 4l5 5-5 5', 'M20 9h-9a7 7 0 0 0-7 7v4'],
  palette: ['M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 0-4h-1a1.5 1.5 0 0 1 0-3h4a5 5 0 0 0 5-5c0-3.3-4-6-9-6z', 'M7 8h.01M11 6h.01M16 7h.01M6 12h.01'],
  plus: ['M12 5v14M5 12h14'], copy: ['M9 9h11v11H9z', 'M15 5V3H3v12h2'],
  trash: ['M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7'],
  left: ['M15 5l-7 7 7 7'], right: ['M9 5l7 7-7 7'],
  more: ['M5 12h.01M12 12h.01M19 12h.01'], close: ['M6 6l12 12M6 18L18 6'],
  save: ['M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2z', 'M7 3v6h10V3M7 21v-8h10v8'],
  folder: ['M3 7V5h6l2 2h10v13H3z', 'M3 11h18'],
  export: ['M12 15V3M7 8l5-5 5 5M5 14v7h14v-7'],
  repeat: ['M3 8l3-3h13v5M21 16l-3 3H5v-5M3 8V3M21 16v5'],
};
export function icon(name) {
  return s('svg', { class: 'ui-icon', viewBox: '0 0 24 24', width: 18, height: 18,
    fill: 'none', stroke: 'currentColor', 'stroke-width': 1.7, 'stroke-linecap': 'round',
    'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false' },
  (PATHS[name] || PATHS.more).map(d => s('path', { d })));
}
export function iconButton(name, label, onclick, extra = {}) {
  return h('button', { type: 'button', class: 'btn tool-icon', title: label, 'aria-label': label, onclick, ...extra }, icon(name));
}
export function actionButton(name, label, onclick, extra = {}) {
  return h('button', { type: 'button', class: 'btn', onclick, ...extra }, icon(name), label);
}
