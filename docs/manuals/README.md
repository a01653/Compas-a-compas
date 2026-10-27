# Manuales y DTS

Documentación de Compás a compás **0.9.0**, edición **27/10/2026**, organizada por tareas y pasos de uso, con capturas explicadas, fuentes editables e índice común.

| Documento | PDF | Fuente |
| --- | --- | --- |
| Manual de uso | [Abrir PDF](../latex/Manual_Uso_Compas_a_compas.pdf) | [USO.md](USO.md) |
| Instalación y arranque | [Abrir PDF](../latex/Manual_Instalacion_Compas_a_compas.pdf) | [INSTALACION.md](INSTALACION.md) |
| Diseño técnico del software (DTS) | [Abrir PDF](../latex/DTS_Compas_a_compas.pdf) | [DTS.md](../DTS.md) |

Los PDF y las fuentes también se pueden consultar sin arrancar la aplicación. Descargar o abrir un PDF desde GitHub puede requerir acceso al repositorio.

## Regenerar los documentos

Solo para mantener la documentación: Python **3.10+**, Pandoc **3.x** y una distribución TeX con LuaLaTeX o XeLaTeX y los paquetes del archivo `docs/latex/document-template.tex`. La plantilla usa TeX Gyre Pagella, Heros y Cursor, con alternativas Nimbus/P052.

Desde la raíz del repositorio:

```text
python scripts/build_docs.py
```

Para elegir motor:

```text
python scripts/build_docs.py --engine xelatex
```

El modo automático prefiere LuaLaTeX si tiene disponible su cargador de fuentes; en otro caso usa XeLaTeX. Pandoc convierte el Markdown y el motor LaTeX se ejecuta tres veces para resolver índice y referencias. La construcción rechaza desbordamientos, caracteres ausentes y referencias sin resolver.

Cada documento genera en `docs/latex` un PDF, un `.tex` y un manifiesto `.build.json` con SHA-256 de fuentes, plantilla, generador, capturas y salidas. El manifiesto identifica la construcción; no exige que dos motores produzcan PDF idénticos byte a byte. No se guardan archivos auxiliares de TeX en el repositorio.

Editar primero el Markdown. Después regenerar y revisar visualmente todas las páginas, además de los mensajes de construcción. Los PDF son entregables generados, no fuentes de edición.

## Capturas

Las capturas de `capturas/` corresponden a la aplicación 0.7.0 real (18/10/2026), tomadas con Microsoft Edge sin cabeza sobre Windows, con ventana de 1440 × 960 px y escala de dispositivo 1,5, sirviendo la carpeta del proyecto en local. La 0.7.1 solo cambia la alineación de las filas ajustadas, así que las capturas de controles siguen representando la interfaz; no muestran esa mejora de maquetación. Se abrió `examples/cancion-demo.json` (y `examples/textos-tonalidades.json` para `textos-deshacer.png`), se esperó a las fuentes y a la paginación y se recortó cada diálogo o panel a su caja. Muestran el botón **Manual**, los botones de repetir uno y dos compases, las opciones de página, el menú del compás con su ancho y los grados con fondo y texto independientes. Se conservan los estilos reales de la aplicación. `editor-general.png`, `editor-posiciones.png` y `textos-deshacer.png` se retomaron con la 0.7.4 (26/10/2026) con el mismo procedimiento, abriendo el JSON por el selector de archivo de la aplicación y ocultando el aviso «Abierto…»: muestran el campo **Título sobre compás** y el traste de referencia; `editor-posiciones.png` se recorta ahora al final de los grados.

No son capturas de Windows ni acreditan la validación nativa del lanzador o del diálogo de impresión. Al cambiar controles, textos o distribución, actualizar las capturas antes de reconstruir el manual.

La captura textos-deshacer.png usa examples/textos-tonalidades.json, con ocho posiciones, títulos enmarcados, grados y cambios de tonalidad. No es una transcripción de la obra que sirve de referencia visual.

Capturas de 0.9.0 (27/10/2026), con el mismo procedimiento (Edge sin cabeza en Windows, ventana de 1440 × 960 px, escala 1,5, servidor local): `editor-general.png` muestra ahora la hoja de ejemplo con que arranca la aplicación y la cabecera con **Nuevo** y **Ejemplos**; `opciones-compas.png` y `menu-contextual.png` se retomaron con **Salto de línea antes**, abriendo `examples/cancion-demo.json` desde **Ejemplos** (clic derecho sobre el compás 2, como antes); `textos-deshacer.png` se retomó por la cabecera y la versión del pie. Nuevas: `menu-ejemplos.png` (menú Ejemplos abierto, recortado a la barra de archivo; retomada al añadir el catálogo de voicings Drop, con ocho entradas), `salto-linea.png` (hoja de ejemplo tras **Salto de línea antes** en el compás 3) e `intercambiar-tarjetas.png` (Dm7 del compás 1 y Cmaj7 del compás 4 marcadas con Ctrl+clic y su menú contextual).

## Botón Manual de la aplicación

La barra superior de la aplicación incluye un botón **Manual** (icono de libro) que abre la página `ayuda/index.html` en otra pestaña mediante una ruta relativa, por lo que funciona en local y bajo la URL de GitHub Pages. La página resume el uso y enlaza con `docs/latex/Manual_Uso_Compas_a_compas.pdf` (en lugar de enlazar directamente al PDF, que algunos navegadores descargan sin mostrar). `scripts/build-pages.mjs` copia la carpeta `ayuda/` y el PDF a `_site/`. El botón no forma parte de las hojas: no aparece en los HTML ni en los PDF exportados. Tras cambiar `USO.md` hay que regenerar el PDF (`python scripts/build_docs.py`) para que la aplicación publique el manual actualizado.

Con Pandoc 3.2 o posterior la plantilla define `\pandocbounded` (`document-template.tex`); con versiones anteriores la definición no cambia nada.

Capturas de 0.8.0 (27/10/2026), con el mismo procedimiento (Edge sin cabeza en Windows, ventana de 1440 × 960 px, escala 1,5, `examples/cancion-demo.json` servido en local): `editor-general.png`, `editor-posiciones.png` y `opciones-compas.png` se retomaron porque cambian la fila de tarjetas y el menú del compás; `textos-deshacer.png` se retomó abriendo `examples/textos-tonalidades.json` por el selector de archivo. Nuevas: `menu-tarjeta.png` (opciones de la tarjeta Cm7 del compás 1, tras copiar con Ctrl+C la tarjeta E5 del compás 3 para que se vean activas las opciones de pegar y sustituir), `menu-contextual.png` (clic derecho sobre el compás 2), `seleccion-compases.png` (modo selección con los compases 2 y 3 marcados), `seleccion-tarjetas.png` (tras pegar una copia de F7 al final del compás 2, la primera y la tercera tarjeta marcadas con Ctrl+clic; recortada al principio del compás 3) y `aviso-corregir.png` (aviso tras convertir el compás 4 en repetición del anterior y subir el compás 3 con Alt+↑; ventana de 1440 × 560 px para que el aviso y la fila quepan juntos). `seleccion-compases.png` se recorta al final del compás 3. En 0.8.1 se retomaron `editor-general.png`, `editor-posiciones.png` y `textos-deshacer.png` por la ayuda nueva del campo de digitación y la versión del pie.
