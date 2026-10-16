import { h } from '../render/dom.js';
import { FAMILIES } from '../model/families.js';
import { formatFrets, parseFrets } from '../model/frets.js';
import { addEvent, addVoicing, duplicateVoicing, removeEvent, removeVoicing, setEventDefault } from '../model/song.js';
import { selectedEvent, selectedMeasure, selectedVoicing } from '../store.js';
import { confirmDialog } from './dialog.js';
import { focusSoon } from './notify.js';
import { overrideField } from './textOverride.js';

function textField(id, label, value, onInput, { hint, invalidWhenEmpty = false } = {}) {
  const input = h('input', {
    id, type: 'text', value, autocomplete: 'off',
    'aria-describedby': hint ? `${id}-hint` : null,
    'aria-invalid': invalidWhenEmpty && value === '' ? 'true' : null,
    oninput: (e) => {
      if (invalidWhenEmpty) {
        if (e.target.value === '') e.target.setAttribute('aria-invalid', 'true');
        else e.target.removeAttribute('aria-invalid');
      }
      onInput(e.target.value);
    },
  });
  return h('div', { class: 'field' },
    h('label', { for: id }, label),
    input,
    hint ? h('span', { class: 'hint', id: `${id}-hint` }, hint) : null);
}

export function mountChordPanel(root, store) {
  const body = h('div');
  root.append(h('div', { class: 'panel-head' }, h('h2', { id: 't-acorde' }, 'Acorde y voicings')), body);

  const btn = (text, onclick) => h('button', { type: 'button', class: 'btn', onclick }, text);

  function render(state) {
    const { song } = state;
    const measure = selectedMeasure(state);
    if (!measure) {
      body.replaceChildren(h('p', { class: 'hint' }, 'Selecciona un compás de la lista, o añade uno si la canción está vacía.'));
      return;
    }
    const event = selectedEvent(state);
    const voicing = selectedVoicing(state);
    const nodes = [];

    nodes.push(textField('f-etiqueta', 'Etiqueta del compás', measure.label, (v) => { measure.label = v; store.emit('text'); }, {
      hint: 'Es el número visible; el identificador interno no cambia al editarla o mover el compás.',
      invalidWhenEmpty: true,
    }));

    /* ---- Acordes del compás ---- */
    nodes.push(h('h3', null, 'Acordes del compás'));
    const chips = new Map();
    if (measure.chordEvents.length) {
      nodes.push(h('div', { class: 'chips', role: 'group', 'aria-label': 'Acordes del compás' },
        measure.chordEvents.map((e) => {
          const chip = h('button', {
            type: 'button', class: 'chip', 'aria-pressed': String(event && e.id === event.id), onclick: () => store.selectEvent(e.id),
          }, e.chordName || 'Sin nombre');
          chips.set(e.id, chip);
          return chip;
        })));
    } else {
      nodes.push(h('p', { class: 'hint' }, 'Compás vacío o de silencio: se conserva con su etiqueta.'));
    }
    nodes.push(h('div', { class: 'btn-row' },
      btn('Añadir acorde', () => {
        const created = addEvent(song, measure.id);
        store.commit('structure', { measureId: measure.id, eventId: created.id });
        focusSoon('f-acorde', { select: true });
      }),
      event ? btn('Quitar acorde', async () => {
        const choice = await confirmDialog({
          title: `¿Quitar el acorde «${event.chordName || 'sin nombre'}»?`,
          intro: `Se eliminarán también sus ${event.voicings.length} voicing(s). Los demás acordes no cambian.`,
          actions: [{ label: 'Cancelar', value: 'cancel' }, { label: 'Quitar acorde', value: 'remove', kind: 'danger' }],
        });
        if (choice !== 'remove') return;
        removeEvent(song, measure.id, event.id);
        store.commit('structure', { measureId: measure.id });
      }) : null));

    if (event) {
      nodes.push(
        textField('f-acorde', 'Nombre del acorde', event.chordName || '', (v) => {
          event.chordName = v;
          const chip = chips.get(event.id);
          if (chip) chip.textContent = v || 'Sin nombre';
          store.emit('text');
        }, { invalidWhenEmpty: true, hint: 'Obligatorio para poder guardar.' }),
        h('div', { class: 'field' },
          h('label', { for: 'f-familia' }, 'Familia (color)'),
          h('select', {
            id: 'f-familia',
            onchange: (e) => { event.family = e.target.value; store.emit('text'); },
          }, Object.entries(FAMILIES).map(([key, f]) => h('option', { value: key, selected: (event.family || 'other') === key }, f.label)))),
        h('h3', null, 'Valores por defecto del acorde'),
        h('p', { class: 'hint' }, 'Los heredan las tarjetas de este acorde que no tengan su propio valor.'),
        textField('f-encima-ev', 'Título encima (por defecto)', event.aboveText || '', (v) => { setEventDefault(event, 'aboveText', v); store.emit('text'); }),
        textField('f-dentro-ev', 'Texto dentro (por defecto)', event.insideText || '', (v) => { setEventDefault(event, 'insideText', v); store.emit('text'); }),

        /* ---- Voicings ---- */
        h('h3', null, 'Voicings del acorde'));

      if (event.voicings.length) {
        nodes.push(h('div', { class: 'chips', role: 'group', 'aria-label': 'Voicings del acorde' },
          event.voicings.map((v, i) => h('button', {
            type: 'button', class: 'chip', 'aria-pressed': String(voicing && v.id === voicing.id), onclick: () => store.selectVoicing(v.id),
          }, `Voicing ${i + 1}`))));
      } else {
        nodes.push(h('p', { class: 'hint' }, 'Sin digitación: la tarjeta queda como pendiente y se conserva.'));
      }
      nodes.push(h('div', { class: 'btn-row' },
        btn('Añadir voicing', () => {
          const created = addVoicing(song, event);
          store.commit('structure', { measureId: measure.id, eventId: event.id, voicingId: created.id });
          focusSoon('f-frets', { select: true });
        }),
        voicing ? btn('Duplicar voicing', () => {
          const copy = duplicateVoicing(song, event, voicing.id);
          store.commit('structure', { measureId: measure.id, eventId: event.id, voicingId: copy.id });
        }) : null,
        voicing ? btn('Quitar voicing', async () => {
          const choice = await confirmDialog({
            title: '¿Quitar este voicing?',
            intro: 'Solo se elimina esta tarjeta; el acorde y los demás voicings no cambian.',
            actions: [{ label: 'Cancelar', value: 'cancel' }, { label: 'Quitar voicing', value: 'remove', kind: 'danger' }],
          });
          if (choice !== 'remove') return;
          removeVoicing(event, voicing.id);
          store.commit('structure', { measureId: measure.id, eventId: event.id });
        }) : null));

      if (voicing) {
        const error = h('span', { class: 'error', id: 'f-frets-error', role: 'alert' });
        const input = h('input', {
          id: 'f-frets', type: 'text', class: 'mono', value: formatFrets(voicing.frets), autocomplete: 'off', spellcheck: 'false',
          'aria-describedby': 'f-frets-hint f-frets-error',
          oninput: (e) => {
            // Se valida antes de tocar el voicing: una entrada inválida no cambia nada.
            const result = parseFrets(e.target.value);
            if (result.error) {
              e.target.setAttribute('aria-invalid', 'true');
              error.textContent = result.error;
              return;
            }
            e.target.removeAttribute('aria-invalid');
            error.textContent = '';
            voicing.frets = result.frets;
            store.emit('text');
          },
        });
        nodes.push(
          h('h3', null, 'Tarjeta seleccionada'),
          h('div', { class: 'field' },
            h('label', { for: 'f-frets' }, 'Digitación (sexta a primera)'),
            input,
            h('span', { class: 'hint', id: 'f-frets-hint' }, 'Traste, 0 al aire, x muda. Ejemplos: x35343 o x 10 12 10 11 10.'),
            error),
          overrideField({ id: 'f-encima', label: 'Título encima de esta tarjeta', event, voicing, key: 'aboveText', store }),
          overrideField({ id: 'f-dentro', label: 'Texto dentro de esta tarjeta', event, voicing, key: 'insideText', store }));
      }
    }

    body.replaceChildren(...nodes);
  }

  render(store.state);
  // Al escribir ('text') no se reconstruye el editor: el input activo conserva foco y cursor.
  store.subscribe((state, scope) => {
    if (scope === 'selection' || scope === 'structure' || scope === 'document') render(state);
  });
}
