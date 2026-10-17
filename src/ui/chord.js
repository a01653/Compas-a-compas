import { h } from '../render/dom.js';
import { FAMILIES } from '../model/families.js';
import { formatFrets, parseFrets } from '../model/frets.js';
import { addVoicing, effectiveText } from '../model/song.js';
import { addCard, cardKey, duplicateCard, findCard, flatCards, isolateCard, removeCard, selectionOf, setCardTextValue } from '../model/cards.js';
import { selectedEvent, selectedMeasure, selectedVoicing } from '../store.js';
import { confirmDialog } from './dialog.js';
import { focusSoon } from './notify.js';
import { fretRange, spanMessage } from '../geometry/fretboard.js';
import { applyDegrees, degreesToInputs } from '../model/degrees.js';
import { actionButton, iconButton } from './icons.js';
import { paletteFamilyStyle } from '../model/palette.js';
import { DEFAULT_TONALITY_FAMILY, deriveTonalityContext, describeTonality, setTonality, setTonalityFamily, setVoicingDegree } from '../model/tonality.js';

const STRINGS = ['6ª', '5ª', '4ª', '3ª', '2ª', '1ª'];
const NO_FRETS = [null, null, null, null, null, null];
function field(id, label, value, update, extra = {}) {
  return h('div', { class: 'field' }, h('label', { for: id }, label),
    h('input', { id, type: 'text', value, autocomplete: 'off', oninput: e => update(e.target.value), ...extra }));
}

