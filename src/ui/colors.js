import { h } from '../render/dom.js';
import { FAMILIES } from '../model/families.js';
import { familyBackground, foreground, isColor, isPaletteLabel, neutralNote, normalizeDegree,
  paletteDegreeColor, setPaletteColor, resetPaletteColor } from '../model/palette.js';
import { confirmDialog } from './dialog.js';

export function mountColorsPanel(root, store) {
  let tab = 'families';
  let accidental = '';
  let bindings = [];
  let chips = [];
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
    h('p', { class: 'palette-intro' }, 'Se aplican a todos los compases de esta canción y se guardan en su JSON, HTML e impresión. En las tarjetas, el texto se ajusta al fondo. En los grados, fondo y texto se eligen por separado: el texto es blanco por defecto y no cambia solo.'),
    h('div', { class: 'editor-tabs', role: 'tablist', 'aria-label': 'Colores por acorde o grado' }, tabs), error, content);

  function colorValue(group, key) {
    const palette = store.state.song.palette;
    if (group === 'families') return familyBackground(key, palette);
    if (group === 'note') return neutralNote(palette).bg;
    if (group === 'noteText') return neutralNote(palette).fg;
    const color = paletteDegreeColor(key, palette);
    if (group === 'degreeText') return color?.fg || neutralNote(palette).fg;
    return color?.bg || neutralNote(palette).bg;
  }
  const isCustom = (group, key) => {
    const palette = store.state.song.palette;
    return group === 'note' || group === 'noteText' ? Boolean(palette?.[group]) : Object.prototype.hasOwnProperty.call(palette?.[group] || {}, key);
  };

  /** Selector, hexadecimal y restauración de un color. `caption` distingue Fondo de Texto en los grados. */
  function colorRow(group, key, label, caption = null) {
    const name = caption ? `${caption} ${label}` : label;
    const id = `color-${group}-${key}`;
    const color = h('input', { type: 'color', id, value: colorValue(group, key), 'aria-label': `Color ${name}`,
      oninput: event => {
        setPaletteColor(store.state.song, group, key, event.target.value); error.textContent = ''; store.emit('text');
      } });
    const hex = h('input', { type: 'text', class: 'color-hex', value: colorValue(group, key), maxlength: 7,
      'aria-label': `Hexadecimal ${name}`, spellcheck: 'false', autocomplete: 'off', oninput: event => {
        if (!isColor(event.target.value)) { event.target.setAttribute('aria-invalid', 'true'); error.textContent = 'Escribe un color con formato #RRGGBB.'; return; }
        event.target.removeAttribute('aria-invalid'); error.textContent = '';
        setPaletteColor(store.state.song, group, key, event.target.value); store.emit('text');
      } });
    const reset = h('button', { class: 'palette-reset', type: 'button', title: `Restaurar ${name}`, 'aria-label': `Restaurar ${name}`, onclick: () => {
      resetPaletteColor(store.state.song, group, key); error.textContent = ''; store.emit('text');
      hex.removeAttribute('aria-invalid'); hex.value = colorValue(group, key);
    } }, '↺');
    bindings.push({ group, key, color, hex, reset });
    return { id, reset, inputs: h('div', { class: 'palette-inputs' }, color, hex) };
  }

  /** Grado o fondo neutro: Fondo y Texto independientes, con una muestra que combina los dos valores reales. */
  function pairEntry(bgGroup, textGroup, key, label, chipClass) {
    const chip = h('span', { class: chipClass, 'aria-hidden': 'true' }, label);
    chips.push({ chip, bgGroup, textGroup, key });
    const bg = colorRow(bgGroup, key, label, 'Fondo');
    const fg = colorRow(textGroup, key, label, 'Texto');
    return h('div', { class: 'palette-entry palette-pair' }, h('div', { class: 'palette-entry-head' }, h('span', { class: 'palette-name' }, label), chip),
      h('div', { class: 'palette-line' }, h('label', { for: bg.id }, 'Fondo'), bg.inputs, bg.reset),
      h('div', { class: 'palette-line' }, h('label', { for: fg.id }, 'Texto'), fg.inputs, fg.reset));
  }

  function entry(group, key, label) {
    const chip = h('span', { class: 'palette-chip', 'aria-hidden': 'true' }, label);
    const row = colorRow(group, key, label);
    chips.push({ chip, bgGroup: group, key });
    return h('div', { class: 'palette-entry' }, h('div', { class: 'palette-entry-head' }, h('label', { for: row.id }, label), row.reset), row.inputs, chip);
  }

  function sync() {
    for (const { group, key, color, hex, reset } of bindings) {
      const value = colorValue(group, key);
      color.value = value;
      if (document.activeElement !== hex) { hex.value = value; hex.removeAttribute('aria-invalid'); }
      reset.disabled = !isCustom(group, key);
    }
    for (const { chip, bgGroup, textGroup, key } of chips) {
      const value = colorValue(bgGroup, key);
      chip.style.backgroundColor = value;
      chip.style.color = textGroup ? colorValue(textGroup, key) : foreground(value);
    }
  }

  function render() {
    bindings = []; chips = []; error.textContent = '';
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
        ? [...new Set([...Object.keys(store.state.song.palette?.degrees || {}), ...Object.keys(store.state.song.palette?.degreeText || {})])]
          .filter(key => !/^[b#]?([1-9]|1[0-3])$/.test(key))
        : Array.from({ length: 13 }, (_, i) => accidental + (i + 1));
      panel.append(h('div', { class: 'palette-grid degree-palette' }, keys.map(key => pairEntry('degrees', 'degreeText', key, key, 'palette-chip degree-chip'))));
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
        h('div', { class: 'palette-neutral' }, pairEntry('note', 'noteText', '', 'Sin grado o sin color propio', 'palette-chip degree-chip')));
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
  store.subscribe((state, scope) => {
    if (scope === 'document' || scope === 'history') { if (scope === 'document') accidental = ''; render(); }
    else if (!['selection', 'zoom', 'status'].includes(scope)) sync();
  });
}
