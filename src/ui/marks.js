import { h } from '../render/dom.js';
import { checkStructure, JUMP_NAMES, MARKER_NAMES } from '../model/structure.js';
import {
  KIND_NAMES, EDGES, EDGE_NAMES, JUMP_TYPES, MARKER_TYPES,
  addMark, updateMark, deleteMark, validateMark, markConsequences, listMarks, jumpNeeds,
  measureOptions, markerOptions, repeatOptions, withPending, defaultFields, fieldsFromMark,
} from '../model/marks.js';
import { confirmDialog } from './dialog.js';
import { notify } from './notify.js';

const FORM_KINDS = [['repeat', 'Repetición ×N'], ['ending', 'Casilla de pasadas'], ['marker', 'Segno, Coda o Fine'], ['jump', 'Salto (D.C., D.S., To Coda…)']];
const MIN_PASS_BOXES = 4;

function replace(root, ...children) {
  root.replaceChildren(...children.flat(Infinity).filter(x => x != null && x !== false));
}

function selectField(id, labelText, options, value, onchange, { hint } = {}) {
  const select = h('select', { id, onchange: (e) => onchange(e.target.value) },
    options.map((o) => h('option', { value: o.value, selected: o.value === value }, o.label)));
  select.value = value;
  return h('div', { class: 'field' }, h('label', { for: id }, labelText), select, hint ? h('span', { class: 'hint' }, hint) : null);
}

