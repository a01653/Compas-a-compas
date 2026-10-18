// Precarga de las pruebas: instala los colores predeterminados del fichero real, como hace la aplicación al iniciarse.
import { readFileSync } from 'node:fs';
import { installPaletteDefaults } from '../src/model/paletteDefaults.js';

installPaletteDefaults(JSON.parse(readFileSync(new URL('../config/palette-defaults.json', import.meta.url), 'utf8')));
