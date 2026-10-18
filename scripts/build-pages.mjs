// Prepara únicamente los archivos que ejecuta la aplicación en GitHub Pages.
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const output = new URL('_site/', root);
await rm(output, { recursive: true, force: true });
await mkdir(new URL('references/', output), { recursive: true });
for (const path of ['index.html', 'src', 'styles', 'assets', 'examples', 'config', 'references/fonts.css', 'docs/latex/Manual_Uso_Compas_a_compas.pdf']) {
  await cp(new URL(path, root), new URL(path, output), { recursive: true });
}
await writeFile(new URL('.nojekyll', output), '');
console.log('Aplicación lista en ' + fileURLToPath(output));
