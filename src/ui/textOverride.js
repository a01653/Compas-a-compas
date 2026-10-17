import { h } from '../render/dom.js';
import { describeTextMode, setTextMode, textState } from '../model/song.js';
import { focusSoon } from './notify.js';

// «Personalizar» con texto vacío guarda cadena vacía (= ocultar); esto recuerda que el usuario eligió personalizar.
const customIntent = new Set();

const MODES = [
  ['inherit', 'Heredar del acorde'],
  ['custom', 'Personalizar en esta tarjeta'],
  ['hidden', 'Ocultar en esta tarjeta'],
];

/**
 * Campo de texto de una tarjeta (encima o dentro) con su origen visible:
 * hereda el valor del acorde, lo sustituye (override) o lo oculta (cadena vacía).
 * Solo modifica el voicing seleccionado.
 */
export function overrideField({ id, label, event, voicing, key, store, compact = false }) {
  const intentKey = `${voicing.id}:${key}`;
  const state = textState(event, voicing, key);
  const mode = state.mode === 'hidden' && customIntent.has(intentKey) ? 'custom' : state.mode;
  const descId = `${id}-desc`;

  const select = h('select', {
    id: `${id}-modo`,
    'aria-describedby': descId,
    onchange: (e) => {
      const next = e.target.value;
      if (next === 'custom') customIntent.add(intentKey);
      else customIntent.delete(intentKey);
      setTextMode(event, voicing, key, next);
      store.emit('structure');
      if (next === 'custom') focusSoon(id);
    },
  }, MODES.map(([value, text]) => h('option', { value, selected: value === mode }, compact ? text.split(' ')[0] : text)));

  let detail;
  if (mode === 'custom') {
    detail = h('input', {
      id, type: 'text', value: voicing[key] || '', autocomplete: 'off', 'aria-describedby': descId,
      oninput: (e) => { voicing[key] = e.target.value; store.emit('text'); },
    });
  } else {
    detail = null;
  }

  return h('div', { class: 'field' },
    h('label', { for: `${id}-modo` }, label),
    select,
    detail,
    h('span', { class: 'hint', id: descId, 'data-compact': compact ? 'true' : null,
      title: describeTextMode(mode, state.inherited) }, compact ? compactHelp(mode) : describeTextMode(mode, state.inherited)));
}

function compactHelp(mode) {
  return mode === 'inherit' ? 'Usa el texto común.' : mode === 'hidden' ? 'No aparece en esta posición.' : 'Solo cambia esta posición.';
}

/**
 * Tras editar el valor por defecto del acorde, refresca la ayuda de herencia de la tarjeta.
 * Solo cambia el texto de la ayuda: ningún input se reconstruye, así que no se pierde foco ni cursor.
 */
export function refreshTextHelp(id, event, voicing, key) {
  const el = document.getElementById(`${id}-desc`);
  if (!el || !voicing) return;
  const state = textState(event, voicing, key);
  const mode = state.mode === 'hidden' && customIntent.has(`${voicing.id}:${key}`) ? 'custom' : state.mode;
  el.title = describeTextMode(mode, state.inherited);
  el.textContent = el.dataset.compact ? compactHelp(mode) : describeTextMode(mode, state.inherited);
}
