import { h } from '../render/dom.js';
import { FAMILIES } from '../model/families.js';
import { DEFAULT_NOTE_COLOR, familyBackground, foreground, isColor,
  isPaletteLabel, normalizeDegree, paletteDegreeColor, setPaletteColor, resetPaletteColor } from '../model/palette.js';
import { confirmDialog } from './dialog.js';

export function mountColorsPanel(root, store) {
  let tab = 'families';
  let accidental = '';
  let bindings = [];
  const error = h('p', { class: 'error palette-error', role: 'alert' });
  const content = h('div');
  const tabs = ['families', 'degrees'].map((key, i) => h('button', {
    id: `colors-tab-${key}`, type: 'button', role: 'tab', 'aria-controls': `colors-${key}`,
    onclick: () => { tab = key; render(); }, onkeydown: event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      tab = event.key === 'Home' ? 'families' : event.key === 'End' ? 'degrees' : tab === 'families' ? 'degrees' : 'families';
      render(); tabs[tab === 'families' ? 0 : 1].focus();
    },
  }, i === 0 ? 'Calidad del acorde' : 'Notas y grados'));
  root.append(h('h2', { id: 't-colors' }, 'Colores de la canción'),
    h('p', { class: 'palette-intro' }, 'Se aplican a todos los compases de esta canción y se guardan en su JSON, HTML e impresión. El texto se ajusta al fondo para mantener la lectura.'),
    h('div', { class: 'editor-tabs', role: 'tablist', 'aria-label': 'Colores por acorde o grado' }, tabs), error, content);

  function colorValue(group, key) {
    const palette = store.state.song.palette;
    if (group === 'families') return familyBackground(key, palette);
    if (group === 'note') return palette?.note || DEFAULT_NOTE_COLOR;
    return paletteDegreeColor(key, palette)?.bg || palette?.note || DEFAULT_NOTE_COLOR;
  }

  function entry(group, key, label) {
    const id = `color-${group}-${key}`;
    const chip = h('span', { class: group === 'degrees' ? 'palette-chip degree-chip' : 'palette-chip', 'aria-hidden': 'true' }, label);
    const color = h('input', { type: 'color', id, value: colorValue(group, key), 'aria-label': `Color ${label}`,
      oninput: event => {
        setPaletteColor(store.state.song, group, key, event.target.value); error.textContent = ''; store.emit('text');
      } });
    const hex = h('input', { type: 'text', class: 'color-hex', value: colorValue(group, key), maxlength: 7,
      'aria-label': `Hexadecimal ${label}`, spellcheck: 'false', autocomplete: 'off', oninput: event => {
        if (!isColor(event.target.value)) { event.target.setAttribute('aria-invalid', 'true'); error.textContent = 'Escribe un color con formato #RRGGBB.'; return; }
        event.target.removeAttribute('aria-invalid'); error.textContent = '';
        setPaletteColor(store.state.song, group, key, event.target.value); store.emit('text');
      } });
    const reset = h('button', { class: 'palette-reset', type: 'button', title: `Restaurar ${label}`, 'aria-label': `Restaurar ${label}`, onclick: () => {
      resetPaletteColor(store.state.song, group, key); error.textContent = ''; store.emit('text');
      hex.removeAttribute('aria-invalid'); hex.value = colorValue(group, key);
    } }, '↺');
    bindings.push({ group, key, chip, color, hex, reset });
    return h('div', { class: 'palette-entry' }, h('div', { class: 'palette-entry-head' }, h('label', { for: id }, label), reset),
      h('div', { class: 'palette-inputs' }, color, hex), chip);
  }

  function sync() {
    for (const { group, key, chip, color, hex, reset } of bindings) {
      const value = colorValue(group, key);
      color.value = value;
      if (document.activeElement !== hex) { hex.value = value; hex.removeAttribute('aria-invalid'); }
      chip.style.backgroundColor = value;
      chip.style.color = group === 'degrees' ? paletteDegreeColor(key, store.state.song.palette)?.fg || foreground(value) : foreground(value);
      const palette = store.state.song.palette;
      reset.disabled = group === 'note' ? !palette?.note : !Object.prototype.hasOwnProperty.call(palette?.[group] || {}, key);
    }
  }

  function render() {
    bindings = []; error.textContent = '';
    tabs.forEach((button, i) => { const active = (i === 0 ? 'families' : 'degrees') === tab;
      button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; });
    const panel = h('div', { id: `colors-${tab}`, role: 'tabpanel', 'aria-labelledby': `colors-tab-${tab}` });
    if (tab === 'families') {
      panel.append(h('p', { class: 'text-help' }, 'Fondo de las tarjetas según la familia elegida en el acorde.'),
        h('div', { class: 'palette-grid' }, Object.entries(FAMILIES).map(([key, family]) => entry('families', key, family.label))));
    } else {
      const filter = h('select', { id: 'colors-accidental', 'aria-label': 'Alteración de los grados', onchange: event => { accidental = event.target.value; render(); } },
        [['', 'Naturales · 1 a 13'], ['b', 'Bemoles · b1 a b13'], ['#', 'Sostenidos · #1 a #13'], ['custom', 'Otros grados y etiquetas']]
          .map(([value, label]) => h('option', { value, selected: value === accidental }, label)));
      panel.append(h('div', { class: 'field' }, h('label', { for: 'colors-accidental' }, 'Grados'), filter));
      const keys = accidental === 'custom'
        ? Object.keys(store.state.song.palette?.degrees || {}).filter(key => !/^[b#]?([1-9]|1[0-3])$/.test(key))
        : Array.from({ length: 13 }, (_, i) => accidental + (i + 1));
      panel.append(h('div', { class: 'palette-grid degree-palette' }, keys.map(key => entry('degrees', key, key))));
      const label = h('input', { type: 'text', id: 'custom-degree-label', maxlength: 64, placeholder: 'Por ejemplo: bb7, #5 o R', 'aria-label': 'Grado o etiqueta personalizada' });
      const add = () => {
        const key = normalizeDegree(label.value);
        if (!isPaletteLabel(key)) { error.textContent = 'Escribe una etiqueta de 1 a 32 caracteres.'; label.focus(); return; }
        setPaletteColor(store.state.song, 'degrees', key, colorValue('degrees', key));
        store.emit('text');
        accidental = /^([b#]?)([1-9]|1[0-3])$/.exec(key)?.[1] ?? 'custom';
        render();
      };
      panel.append(h('div', { class: 'palette-custom' }, h('label', { for: 'custom-degree-label' }, 'Otro grado o etiqueta'),
        h('div', { class: 'palette-custom-row' }, label, h('button', { type: 'button', class: 'btn', onclick: add }, 'Añadir'))),
        h('div', { class: 'palette-neutral' }, entry('note', '', 'Sin grado o sin color propio')));
    }
    content.replaceChildren(panel); sync();
  }

  document.getElementById('reset-colors').addEventListener('click', async () => {
    const choice = await confirmDialog({ title: '¿Restaurar la paleta original?',
      intro: 'Se quitan los colores personalizados de esta canción. Las notas y los textos se conservan.',
      actions: [{ label: 'Cancelar', value: 'cancel' }, { label: 'Restaurar colores', value: 'reset', kind: 'primary' }] });
    if (choice === 'reset') { delete store.state.song.palette; accidental = ''; store.emit('text'); render(); }
  });
  render();
  store.subscribe((state, scope) => { if (scope === 'document') { accidental = ''; render(); } else if (!['selection', 'zoom', 'status'].includes(scope)) sync(); });
}
