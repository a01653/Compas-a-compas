import { h } from '../render/dom.js';
import { FAMILIES } from '../model/families.js';
import { formatFrets, parseFrets } from '../model/frets.js';
import { addMeasure, addVoicing, canRepeatTwo, clearRepeatPrevious, clearRepeatPreviousTwo, effectiveText, fixRepeatPrevious,
  fixRepeatPreviousTwo, leaveRepeat, previousMeasure, repeatPairOf, setRepeatPrevious, setRepeatPreviousTwo } from '../model/song.js';
import { checkStructure } from '../model/structure.js';
import { addCard, cardKey, findCard, flatCards, isolateCard, selectionOf, setCardTextValue } from '../model/cards.js';
import { selectedEvent, selectedMeasure, selectedVoicing } from '../store.js';
import { confirmDialog } from './dialog.js';
import { focusSoon, notify } from './notify.js';
import { fretRange, spanMessage } from '../geometry/fretboard.js';
import { applyDegrees, degreesToInputs } from '../model/degrees.js';
import { actionButton, icon, iconButton } from './icons.js';
import { paletteFamilyStyle } from '../model/palette.js';
import { DEFAULT_TONALITY_FAMILY, deriveTonalityContext, describeTonality, setAnchorFret, setTonality, setTonalityFamily, setVoicingDegree, tonalitiesVisible } from '../model/tonality.js';

const STRINGS = ['6ª', '5ª', '4ª', '3ª', '2ª', '1ª'];
const NO_FRETS = [null, null, null, null, null, null];
/** Menú de tarjeta: las mismas acciones que el menú contextual de una tarjeta en la hoja (ui/cardActions.js). */
const CARD_MENU = ['copy', 'cut', 'pasteBefore', 'pasteAfter', 'replace', 'fingering', 'moveBefore', 'moveAfter', 'toggleMark', 'remove'];
function field(id, label, value, update, extra = {}) {
  return h('div', { class: 'field' }, h('label', { for: id }, label),
    h('input', { id, type: 'text', value, autocomplete: 'off', oninput: e => update(e.target.value), ...extra }));
}

