import { h } from '../render/dom.js';
import { FAMILIES } from '../model/families.js';
import { formatFrets, parseFrets } from '../model/frets.js';
import { addEvent, addVoicing, duplicateVoicing, removeEvent, removeVoicing, setEventDefault } from '../model/song.js';
import { selectedEvent, selectedMeasure, selectedVoicing } from '../store.js';
import { confirmDialog } from './dialog.js';
import { focusSoon } from './notify.js';
import { overrideField, refreshTextHelp } from './textOverride.js';
import { fretRange, spanMessage } from '../geometry/fretboard.js';
import { applyDegrees, degreesToInputs } from '../model/degrees.js';

const STRING_NAMES = ['6ª (grave)', '5ª', '4ª', '3ª', '2ª', '1ª (aguda)'];

function degreeInputs(voicing, store) {
  const inputs = degreesToInputs(voicing.degrees).map((value, i) => h('input', {
    id: `f-grado-${i}`, type: 'text', value, autocomplete: 'off', spellcheck: 'false',
    'aria-label': `Grado de la cuerda ${STRING_NAMES[i]}`,
    'aria-describedby': 'f-grados-hint',
    oninput: () => {
      applyDegrees(voicing, inputs.map((el) => el.value));
      store.emit('text');
    },
  }));
  return h('fieldset', { class: 'degrees' },
    h('legend', null, 'Grados manuales (opcional)'),
    h('div', { class: 'degree-grid' }, inputs.map((input, i) => h('div', { class: 'degree-cell' },
      h('label', { for: `f-grado-${i}` }, STRING_NAMES[i]), input))),
    h('span', { class: 'hint', id: 'f-grados-hint' },
      'De la sexta a la primera cuerda. Vacío = sin grado; no se inventa ninguno. Colorean la nota, también en cuerdas al aire. En cuerdas mudas se conservan pero no se dibujan. Las etiquetas de más de 3 caracteres se abrevian en el dibujo.'));
}

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
  root.append(h('div', { class: 'panel-head' }, h('h2', { id: 't-acorde' }, 'Acorde y posiciones')), body);

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
      hint: 'Es el número o nombre que se ve en la hoja, por ejemplo 1, 2 o «Puente». Cambiarlo no altera el contenido del compás ni sus marcas, y al mover compases no se renumera solo.',
      invalidWhenEmpty: true,
    }));

    /* ---- Acordes del compás ---- */
    nodes.push(h('h3', null, 'Acordes del compás'));
    // Referencias a resúmenes existentes: al escribir solo cambian su texto, sin reconstruir inputs.
    const titles = new Map();
    const miniatures = new Map();
    const eventTitle = (e, i) => `Acorde ${i + 1} · ${e.chordName || 'Sin nombre'}`;
    const countText = (n) => (n === 0 ? 'Sin posiciones · pendiente' : n === 1 ? '1 posición' : `${n} posiciones`);
    if (measure.chordEvents.length) {
      nodes.push(h('div', { class: 'acordes-grupos', role: 'group', 'aria-label': 'Acordes del compás' },
        measure.chordEvents.map((e, i) => {
          const active = Boolean(event && e.id === event.id);
          const title = h('span', { class: 'acorde-titulo' }, eventTitle(e, i));
          titles.set(e.id, { node: title, index: i });
          const head = h('button', {
            type: 'button', class: 'acorde-cab', 'aria-pressed': String(active), onclick: () => store.selectEvent(e.id),
          }, title, h('span', { class: 'acorde-cuenta' }, countText(e.voicings.length)));
          const positions = e.voicings.length
            ? h('div', { class: 'posiciones', role: 'group', 'aria-label': `Posiciones de ${e.chordName || 'acorde sin nombre'}` },
              e.voicings.map((v, k) => {
                const mini = h('span', { class: 'pos-digitacion mono' }, formatFrets(v.frets));
                miniatures.set(v.id, mini);
                return h('button', {
                  type: 'button',
                  class: 'posicion',
                  'aria-pressed': String(active && Boolean(voicing) && v.id === voicing.id),
                  onclick: () => store.select({ measureId: measure.id, eventId: e.id, voicingId: v.id }),
                }, h('span', { class: 'pos-num' }, `Posición ${k + 1}`), mini);
              }))
            : null;
          const actions = active ? h('div', { class: 'acorde-acciones' },
            h('p', { class: 'hint' }, 'Otra digitación del mismo acorde. Escribe sus trastes: no se calcula automáticamente.'),
            h('div', { class: 'btn-row' },
              btn('Añadir otra posición', () => {
                const created = addVoicing(song, e);
                store.commit('structure', { measureId: measure.id, eventId: e.id, voicingId: created.id });
                focusSoon('f-frets', { select: true });
              }),
              voicing ? btn('Duplicar posición', () => {
                const copy = duplicateVoicing(song, e, voicing.id);
                store.commit('structure', { measureId: measure.id, eventId: e.id, voicingId: copy.id });
              }) : null,
              voicing ? btn('Quitar posición', async () => {
                const choice = await confirmDialog({
                  title: '¿Quitar esta posición?',
                  intro: 'Solo se elimina esta tarjeta; el acorde y las demás posiciones no cambian.',
                  actions: [{ label: 'Cancelar', value: 'cancel' }, { label: 'Quitar posición', value: 'remove', kind: 'danger' }],
                });
                if (choice !== 'remove') return;
                removeVoicing(e, voicing.id);
                store.commit('structure', { measureId: measure.id, eventId: e.id });
              }) : null)) : null;
          return h('section', { class: active ? 'acorde-grupo activo' : 'acorde-grupo' }, head, positions, actions);
        })));
    } else {
      nodes.push(h('p', { class: 'hint' }, 'Compás vacío o de silencio: se conserva con su etiqueta.'));
    }
    nodes.push(h('div', { class: 'btn-row' },
      btn('Añadir otro acorde', () => {
        const created = addEvent(song, measure.id);
        store.commit('structure', { measureId: measure.id, eventId: created.id });
        focusSoon('f-acorde', { select: true });
      }),
      event ? btn('Quitar acorde', async () => {
        const choice = await confirmDialog({
          title: `¿Quitar el acorde «${event.chordName || 'sin nombre'}»?`,
          intro: `Se eliminarán también sus ${event.voicings.length} posición(es). Los demás acordes no cambian.`,
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
          const title = titles.get(event.id);
          if (title) {
            title.node.textContent = eventTitle(event, title.index);
            const group = title.node.closest('.acorde-grupo');
            const positions = group && group.querySelector('.posiciones');
            if (positions) positions.setAttribute('aria-label', `Posiciones de ${v || 'acorde sin nombre'}`);
          }
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
        textField('f-encima-ev', 'Título encima (por defecto)', event.aboveText || '', (v) => {
          setEventDefault(event, 'aboveText', v);
          refreshTextHelp('f-encima', event, voicing, 'aboveText');
          store.emit('text');
        }),
        textField('f-dentro-ev', 'Texto dentro (por defecto)', event.insideText || '', (v) => {
          setEventDefault(event, 'insideText', v);
          refreshTextHelp('f-dentro', event, voicing, 'insideText');
          store.emit('text');
        }));
      if (!event.voicings.length) {
        nodes.push(h('p', { class: 'hint' }, 'Sin digitación: la tarjeta queda como pendiente y se conserva.'));
      }

      if (voicing) {
        const note = h('span', { class: 'hint', id: 'f-frets-note' });
        const refreshNote = () => {
          note.textContent = voicing.frets.every((f) => f === null)
            ? 'Las seis cuerdas están mudas (x x x x x x). Escribe los trastes de esta posición.'
            : '';
        };
        refreshNote();
        const error = h('span', { class: 'error', id: 'f-frets-error', role: 'alert' });
        const span = h('span', { class: 'error', id: 'f-frets-span' });
        const refreshSpan = () => {
          const message = spanMessage(fretRange(voicing.frets));
          span.textContent = message ? `Aviso: esta digitación ${message}` : '';
        };
        refreshSpan();
        const input = h('input', {
          id: 'f-frets', type: 'text', class: 'mono', value: formatFrets(voicing.frets), autocomplete: 'off', spellcheck: 'false',
          'aria-describedby': 'f-frets-hint f-frets-note f-frets-error',
          oninput: (e) => {
            // Se valida antes de tocar la posición: una entrada inválida no cambia nada.
            const result = parseFrets(e.target.value);
            if (result.error) {
              e.target.setAttribute('aria-invalid', 'true');
              error.textContent = result.error;
              return;
            }
            e.target.removeAttribute('aria-invalid');
            error.textContent = '';
            voicing.frets = result.frets;
            const mini = miniatures.get(voicing.id);
            if (mini) mini.textContent = formatFrets(voicing.frets);
            refreshNote();
            refreshSpan();
            store.emit('text');
          },
        });
        nodes.push(
          h('h3', null, 'Tarjeta seleccionada'),
          h('div', { class: 'field' },
            h('label', { for: 'f-frets' }, 'Digitación (sexta a primera)'),
            input,
            h('span', { class: 'hint', id: 'f-frets-hint' }, 'Traste, 0 al aire, x muda. Ejemplos: x35343 o x 10 12 10 11 10.'),
            note,
            error,
            span),
          degreeInputs(voicing, store),
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
