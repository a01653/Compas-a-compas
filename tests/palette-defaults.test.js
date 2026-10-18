import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  PaletteDefaultsError, installPaletteDefaults, loadPaletteDefaults, paletteDefaults, validatePaletteDefaults,
} from '../src/model/paletteDefaults.js';
import {
  defaultDegreeColor, familyBackground, mutedColor, familyStyle, foreground, neutralNote, paletteDegreeColor, paletteFamilyStyle, tonalityBandStyle,
} from '../src/model/palette.js';
import { createEmptySong } from '../src/model/song.js';
import { parseSongJson, serializeSong } from '../src/model/serialize.js';
import { clone, loadDemo } from './helpers.js';

const CONFIG_URL = new URL('../config/palette-defaults.json', import.meta.url);
const readConfig = () => JSON.parse(readFileSync(CONFIG_URL, 'utf8'));

/** Instala unos valores distintos durante la prueba y deja instalados los del fichero real al terminar. */
function withDefaults(mutate, run) {
  const data = readConfig();
  mutate(data);
  installPaletteDefaults(data);
  try { run(data); } finally { installPaletteDefaults(readConfig()); }
}

test('el fichero config/palette-defaults.json es válido y es lo que la aplicación usa', () => {
  assert.deepEqual(validatePaletteDefaults(readConfig()), []);
  assert.deepEqual(paletteDefaults(), readConfig());
});