export function mountMarksPanel(root, store) {
  // Borrador del formulario: sobrevive a repintados y a entradas inválidas.
  let draft = { editingId: null, kind: 'repeat', fields: defaultFields('repeat') };

  const list = h('div');
  const formBox = h('form', { class: 'mark-add', novalidate: true, 'aria-labelledby': 't-marca-form', onsubmit: (e) => { e.preventDefault(); save(); } });
  root.append(
    h('div', { class: 'panel-head' }, h('h2', { id: 't-marcas' }, 'Marcas musicales'), h('span', { class: 'hint' }, 'Se dibujan en la hoja')),
    list, formBox);

  const song = () => store.state.song;
  const defaultMeasure = () => store.state.selection.measureId || (song().measures[0] && song().measures[0].id) || '';

  function resetDraft(kind = draft.kind) {
    draft = { editingId: null, kind, fields: defaultFields(kind, defaultMeasure()) };
  }

  /* ---------- Lista ---------- */
  function renderList(state) {
    const items = listMarks(state.song);
    const warnings = checkStructure(state.song);
    replace(list,
      items.length
        ? h('ul', { class: 'mark-list' }, items.map((m) => h('li', { class: 'mark-item' },
            h('span', { class: 'mark-kind' }, m.title),
            h('span', { class: 'mark-det' }, m.detail),
            h('span', { class: 'mark-acc' },
              h('button', { type: 'button', class: 'btn', 'aria-label': `Editar: ${m.title}, ${m.detail}`, onclick: () => startEdit(m) }, 'Editar'),
              h('button', { type: 'button', class: 'btn btn-danger', 'aria-label': `Borrar: ${m.title}, ${m.detail}`, onclick: () => remove(m) }, 'Borrar')))))
        : h('p', { class: 'hint' }, 'Esta canción no tiene marcas. Añade una con el formulario.'),
      warnings.length
        ? h('div', { class: 'warn-box', role: 'region', 'aria-label': 'Avisos de marcas' },
            h('h3', null, `Avisos (${warnings.length})`),
            h('ul', { class: 'dialog-list' }, warnings.map((w) => h('li', null, w.message))),
            h('p', { class: 'hint' }, 'Las marcas incompletas se conservan tal cual; nada se redirige solo. Edítalas para elegir un destino.'))
        : null);
  }

  function startEdit(m) {
    draft = { editingId: m.item.id, kind: m.kind, fields: fieldsFromMark(m.kind, m.item) };
    renderForm();
    formBox.querySelector('select')?.focus();
  }

  async function remove(m) {
    const choice = await confirmDialog({
      title: `¿Borrar «${m.title}»?`,
      intro: `${m.title}, ${m.detail}. Se borra solo esta marca; nada se redirige a otro destino.`,
      items: markConsequences(song(), m.item.id),
      actions: [{ label: 'Cancelar', value: 'cancel' }, { label: 'Borrar marca', value: 'delete', kind: 'danger' }],
    });
    if (choice !== 'delete') return;
    deleteMark(song(), m.item.id);
    if (draft.editingId === m.item.id) resetDraft();
    store.commit('structure');
    notify('Marca borrada. Las referencias que apuntaban a ella quedan pendientes y se avisan en la lista.', { duration: 6000 });
  }

  /* ---------- Formulario ---------- */
  const set = (key) => (value) => { draft.fields[key] = value; };

  function renderForm() {
    const f = draft.fields;
    const sg = song();
    const editing = Boolean(draft.editingId);
    const measures = measureOptions(sg);
    const pendingMeasure = 'Compás desaparecido (pendiente; se conserva)';
    const measureSelect = (id, text, key) => selectField(id, text, withPending(measures, f[key], pendingMeasure), f[key], (v) => { set(key)(v); });
    const edgeSelect = selectField('mf-borde', 'Posición respecto al compás', EDGES.map((e) => ({ value: e, label: `${EDGE_NAMES[e][0].toUpperCase()}${EDGE_NAMES[e].slice(1)} compás` })), f.edge, set('edge'));
    const rerender = (key) => (value) => { set(key)(value); renderForm(); };

    const fields = [];
    if (draft.kind === 'repeat') {
      fields.push(
        measureSelect('mf-ini', 'Compás inicial', 'startMeasureId'),
        measureSelect('mf-fin', 'Compás final', 'endMeasureId'),
        h('div', { class: 'field' },
          h('label', { for: 'mf-veces' }, 'Pasadas totales (×N)'),
          h('input', { id: 'mf-veces', type: 'text', inputmode: 'numeric', value: f.times, oninput: (e) => set('times')(e.target.value), 'aria-describedby': 'mf-veces-ayuda' }),
          h('span', { class: 'hint', id: 'mf-veces-ayuda' }, 'Entero de 2 o más: ×2 repite una vez, ×3 dos veces.')));
    } else if (draft.kind === 'ending') {
      const reps = withPending(repeatOptions(sg), f.repeatId, 'Repetición desaparecida (pendiente; se conserva)');
      const rep = sg.structure.repeats.find((r) => r.id === f.repeatId);
      const maxBoxes = rep ? Math.min(rep.times, 8) : MIN_PASS_BOXES;
      fields.push(
        measureSelect('mf-ini', 'Compás inicial', 'startMeasureId'),
        measureSelect('mf-fin', 'Compás final', 'endMeasureId'),
        selectField('mf-rep', 'Repetición a la que pertenece', [{ value: '', label: 'Ninguna (casilla suelta)' }, ...reps], f.repeatId, rerender('repeatId')),
        h('fieldset', { class: 'field passes' },
          h('legend', { class: 'label' }, 'Pasadas en las que suena'),
          h('div', { class: 'pass-row' }, Array.from({ length: maxBoxes }, (_, i) => i + 1).map((p) => h('label', { class: 'pass-box' },
            h('input', {
              type: 'checkbox', checked: f.passes.includes(p),
              onchange: (e) => {
                f.passes = e.target.checked ? [...new Set([...f.passes, p])].sort((a, b) => a - b) : f.passes.filter((x) => x !== p);
                const textInput = formBox.querySelector('#mf-pasadas');
                if (textInput) textInput.value = f.passes.join(', ');
              },
            }), ` ${p}.ª`))),
          h('div', { class: 'field' },
            h('label', { for: 'mf-pasadas' }, 'O lista libre de pasadas'),
            h('input', {
              id: 'mf-pasadas',
              type: 'text',
              value: f.passes.join(', '),
              oninput: (e) => {
                const text = e.target.value.trim();
                if (!text) {
                  f.passes = [];
                } else {
                  const tokens = text.split(/\s*,\s*/).filter(t => t);
                  f.passes = tokens.map(t => /^\d+$/.test(t) ? Number(t) : t);
                }
                formBox.querySelectorAll('.pass-row input').forEach((inp, idx) => {
                  inp.checked = f.passes.includes(idx + 1);
                });
              },
            }),
            h('span', { class: 'hint' }, 'Selecciona las primeras pasadas o escribe cualquier otra en la lista libre.')),
          h('span', { class: 'hint' }, 'Marca varias pasadas para una casilla «1., 2.». Sin repetición asociada se ofrecen hasta 4; con ella, tantas como pasadas tenga.')));
    } else if (draft.kind === 'marker') {
      fields.push(
        selectField('mf-tipo', 'Marca', MARKER_TYPES.map((t) => ({ value: t, label: MARKER_NAMES[t] })), f.type, set('type')),
        measureSelect('mf-compas', 'Compás', 'measureId'), edgeSelect);
    } else {
      fields.push(
        selectField('mf-tipo', 'Salto', JUMP_TYPES.map((t) => ({ value: t, label: JUMP_NAMES[t] })), f.type, rerender('type')),
        measureSelect('mf-compas', 'Compás donde está escrito', 'measureId'), edgeSelect);
      for (const { field, type } of jumpNeeds(f.type)) {
        const pending = f[field] ? `${MARKER_NAMES[type]} pendiente: ya no existe o no es un ${MARKER_NAMES[type]} (se conserva)` : '';
        const options = [{ value: '', label: `Sin elegir (falta ${MARKER_NAMES[type]})` }, ...withPending(markerOptions(sg, type), f[field], pending)];
        fields.push(selectField(`mf-${type}`, `Destino ${MARKER_NAMES[type]}`, options, f[field], set(field),
          { hint: markerOptions(sg, type).length ? null : `Aún no hay ningún ${MARKER_NAMES[type]}: créalo primero o deja el destino sin elegir.` }));
      }
    }

    replace(formBox,
      h('h3', { id: 't-marca-form' }, editing ? 'Editar marca' : 'Nueva marca'),
      editing ? null : selectField('mf-clase', 'Tipo de marca', FORM_KINDS.map(([value, label]) => ({ value, label })), draft.kind, (kind) => { resetDraft(kind); renderForm(); }),
      sg.measures.length ? fields : h('p', { class: 'note' }, 'Añade al menos un compás para poder colocar marcas.'),
      h('div', { class: 'form-errors', id: 'mf-errores', role: 'alert' }),
      h('div', { class: 'btn-row' },
        h('button', { type: 'submit', class: 'btn btn-primary', disabled: !sg.measures.length }, editing ? 'Guardar cambios' : 'Añadir marca'),
        editing ? h('button', { type: 'button', class: 'btn', onclick: () => { resetDraft(); renderForm(); } }, 'Cancelar edición') : null));
  }

  function showErrors(errors) {
    const box = formBox.querySelector('#mf-errores');
    replace(box, errors.length ? h('ul', { class: 'dialog-list' }, errors.map((e) => h('li', null, e))) : null);
    box.classList.toggle('on', errors.length > 0);
  }

  function save() {
    const sg = song();
    const result = validateMark(sg, draft.kind, draft.fields);
    if (!result.ok) {
      showErrors(result.errors); // El borrador y la marca original quedan intactos.
      return;
    }
    const wasEditing = Boolean(draft.editingId);
    if (wasEditing) updateMark(sg, draft.editingId, result.value);
    else addMark(sg, draft.kind, result.value);
    resetDraft();
    store.commit('structure');
    notify(`${wasEditing ? 'Marca actualizada' : 'Marca añadida'}.${result.warnings.length ? ` Aviso: ${result.warnings.join(' ')}` : ''}`, { duration: result.warnings.length ? 9000 : 4000 });
  }

  function updateSelectOptions() {
    const sg = song();
    const f = draft.fields;
    const focusedId = document.activeElement?.id;
    const measureOpts = measureOptions(sg);

    const selectUpdates = {
      'mf-ini': withPending(measureOpts, f.startMeasureId, 'Compás desaparecido (pendiente; se conserva)'),
      'mf-fin': withPending(measureOpts, f.endMeasureId, 'Compás desaparecido (pendiente; se conserva)'),
      'mf-compas': withPending(measureOpts, f.measureId, 'Compás desaparecido (pendiente; se conserva)'),
    };

    if (draft.kind === 'ending') {
      const repOpts = repeatOptions(sg);
      selectUpdates['mf-rep'] = [{ value: '', label: 'Ninguna (casilla suelta)' }, ...withPending(repOpts, f.repeatId, 'Repetición desaparecida (pendiente; se conserva)')];
    }

    if (draft.kind === 'jump') {
      for (const { field, type } of jumpNeeds(f.type)) {
        const baseOpts = markerOptions(sg, type);
        const pending = f[field] ? `${MARKER_NAMES[type]} pendiente: ya no existe o no es un ${MARKER_NAMES[type]} (se conserva)` : '';
        selectUpdates[`mf-${type}`] = [{ value: '', label: `Sin elegir (falta ${MARKER_NAMES[type]})` }, ...withPending(baseOpts, f[field], pending)];
      }
    }

    Object.entries(selectUpdates).forEach(([selectId, options]) => {
      const selectEl = formBox.querySelector(`#${selectId}`);
      if (selectEl) {
        const currentValue = selectEl.value;
        selectEl.replaceChildren(...options.map(o => h('option', { value: o.value }, o.label)));
        selectEl.value = currentValue;
      }
    });

    if (focusedId && selectUpdates[focusedId]) {
      formBox.querySelector(`#${focusedId}`)?.focus();
    }
  }

  renderList(store.state);
  renderForm();
  store.subscribe((state, scope) => {
    if (scope === 'zoom' || scope === 'selection' || scope === 'status') return;
    if (scope === 'text') {
      renderList(state);
      updateSelectOptions();
      return;
    }
    if (scope === 'document') resetDraft();
    else if (draft.editingId && !listMarks(state.song).some((m) => m.item.id === draft.editingId)) resetDraft();
    renderList(state);
    renderForm();
  });
}