export function mountChordPanel(root, store, { clipboard, cardActions }) {
  let refreshContext = null;
  let syncClipboard = null;
  const body = h('div', { class: 'chord-body' });
  root.append(h('div', { class: 'editor-heading' }, h('h2', { id: 't-acorde' }, 'Tarjetas'),
    h('span', { class: 'live-badge' }, h('span', { 'aria-hidden': 'true' }), 'En directo')), body);

  let renderedTonal = null;
  function render(state) {
    const { song } = state;
    renderedTonal = tonalitiesVisible(song);
    refreshContext = null;
    const measure = selectedMeasure(state);
    syncClipboard = null;
    if (!measure) { body.replaceChildren(h('p', { class: 'hint empty-editor' }, 'Añade un compás para empezar.')); return; }
    // `event` y `voicing` se actualizan sin reconstruir el formulario cuando una edición separa la tarjeta o completa una pendiente.
    let event = selectedEvent(state);
    let voicing = selectedVoicing(state);
    const commit = selection => store.commit('structure', { measureId: measure.id, ...selection }, { kind: 'card' });
    const voicingControls = []; // Campos que solo existen cuando la tarjeta ya tiene digitación.

    const cardSelect = h('select', { id: 'card-select', 'aria-label': 'Seleccionar tarjeta del compás',
      onchange: e => {
        const card = findCard(measure, e.target.value);
        if (card) store.select({ measureId: measure.id, ...selectionOf(card) }, { kind: 'card' });
      } });
    function fillSelector() {
      const cards = flatCards(measure);
      cardSelect.replaceChildren(...cards.map((card, i) =>
        h('option', { value: card.key }, `${i + 1}. ${card.event.chordName?.trim() ? card.event.chordName : 'Sin nombre'}${card.voicing ? '' : ' · sin digitación'}`)));
      if (!cards.length) cardSelect.append(h('option', { value: '' }, 'Compás vacío'));
      else cardSelect.value = cardKey(event, voicing);
    }
    fillSelector();
    cardSelect.disabled = !event;
    const addButton = actionButton('plus', 'Tarjeta', () => {
      // En un compás de repetición se sale del modo de forma explícita: nunca quedan símbolo y tarjetas ocultas a la vez.
      const wasPair = Boolean(repeatPairOf(song, measure.id));
      const leavingRepeat = leaveRepeat(song, measure.id);
      const created = addCard(song, measure.id, !leavingRepeat && event ? { eventId: event.id, voicingId: voicing ? voicing.id : null } : null);
      commit({ eventId: created.event.id, voicingId: created.voicing.id });
      if (leavingRepeat) notify(wasPair ? 'Se quitó la repetición de dos compases (ambos compases quedan editables) para añadir la tarjeta.' : 'Se quitó la repetición del compás anterior para añadir la tarjeta.');
      focusSoon('f-acorde', { select: true });
    }, { title: 'Añadir una tarjeta nueva después de esta', 'aria-label': 'Añadir tarjeta', class: 'btn btn-soft' });
    const previous = previousMeasure(song, measure.id);
    const pair = repeatPairOf(song, measure.id);
    const repeatButton = iconButton('percent', 'Repetir compás anterior', async () => {
      if (flatCards(measure).length) {
        const choice = await confirmDialog({ title: `¿Sustituir las tarjetas del compás ${measure.label} por el signo de repetición?`,
          intro: `El compás ${measure.label} pasará a repetir el compás ${previous.label}. Se quitarán sus ${flatCards(measure).length} tarjeta(s); puedes recuperarlas con Deshacer. Etiqueta y marcas se conservan.`,
          actions: [{ label: 'Cancelar', value: 'cancel' }, { label: 'Sustituir por repetición', value: 'repeat', kind: 'danger' }] });
        if (choice !== 'repeat') return;
      }
      if (setRepeatPrevious(song, measure.id)) commit({});
    }, { class: 'btn btn-soft tool-icon' });
    repeatButton.disabled = !previous || Boolean(measure.repeatPrevious) || Boolean(pair);
    repeatButton.title = !previous ? 'No hay compás anterior: el primer compás no puede repetirlo.'
      : measure.repeatPrevious ? 'Este compás ya repite el anterior.'
        : pair ? 'Este compás forma parte de una repetición de dos compases: quítala antes.'
          : `Dibuja el signo de repetición en este compás (el ${measure.label}) en lugar de sus tarjetas, repitiendo el compás ${previous.label}. No crea compases nuevos.`;
    const index = song.measures.indexOf(measure);
    const repeatTwoButton = iconButton('percent2', 'Repetir dos compases anteriores', async () => {
      const second = song.measures[index + 1] || null;
      let adding = false;
      if (!second) {
        const choice = await confirmDialog({ title: 'La repetición necesita dos compases de destino',
          intro: `El compás ${measure.label} es el último. ¿Añadir un compás vacío al final para que sea el segundo destino? No se añadirá nada si cancelas.`,
          actions: [{ label: 'Cancelar', value: 'cancel' }, { label: 'Añadir compás y repetir', value: 'add', kind: 'primary' }] });
        if (choice !== 'add') return;
        adding = true;
      }
      const cards = flatCards(measure).length + (second ? flatCards(second).length : 0);
      if (cards) {
        const choice = await confirmDialog({ title: '¿Sustituir las tarjetas por el signo de repetición de dos compases?',
          intro: `Los compases ${measure.label} y ${second ? second.label : 'nuevo'} pasarán a repetir los compases ${song.measures[index - 2].label} y ${song.measures[index - 1].label}. Se quitarán ${cards} tarjeta(s); puedes recuperarlas con Deshacer. Etiquetas y marcas se conservan.`,
          actions: [{ label: 'Cancelar', value: 'cancel' }, { label: 'Sustituir por repetición', value: 'repeat', kind: 'danger' }] });
        if (choice !== 'repeat') return;
      }
      if (adding) addMeasure(song);
      if (setRepeatPreviousTwo(song, measure.id)) commit({});
    }, { class: 'btn btn-soft tool-icon' });
    const canTwo = canRepeatTwo(song, measure.id);
    repeatTwoButton.disabled = !canTwo || Boolean(measure.repeatPrevious) || Boolean(pair);
    repeatTwoButton.title = !canTwo ? 'Hacen falta dos compases anteriores: no se puede repetir dos compases desde aquí.'
      : measure.repeatPrevious ? 'Este compás ya repite el anterior: quita esa repetición antes.'
        : pair ? 'Este compás ya forma parte de una repetición de dos compases.'
          : `Repite como pareja los compases ${song.measures[index - 2].label} y ${song.measures[index - 1].label} en este compás (${measure.label}) y el siguiente. Si no hay siguiente, pregunta antes de añadirlo.`;
    const duplicate = iconButton('copy', 'Duplicar tarjeta', () => cardActions.run('duplicate'));

    // Copiar, pegar, sustituir y ordenar: se aplican a las tarjetas marcadas o, si no hay, a esta. El portapapeles de tarjetas es
    // independiente del de compases y sirve entre compases y canciones.
    const menuButtons = CARD_MENU.map(id => h('button', { type: 'button', class: 'btn menu-action', 'data-action': id, onclick: () => cardActions.run(id) }));
    syncClipboard = () => {
      for (const button of menuButtons) {
        const item = cardActions.item(button.dataset.action);
        button.replaceChildren(...[h('span', null, item.label), item.hint ? h('kbd', null, item.hint) : null].filter(Boolean));
        button.disabled = Boolean(item.disabled);
        button.classList.toggle('danger', Boolean(item.danger));
        if (item.title) button.title = item.title;
        else button.removeAttribute('title');
      }
      const dup = cardActions.item('duplicate');
      duplicate.disabled = Boolean(dup.disabled);
      duplicate.title = dup.label;
      duplicate.setAttribute('aria-label', dup.label);
    };
    syncClipboard();
    const cardMenu = h('details', { class: 'action-menu card-menu' },
      h('summary', { class: 'btn btn-soft tool-icon', 'aria-label': 'Opciones de la tarjeta', title: 'Copiar, pegar, sustituir, ordenar o quitar tarjetas' }, icon('more')),
      h('div', { class: 'menu-content' }, menuButtons));
    const nodes = [h('div', { class: 'section-label' }, 'Tarjetas del compás', h('span', null, String(flatCards(measure).length))),
      h('div', { class: 'selector-row' }, cardSelect, addButton, repeatButton, repeatTwoButton, duplicate, cardMenu)];
    if (!previous) nodes.push(h('p', { class: 'hint repeat-hint' }, 'Repetir compás anterior no está disponible: no hay compás anterior.'));
    else if (!canTwo) nodes.push(h('p', { class: 'hint repeat-hint' }, 'Repetir dos compases anteriores no está disponible: hacen falta dos compases antes de este.'));
    if (measure.repeatPrevious || measure.repeatPreviousTwo || pair) {
      const firstId = pair ? pair.first.id : measure.id;
      const issues = checkStructure(song).filter(w => w.kind === 'repeat' && (w.objectId === measure.id || w.objectId === firstId));
      const double = Boolean(measure.repeatPreviousTwo || pair);
      let message;
      if (double) {
        const ids = (pair ? pair.first : measure).repeatPreviousTwo.sourceMeasureIds;
        const labels = ids.map(id => song.measures.find(m => m.id === id)?.label);
        message = labels.every(Boolean) ? `Este compás es parte de una repetición de dos compases: repite los compases ${labels.join(' y ')}. No tiene tarjetas propias.` : 'Esta repetición de dos compases apunta a compases que ya no existen.';
      } else {
        const source = song.measures.find(m => m.id === measure.repeatPrevious.sourceMeasureId);
        message = source ? `Este compás repite el compás ${source.label}. No tiene tarjetas propias: el contenido se lee en el origen.` : 'Este compás repite un compás que ya no existe.';
      }
      const fix = double ? () => fixRepeatPreviousTwo(song, firstId) : () => fixRepeatPrevious(song, measure.id);
      const firstIndex = song.measures.findIndex(m => m.id === firstId);
      const canFix = double ? firstIndex >= 2 && Boolean(song.measures[firstIndex + 1]) : Boolean(previous);
      const clear = () => { if (!double) clearRepeatPrevious(song, measure.id); else if (!clearRepeatPreviousTwo(song, measure.id)) delete measure.repeatPreviousTwo; };
      nodes.push(h('div', { class: 'repeat-notice', role: 'group', 'aria-label': double ? 'Repetición de dos compases' : 'Repetición del compás anterior' },
        h('p', null, message),
        ...issues.map(w => h('p', { class: 'error', role: 'alert' }, w.message)),
        h('div', { class: 'repeat-actions' },
          h('button', { type: 'button', class: 'btn', onclick: () => { clear(); commit({}); } }, double ? 'Quitar repetición (ambos compases)' : 'Quitar repetición'),
          issues.length ? h('button', { type: 'button', class: 'btn', disabled: !canFix, title: canFix ? 'Apuntar a los compases inmediatamente anteriores' : 'No hay compases anteriores suficientes', onclick: () => { if (fix()) commit({}); } }, 'Corregir referencia') : null)));
      body.replaceChildren(...nodes); return;
    }
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
    }, { placeholder: 'Sin nombre' });
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
      const range = fretRange(current, voicing?.anchorFret);
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
    const anchorError = h('span', { class: 'error', role: 'alert' });
    const anchorInput = h('input', { id: 'f-anchor-fret', type: 'number', min: 1, step: 1,
      value: voicing?.anchorFret ?? '', disabled: !voicing, autocomplete: 'off',
      'aria-describedby': 'f-anchor-fret-hint', oninput: e => {
        if (!setAnchorFret(voicing, e.target.value)) {
          e.target.setAttribute('aria-invalid', 'true'); anchorError.textContent = 'Escribe un número de traste entero mayor que cero.'; return;
        }
        e.target.removeAttribute('aria-invalid'); anchorError.textContent = '';
        refreshRange(); store.emit('text');
      } });
    voicingControls.push(anchorInput);
    const notesPanel = h('section', { id: 'editor-notes', class: 'editor-section', 'aria-labelledby': 'editor-notes-title' },
      h('h3', { id: 'editor-notes-title', class: 'editor-subtitle' }, 'Digitación y grados'),
      h('div', { class: 'field fret-field' },
        h('div', { class: 'field-heading' }, h('label', { for: 'f-frets' }, 'Digitación · 6ª a 1ª'), rangeBadge), frets,
        h('span', { class: 'hint', id: 'f-frets-hint' }, 'x muda · 0 al aire · dos cifras: separa con espacios'), note, error, span),
      h('div', { class: 'field' }, h('label', { for: 'f-anchor-fret' }, 'Traste de referencia resaltado'), anchorInput,
        h('span', { class: 'hint', id: 'f-anchor-fret-hint' }, 'Opcional. Sombrea esa columna y amplía el mástil si hace falta.'), anchorError),
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
    const showTonal = tonalitiesVisible(song);
    const textsPanel = h('section', { id: 'editor-texts', class: 'editor-section', 'aria-labelledby': 'editor-texts-title' },
      h('h3', { id: 'editor-texts-title', class: 'editor-subtitle' }, 'Textos de la tarjeta'),
      h('div', { class: 'card-text-row' },
        textField('f-encima', 'Título sobre compás', 'aboveText', 'Encima del compás, desde esta tarjeta. Por ejemplo: Introducción.'),
        textField('f-dentro', 'Anotación dentro', 'insideText', 'Bajo el nombre del acorde. Por ejemplo: Drop 2 · 1ª inversión.')),
      // Con las tonalidades ocultas en la hoja, sus campos no tienen efecto visible: se ocultan sin tocar los valores guardados.
      h('div', { class: 'card-text-row tonality-row' },
        degreeField,
        showTonal ? h('div', { class: 'field' }, h('label', { for: 'f-tonalidad' }, 'Tonalidad'), tonalityInput) : null,
        showTonal ? h('div', { class: 'field' }, h('label', { for: 'f-tonalidad-calidad' }, 'Calidad de tonalidad'), quality) : null),
      showTonal ? h('p', { id: 'tonality-hint', class: 'hint tonality-hint' }, hintText) : null);
    nodes.push(notesPanel, textsPanel);
    body.replaceChildren(...nodes);
  }
  render(store.state);
  clipboard.subscribe(() => syncClipboard?.());
  store.subscribe((state, scope) => {
    if (['selection', 'structure', 'document', 'history'].includes(scope)) render(state);
    else if (scope === 'text') {
      if (tonalitiesVisible(state.song) !== renderedTonal) render(state); // Se activó o desactivó «Mostrar tonalidades».
      else refreshContext?.();
    } // La tonalidad general o un cambio previo alteran lo heredado.
  });
}