test('los valores del fichero se aplican: calidades, grados, notas, tinta y contraste', () => {
  withDefaults((d) => {
    d.ink = '#101010';
    d.muted = '#303132';
    d.families.major = { bg: '#aabbcc', bd: '#112233', accent: '#445566' };
    d.degrees['1'] = { bg: '#010203', fg: '#fefefe' };
    d.degrees.b7 = { bg: '#0a0b0c', fg: '#0d0e0f' };
    d.naturalDegrees['6'] = '1';
    d.note = { bg: '#202122', text: '#232425', textOnCustomBg: '#262728' };
    d.text = { default: '#eeeeee', light: '#dddddd', fallback: '#111111' };
  }, () => {
    assert.equal(mutedColor(), '#303132');
    assert.equal(familyBackground('major'), '#aabbcc');
    assert.equal(familyStyle('major'), '--fam-bg:#aabbcc;--fam-bd:#112233');
    assert.equal(paletteFamilyStyle('major', undefined), familyStyle('major'));
    assert.match(tonalityBandStyle('major', undefined), /--tonal-color:#445566/);
    assert.deepEqual(paletteDegreeColor('1', {}), { bg: '#010203', fg: '#fefefe' });
    assert.deepEqual(defaultDegreeColor('b7'), { bg: '#0a0b0c', fg: '#0d0e0f' });
    assert.deepEqual(defaultDegreeColor('6'), { bg: '#010203', fg: '#fefefe' }, 'los naturales siguen naturalDegrees');
    assert.deepEqual(neutralNote({}), { bg: '#202122', fg: '#232425' });
    assert.deepEqual(neutralNote({ note: '#123456' }), { bg: '#123456', fg: '#262728' });
    // Sin texto propio, un fondo personalizado usa el texto predeterminado del fichero.
    assert.deepEqual(paletteDegreeColor('bb7', { degrees: { bb7: '#445566' } }), { bg: '#445566', fg: '#eeeeee' });
    assert.equal(foreground('#000000'), '#dddddd');
    assert.equal(foreground('#ffffff'), '#101010');
  });
  assert.equal(familyBackground('major'), '#eaf4fe', 'restaurado');
});

test('la paleta de un JSON manda sobre el fichero y no se modifica al cargar ni guardar', () => {
  const song = clone(loadDemo());
  song.palette = {
    families: { major: '#123456' },
    degrees: { '1': '#abcdef', b7: '#fedcba', R: '#445566' },
    degreeText: { '1': '#000000', R: '#ffffff' },
    note: '#14183a',
    noteText: '#ffffff',
  };
  const text = serializeSong(song);
  const parsed = parseSongJson(text);
  assert.equal(parsed.ok, true);
  assert.equal(serializeSong(parsed.song), text, 'abrir y guardar no cambia la paleta del archivo');
  withDefaults((d) => { d.families.major.bg = '#777777'; d.degrees['1'] = { bg: '#888888', fg: '#999999' }; d.note.bg = '#aaaaaa'; }, () => {
    const palette = parsed.song.palette;
    assert.equal(familyBackground('major', palette), '#123456');
    assert.deepEqual(paletteDegreeColor('1', palette), { bg: '#abcdef', fg: '#000000' });
    assert.deepEqual(paletteDegreeColor('b7', palette), { bg: '#fedcba', fg: '#ffffff' });
    assert.deepEqual(paletteDegreeColor('R', palette), { bg: '#445566', fg: '#ffffff' });
    assert.deepEqual(neutralNote(palette), { bg: '#14183a', fg: '#ffffff' });
    assert.equal(familyBackground('minor', palette), '#efeafc', 'lo no personalizado usa el fichero');
    assert.equal(serializeSong(parsed.song), text, 'usar los valores del fichero no escribe nada en la canción');
  });
});

test('documentos nuevos y sin paleta usan el fichero sin copiarlo al JSON', () => {
  const fresh = createEmptySong();
  assert.equal('palette' in fresh, false);
  const saved = serializeSong(fresh);
  assert.doesNotMatch(saved, /palette/);
  withDefaults((d) => { d.note.bg = '#334455'; }, () => {
    assert.equal(neutralNote(fresh.palette).bg, '#334455');
    assert.equal(serializeSong(fresh), saved);
    const reopened = parseSongJson(saved).song;
    assert.equal('palette' in reopened, false);
  });
});

test('validación: errores claros con la ruta del valor incorrecto', () => {
  const bad = (mutate) => { const d = readConfig(); mutate(d); return validatePaletteDefaults(d).join(' | '); };
  assert.match(bad((d) => { d.ink = 'negro'; }), /ink debe ser un color #RRGGBB/);
  assert.match(bad((d) => { d.muted = 'gris'; }), /muted debe ser un color #RRGGBB/);
  assert.match(bad((d) => { delete d.muted; }), /muted/);
  assert.match(bad((d) => { d.note.bg = '#12345'; }), /note\.bg debe ser un color/);
  assert.match(bad((d) => { delete d.families.minor; }), /families\.minor: falta/);
  assert.match(bad((d) => { d.families.major.bd = 7; }), /families\.major\.bd debe ser un color/);
  assert.match(bad((d) => { d.families.alien = d.families.major; }), /families\.alien: campo desconocido/);
  assert.match(bad((d) => { d.degrees['1'].fg = 'white'; }), /degrees\.1\.fg debe ser un color/);
  assert.match(bad((d) => { delete d.degrees['1']; }), /naturalDegrees\.1 debe nombrar un grado definido/);
  assert.match(bad((d) => { d.naturalDegrees['4'] = 'zz'; }), /naturalDegrees\.4/);
  assert.match(bad((d) => { delete d.naturalDegrees['13']; }), /naturalDegrees\.13: falta/);
  assert.match(bad((d) => { d.version = 2; }), /version debe ser 1/);
  assert.match(bad((d) => { d.extra = 1; }), /raíz\.extra: campo desconocido/);
  assert.match(bad((d) => { delete d.text; }), /text/);
  assert.match(bad((d) => { d.degrees = []; }), /degrees/);
  assert.deepEqual(validatePaletteDefaults(null), ['el archivo debe contener un objeto JSON']);
  assert.ok(validatePaletteDefaults(JSON.parse('{"__proto__": 1}')).length);
  const broken = readConfig(); broken.ink = 'x';
  assert.throws(() => installPaletteDefaults(broken), (error) => error instanceof PaletteDefaultsError && /config\/palette-defaults\.json/.test(error.message) && /ink/.test(error.message));
  assert.deepEqual(paletteDefaults(), readConfig(), 'un fichero incorrecto no sustituye al instalado');
});

test('carga: archivo ausente, ilegible o con JSON roto dan un error comprensible', async () => {
  const realFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('', { status: 404 });
    await assert.rejects(loadPaletteDefaults(), /no se encuentra el archivo \(HTTP 404\)/);
    globalThis.fetch = async () => new Response('{ no json', { status: 200 });
    await assert.rejects(loadPaletteDefaults(), /no es un JSON válido/);
    globalThis.fetch = async () => { throw new TypeError('red caída'); };
    await assert.rejects(loadPaletteDefaults(), /no se pudo leer el archivo \(red caída\)/);
    globalThis.fetch = async () => new Response(JSON.stringify({ version: 1 }), { status: 200 });
    await assert.rejects(loadPaletteDefaults(), (error) => error instanceof PaletteDefaultsError && error.problems.length > 3);
    globalThis.fetch = async () => new Response(readFileSync(CONFIG_URL, 'utf8'), { status: 200 });
    assert.deepEqual(await loadPaletteDefaults(), readConfig());
  } finally {
    globalThis.fetch = realFetch;
    installPaletteDefaults(readConfig());
  }
});

test('sin cargar los valores, usar la paleta falla con un mensaje claro', () => {
  const modulePath = fileURLToPath(new URL('../src/model/palette.js', import.meta.url));
  const result = spawnSync(process.execPath, ['--input-type=module', '-e',
    `import('file://${modulePath.replace(/\\/g, '/')}').then(m => { try { m.neutralNote({}); console.log('SIN ERROR'); } catch (e) { console.log(e.message); } })`], { encoding: 'utf8' });
  assert.match(result.stdout, /no están cargados.*config\/palette-defaults\.json/);
});

test('los valores predeterminados no se duplican en el código', () => {
  const config = readConfig();
  const colors = new Set();
  const collect = (value) => {
    if (typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)) colors.add(value.toLowerCase());
    else if (value && typeof value === 'object') Object.values(value).forEach(collect);
  };
  collect(config);
  // Blanco y negro puros son los extremos del cálculo de contraste y de las mezclas, no valores de la paleta.
  colors.delete('#ffffff'); colors.delete('#000000');
  const offenders = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = `${dir}/${name}`;
      if (statSync(path).isDirectory()) walk(path);
      else if (name.endsWith('.js')) {
        const source = readFileSync(path, 'utf8').toLowerCase();
        for (const color of colors) if (source.includes(color)) offenders.push(`${path}: ${color}`);
      }
    }
  };
  walk(fileURLToPath(new URL('../src', import.meta.url)));
  assert.deepEqual(offenders, []);
});