export function mountChordPanel(root, store) {
  let refreshContext = null;
  const body = h('div', { class: 'chord-body' });
  root.append(h('div', { class: 'editor-heading' }, h('h2', { id: 't-acorde' }, 'Tarjetas'),
    h('span', { class: 'live-badge' }, h('span', { 'aria-hidden': 'true' }), 'En directo')), body);

  function render(state) {
    const { song } = state;
    refreshContext = null;
    const measure = selectedMeasure(state);
    if (!measure) { body.replaceChildren(h('p', { class: 'hint empty-editor' }, 'Añade un compás para empezar.')); return; }
    // `event` y `voicing` se actualizan sin reconstruir el formulario cuando una edición separa la tarjeta o completa una pendiente.
    let event = selectedEvent(state);
    let voicing = selectedVoicing(state);
    const commit = selection => store.commit('structure', { measureId: measure.id, ...selection });
    const voicingControls = []; // Campos que solo existen cuando la tarjeta ya tiene digitación.

    const cardSelect = h('select', { id: 'card-select', 'aria-label': 'Seleccionar tarjeta del compás',
      onchange: e => {
        const card = findCard(measure, e.target.value);
        if (card) store.select({ measureId: measure.id, ...selectionOf(card) });
      } });
    function fillSelector() {
      const cards = flatCards(measure);
      cardSelect.replaceChildren(...cards.map((card, i) =>
        h('option', { value: card.key }, `${i + 1}. ${card.event.chordName || 'Sin nombre'}${card.voicing ? '' : ' · sin digitación'}`)));
      if (!cards.length) cardSelect.append(h('option', { value: '' }, 'Compás vacío'));
      else cardSelect.value = cardKey(event, voicing);
    }
    fillSelector();
    cardSelect.disabled = !event;
    const addButton = actionButton('plus', 'Tarjeta', () => {
      const created = addCard(song, measure.id, event ? { eventId: event.id, voicingId: voicing ? voicing.id : null } : null);
      commit({ eventId: created.event.id, voicingId: created.voicing.id });
      focusSoon('f-acorde', { select: true });
    }, { title: 'Añadir una tarjeta nueva después de esta', 'aria-label': 'Añadir tarjeta', class: 'btn btn-soft' });
    const duplicate = iconButton('copy', 'Duplicar tarjeta', () => {
      const copy = duplicateCard(song, measure.id, event.id, voicing ? voicing.id : null);
      commit({ eventId: copy.event.id, voicingId: copy.voicing ? copy.voicing.id : null });
    });
    const remove = iconButton('trash', 'Quitar tarjeta', async () => {
      const choice = await confirmDialog({ title: `¿Quitar la tarjeta «${event.chordName || 'sin nombre'}»?`, intro: 'Se elimina solo esta tarjeta.',
        actions: [{ label: 'Cancelar', value: 'cancel' }, { label: 'Quitar tarjeta', value: 'remove', kind: 'danger' }] });
      if (choice !== 'remove') return;
      const { next } = removeCard(song, measure.id, event.id, voicing ? voicing.id : null);
      commit(next || {});
    });
    duplicate.disabled = remove.disabled = !event;
    const nodes = [h('div', { class: 'section-label' }, 'Tarjetas del compás', h('span', null, String(flatCards(measure).length))),
      h('div', { class: 'selector-row' }, cardSelect, addButton, duplicate, remove)];
    if (!event) {
      nodes.push(h('p', { class: 'hint empty-editor' }, 'Este compás está vacío. Añade una tarjeta para escribir su digitación.'));
      body.replaceChildren(...nodes); return;
    }

    /** Un archivo antiguo puede agrupar varias tarjetas bajo un acorde: al cambiar nombre o calidad se separa solo esta. */
    function ownEvent() {
      const solo = isolateCard(song, measure, event, voicing);
      if (solo !== event) {
        event = solo;
        store.state.selection = { ...store.state.selection, eventId: event.id };
      }
      return event;
    }
    function ensureVoicing() {
      if (voicing) return voicing;
      voicing = addVoicing(song, event);
      store.state.selection = { ...store.state.selection, voicingId: voicing.id };
      for (const control of voicingControls) control.disabled = false;
      fillSelector();
      refreshTonality();
      return voicing;
    }

    const name = field('f-acorde', 'Nombre del acorde', event.chordName || '', value => {
      ownEvent().chordName = value;
      fillSelector();
      store.emit('text');
    });
    const family = h('div', { class: 'field' }, h('label', { for: 'f-familia' }, 'Familia · color'),
      h('select', { id: 'f-familia', onchange: e => { store.endEdit(); ownEvent().family = e.target.value; store.emit('text'); } },
        Object.entries(FAMILIES).map(([key, family]) => h('option', { value: key, selected: (event.family || 'other') === key }, family.label))));
    nodes.push(h('div', { class: 'field-row chord-name-row' }, name, family));

    const error = h('span', { class: 'error', id: 'f-frets-error', role: 'alert' });
    const span = h('span', { class: 'error', id: 'f-frets-span' });
    const note = h('span', { class: 'sr-only', id: 'f-frets-note' });
    const rangeBadge = h('span', { class: 'range-badge' });
    function refreshRange() {
      const current = voicing ? voicing.frets : NO_FRETS;
      const range = fretRange(current);
      const message = spanMessage(range);
      span.textContent = message ? `Esta digitación ${message}` : '';
      note.textContent = current.every(f => f === null) ? 'Tarjeta sin digitación: escribe sus trastes.' : '';
      rangeBadge.textContent = `Trastes ${range.start}–${range.end}`;
    }
    refreshRange();
    // En una tarjeta pendiente la primera digitación válida la completa; solo mirar no cambia nada.
    const frets = h('input', { id: 'f-frets', type: 'text', class: 'mono', value: voicing ? formatFrets(voicing.frets) : '',
      autocomplete: 'off', spellcheck: 'false', 'aria-describedby': 'f-frets-hint f-frets-error f-frets-note f-frets-span',
      oninput: e => {
        const parsed = parseFrets(e.target.value);
        if (parsed.error) { e.target.setAttribute('aria-invalid', 'true'); error.textContent = parsed.error; return; }
        e.target.removeAttribute('aria-invalid'); error.textContent = '';
        ensureVoicing().frets = parsed.frets; refreshRange(); store.emit('text');
      } });
    const degrees = degreesToInputs(voicing ? voicing.degrees : undefined).map((value, i) => h('input', {
      id: `f-grado-${i}`, type: 'text', value, autocomplete: 'off', spellcheck: 'false', disabled: !voicing,
      'aria-label': `Grado de la cuerda ${STRINGS[i]}`, oninput: () => {
        applyDegrees(voicing, degrees.map(input => input.value)); store.emit('text');
      } }));
    voicingControls.push(...degrees);
    const notesPanel = h('section', { id: 'editor-notes', class: 'editor-section', 'aria-labelledby': 'editor-notes-title' },
      h('h3', { id: 'editor-notes-title', class: 'editor-subtitle' }, 'Digitación y grados'),
      h('div', { class: 'field fret-field' },
        h('div', { class: 'field-heading' }, h('label', { for: 'f-frets' }, 'Digitación · 6ª a 1ª'), rangeBadge), frets,
        h('span', { class: 'hint', id: 'f-frets-hint' }, 'x muda · 0 al aire · dos cifras: separa con espacios'), note, error, span),
      h('fieldset', { class: 'degrees' }, h('legend', null, 'Grados manuales', h('span', { class: 'optional' }, 'Opcional')),
        h('div', { class: 'degree-grid' }, degrees.map((input, i) => h('div', { class: 'degree-cell' },
          h('label', { for: input.id }, STRINGS[i]), input)))),
      h('p', { class: 'editing-tip' }, 'Cada tarjeta es independiente: duplícala para otra digitación del mismo acorde.'));

    // Cada campo de texto edita solo la tarjeta seleccionada.
    const textField = (id, label, key, help) => h('div', { class: 'card-text-field' },
      field(id, label, effectiveText(event, voicing, key), value => {
        setCardTextValue(event, voicing, key, value); store.emit('text');
      }), h('p', { class: 'hint' }, help));
    let localFamily = null; // calidad elegida mientras la tarjeta no tiene tonalidad propia; no se guarda
    const hintText = h('span');
    const quality = h('select', { id: 'f-tonalidad-calidad', 'aria-describedby': 'tonality-hint', disabled: !voicing,
      title: 'Calidad de la tonalidad de esta tarjeta. Con el campo de tonalidad vacío, se prepara para el próximo texto que escribas y no cambia la tonalidad heredada.', onchange: e => {
      localFamily = e.target.value;
      store.endEdit();
      if (setTonalityFamily(voicing, localFamily)) store.emit('text');
      refreshTonality();
    } }, Object.entries(FAMILIES).map(([key, family]) => h('option', { value: key }, family.label)));
    const tonalityInput = h('input', { id: 'f-tonalidad', type: 'text', value: voicing?.tonality?.text || '', autocomplete: 'off', disabled: !voicing,
      'aria-describedby': 'tonality-hint', oninput: e => {
        const chosen = quality.value;
        setTonality(voicing, e.target.value, chosen);
        if (!voicing.tonality) localFamily = chosen;
        store.emit('text');
      } });
    const degreeField = field('f-grado-voicing', 'Grado de la tarjeta', voicing?.voicingDegree || '', value => {
      setVoicingDegree(voicing, value); store.emit('text');
    }, { disabled: !voicing });
    voicingControls.push(quality, tonalityInput, degreeField.querySelector('input'));
    function refreshTonality() {
      const entry = voicing ? deriveTonalityContext(store.state.song).get(voicing.id) || null : null;
      const effective = entry?.family || DEFAULT_TONALITY_FAMILY;
      hintText.textContent = voicing ? describeTonality(entry) : 'Escribe la digitación para completar la tarjeta.';
      quality.value = voicing?.tonality ? voicing.tonality.family : (localFamily ?? effective);
      // Vacío: el marcador muestra lo heredado sin confundirlo con un valor propio. El color efectivo va en el campo.
      tonalityInput.placeholder = !voicing ? '' : !entry ? 'Sin tonalidad' : voicing.tonality ? '' : `Hereda: ${entry.text}`;
      tonalityInput.title = voicing ? describeTonality(entry) : '';
      if (entry) tonalityInput.setAttribute('style', paletteFamilyStyle(effective, store.state.song.palette));
      else tonalityInput.removeAttribute('style');
    }
    refreshContext = refreshTonality;
    refreshTonality();
    const textsPanel = h('section', { id: 'editor-texts', class: 'editor-section', 'aria-labelledby': 'editor-texts-title' },
      h('h3', { id: 'editor-texts-title', class: 'editor-subtitle' }, 'Textos de la tarjeta'),
      h('div', { class: 'card-text-row' },
        textField('f-encima', 'Título sobre la tarjeta', 'aboveText', 'Fuera del recuadro. Por ejemplo: Introducción.'),
        textField('f-dentro', 'Anotación dentro', 'insideText', 'Bajo el nombre del acorde. Por ejemplo: Drop 2 · 1ª inversión.')),
      h('div', { class: 'card-text-row tonality-row' },
        degreeField,
        h('div', { class: 'field' }, h('label', { for: 'f-tonalidad' }, 'Tonalidad'), tonalityInput),
        h('div', { class: 'field' }, h('label', { for: 'f-tonalidad-calidad' }, 'Calidad de tonalidad'), quality)),
      h('p', { id: 'tonality-hint', class: 'hint tonality-hint' }, hintText));
    nodes.push(notesPanel, textsPanel);
    body.replaceChildren(...nodes);
  }
  render(store.state);
  store.subscribe((state, scope) => {
    if (['selection', 'structure', 'document', 'history'].includes(scope)) render(state);
    else if (scope === 'text') refreshContext?.(); // La tonalidad general o un cambio previo alteran lo heredado.
  });
}
