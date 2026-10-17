import { h } from '../render/dom.js';
import { FAMILIES } from '../model/families.js';
import { formatFrets, parseFrets } from '../model/frets.js';
import { addEvent, addVoicing, duplicateVoicing, removeEvent, removeVoicing, effectiveText, setCardText } from '../model/song.js';
import { selectedEvent, selectedMeasure, selectedVoicing } from '../store.js';
import { confirmDialog } from './dialog.js';
import { focusSoon } from './notify.js';
import { fretRange, spanMessage } from '../geometry/fretboard.js';
import { applyDegrees, degreesToInputs } from '../model/degrees.js';
import { actionButton, iconButton } from './icons.js';

const STRINGS = ['6ª', '5ª', '4ª', '3ª', '2ª', '1ª'];
function field(id, label, value, update) {
  return h('div', { class: 'field' }, h('label', { for: id }, label),
    h('input', { id, type: 'text', value, autocomplete: 'off', oninput: e => update(e.target.value) }));
}

export function mountChordPanel(root, store) {
  let currentTab = 'notes';
  let textTarget = 'position';
  const body = h('div', { class: 'chord-body' });
  root.append(h('div', { class: 'editor-heading' }, h('h2', { id: 't-acorde' }, 'Acordes y posiciones'),
    h('span', { class: 'live-badge' }, h('span', { 'aria-hidden': 'true' }), 'En directo')), body);

  function render(state) {
    const { song } = state;
    const measure = selectedMeasure(state);
    if (!measure) { body.replaceChildren(h('p', { class: 'hint empty-editor' }, 'Añade un compás para empezar.')); return; }
    const event = selectedEvent(state);
    const voicing = selectedVoicing(state);
    const commit = selection => store.commit('structure', { measureId: measure.id, ...selection });
    const chordSelect = h('select', { id: 'chord-select', 'aria-label': 'Seleccionar acorde del compás',
      onchange: e => store.selectEvent(e.target.value) },
      measure.chordEvents.map((e, i) => h('option', { value: e.id, selected: e.id === event?.id }, `${i + 1}. ${e.chordName || 'Sin nombre'}`)));
    chordSelect.disabled = !event;
    if (!event) chordSelect.append(h('option', { value: '' }, 'Compás vacío'));
    const addChord = actionButton('plus', 'Acorde', () => {
      const created = addEvent(song, measure.id);
      commit({ eventId: created.id });
      focusSoon('f-acorde', { select: true });
    }, { title: 'Añadir otro acorde', 'aria-label': 'Añadir otro acorde', class: 'btn btn-soft' });
    const removeChord = iconButton('trash', 'Quitar acorde', async () => {
      const choice = await confirmDialog({ title: `¿Quitar el acorde «${event.chordName || 'sin nombre'}»?`,
        intro: `Se eliminarán también sus ${event.voicings.length} posición(es).`,
        actions: [{ label: 'Cancelar', value: 'cancel' }, { label: 'Quitar acorde', value: 'remove', kind: 'danger' }] });
      if (choice === 'remove') { removeEvent(song, measure.id, event.id); commit({}); }
    });
    removeChord.disabled = !event;
    const nodes = [h('div', { class: 'section-label' }, 'Acordes del compás', h('span', null, String(measure.chordEvents.length))),
      h('div', { class: 'selector-row' }, chordSelect, addChord, removeChord)];
    if (!event) {
      nodes.push(h('p', { class: 'hint empty-editor' }, 'Este compás está vacío. Añade un acorde y después sus posiciones.'));
      body.replaceChildren(...nodes); return;
    }
    const name = field('f-acorde', 'Nombre del acorde', event.chordName || '', value => {
      event.chordName = value;
      chordSelect.selectedOptions[0].textContent = `${measure.chordEvents.indexOf(event) + 1}. ${value || 'Sin nombre'}`;
      store.emit('text');
    });
    const family = h('div', { class: 'field' }, h('label', { for: 'f-familia' }, 'Familia · color'),
      h('select', { id: 'f-familia', onchange: e => { event.family = e.target.value; store.emit('text'); } },
        Object.entries(FAMILIES).map(([key, family]) => h('option', { value: key, selected: (event.family || 'other') === key }, family.label))));
    nodes.push(h('div', { class: 'field-row chord-name-row' }, name, family));
    const positionSelect = h('select', { id: 'position-select', 'aria-label': 'Seleccionar posición',
      onchange: e => store.selectVoicing(e.target.value) }, event.voicings.map((v, i) =>
      h('option', { value: v.id, selected: v.id === voicing?.id }, `Posición ${i + 1}`)));
    positionSelect.disabled = !voicing;
    if (!voicing) positionSelect.append(h('option', { value: '' }, 'Sin posiciones'));
    const addPosition = actionButton('plus', 'Posición', () => {
      const created = addVoicing(song, event);
      currentTab = 'notes';
      commit({ eventId: event.id, voicingId: created.id });
      focusSoon('f-frets', { select: true });
    }, { title: 'Añadir otra posición del mismo acorde', 'aria-label': 'Añadir otra posición', class: 'btn btn-soft' });
    const duplicate = iconButton('copy', 'Duplicar posición', () => {
      const copy = duplicateVoicing(song, event, voicing.id);
      commit({ eventId: event.id, voicingId: copy.id });
    });
    const remove = iconButton('trash', 'Quitar posición', async () => {
      const choice = await confirmDialog({ title: '¿Quitar esta posición?', intro: 'Se elimina solo esta tarjeta.',
        actions: [{ label: 'Cancelar', value: 'cancel' }, { label: 'Quitar posición', value: 'remove', kind: 'danger' }] });
      if (choice === 'remove') { removeVoicing(event, voicing.id); commit({ eventId: event.id }); }
    });
    duplicate.disabled = remove.disabled = !voicing;
    nodes.push(h('div', { class: 'position-section' },
      h('div', { class: 'section-label' }, 'Posiciones del acorde', h('span', null, String(event.voicings.length))),
      h('div', { class: 'selector-row' }, positionSelect, addPosition, duplicate, remove)));
    if (!voicing) {
      nodes.push(h('div', { class: 'empty-editor' }, h('p', null, 'El acorde está creado.'),
        h('p', { class: 'hint' }, 'Añade una posición para escribir sus trastes.')));
      body.replaceChildren(...nodes); return;
    }
    const error = h('span', { class: 'error', id: 'f-frets-error', role: 'alert' });
    const span = h('span', { class: 'error', id: 'f-frets-span' });
    const note = h('span', { class: 'sr-only', id: 'f-frets-note' });
    const rangeBadge = h('span', { class: 'range-badge' });
    function refreshRange() {
      const range = fretRange(voicing.frets);
      const message = spanMessage(range);
      span.textContent = message ? `Esta digitación ${message}` : '';
      note.textContent = voicing.frets.every(f => f === null) ? 'Posición vacía: escribe sus trastes.' : '';
      rangeBadge.textContent = `Trastes ${range.start}–${range.end}`;
    }
    refreshRange();
    const frets = h('input', { id: 'f-frets', type: 'text', class: 'mono', value: formatFrets(voicing.frets),
      autocomplete: 'off', spellcheck: 'false', 'aria-describedby': 'f-frets-hint f-frets-error f-frets-note f-frets-span',
      oninput: e => {
        const parsed = parseFrets(e.target.value);
        if (parsed.error) { e.target.setAttribute('aria-invalid', 'true'); error.textContent = parsed.error; return; }
        e.target.removeAttribute('aria-invalid'); error.textContent = '';
        voicing.frets = parsed.frets; refreshRange(); store.emit('text');
      } });
    const degrees = degreesToInputs(voicing.degrees).map((value, i) => h('input', {
      id: `f-grado-${i}`, type: 'text', value, autocomplete: 'off', spellcheck: 'false',
      'aria-label': `Grado de la cuerda ${STRINGS[i]}`, oninput: () => {
        applyDegrees(voicing, degrees.map(input => input.value)); store.emit('text');
      } }));
    const notesPanel = h('div', { id: 'editor-notes', role: 'tabpanel', 'aria-labelledby': 'tab-notes' },
      h('div', { class: 'field fret-field' },
        h('div', { class: 'field-heading' }, h('label', { for: 'f-frets' }, 'Digitación · 6ª a 1ª'), rangeBadge), frets,
        h('span', { class: 'hint', id: 'f-frets-hint' }, 'x muda · 0 al aire · dos cifras: separa con espacios'), note, error, span),
      h('fieldset', { class: 'degrees' }, h('legend', null, 'Grados manuales', h('span', { class: 'optional' }, 'Opcional')),
        h('div', { class: 'degree-grid' }, degrees.map((input, i) => h('div', { class: 'degree-cell' },
          h('label', { for: input.id }, STRINGS[i]), input)))),
      h('p', { class: 'editing-tip' }, 'Otra posición = otra digitación del mismo acorde.'));
    const targetHelp = h('p', { id: 'text-target-help', class: 'text-help' });
    const syncTargetHelp = () => { targetHelp.textContent = textTarget === 'all'
      ? 'Cada campo que cambies se actualizará en todas las posiciones de este acorde, incluidas las que tenían un texto propio.'
      : 'Ves y editas el texto que aparece en esta posición. Deja un campo vacío para quitarlo de esta tarjeta.'; };
    syncTargetHelp();
    const target = h('div', { class: 'field', hidden: event.voicings.length < 2 },
      h('label', { for: 'text-target' }, 'Aplicar los cambios a'),
      h('select', { id: 'text-target', 'aria-describedby': 'text-target-help', onchange: e => {
        textTarget = e.target.value; store.endEdit(); syncTargetHelp();
      } }, h('option', { value: 'position', selected: textTarget === 'position' }, 'Solo esta posición'),
      h('option', { value: 'all', selected: textTarget === 'all' }, 'Todas las posiciones del acorde')));
    const textField = (id, label, key, help) => h('div', { class: 'card-text-field' },
      field(id, label, effectiveText(event, voicing, key), value => {
        setCardText(event, voicing, key, value, textTarget === 'all'); store.emit('text');
      }), h('p', { class: 'hint' }, help));
    const textsPanel = h('div', { id: 'editor-texts', role: 'tabpanel', 'aria-labelledby': 'tab-texts' },
      target, targetHelp,
      textField('f-encima', 'Título sobre la tarjeta', 'aboveText', 'Fuera del recuadro. Por ejemplo: Introducción.'),
      textField('f-dentro', 'Anotación dentro de la tarjeta', 'insideText', 'Bajo el nombre del acorde. Por ejemplo: Drop 2 · 1ª inversión.'));
    const tabs = ['notes', 'texts'].map((id, i) => h('button', { id: `tab-${id}`, role: 'tab', type: 'button',
      'aria-controls': `editor-${id}`, onclick: () => switchTab(id), onkeydown: e => {
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
          e.preventDefault(); switchTab(e.key === 'Home' ? 'notes' : e.key === 'End' ? 'texts' : id === 'notes' ? 'texts' : 'notes');
          tabs[currentTab === 'notes' ? 0 : 1].focus();
        }
      } }, i === 0 ? 'Digitación y grados' : 'Textos de la tarjeta'));
    function switchTab(id) {
      currentTab = id;
      tabs.forEach((tab, i) => { const active = (i === 0 ? 'notes' : 'texts') === id;
        tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; });
      notesPanel.hidden = id !== 'notes'; textsPanel.hidden = id !== 'texts';
    }
    nodes.push(h('div', { class: 'editor-tabs', role: 'tablist', 'aria-label': 'Contenido de la posición' }, tabs), notesPanel, textsPanel);
    switchTab(currentTab);
    body.replaceChildren(...nodes);
  }
  render(store.state);
  store.subscribe((state, scope) => {
    if (['selection', 'structure', 'document', 'history'].includes(scope)) { textTarget = 'position'; render(state); }
  });
}
