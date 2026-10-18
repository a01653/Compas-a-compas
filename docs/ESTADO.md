# Estado de trabajo

## Versión 0.6.3: reparto estable con escala fraccionaria — 18/10/2026

El usuario aporta aplicación.html exportado con 0.6.2. Confirmado el reparto 1–3, 4–6, 7–9 y 10–12, en lugar de 1–4, 5–8 y 9–12 de la plantilla. Las 37 tarjetas, sus textos, IDs y SVG coinciden con la exportación de control; las reglas CSS son las mismas. La comprobación anterior al 100 % no cubría este caso.

Reproducción real con Chromium 153 y --force-device-scale-factor=1.25: el borde de tarjeta de 1.6 px se resuelve a 1.6 px frente a 1 px al 100 %. Cada compás de dos tarjetas mide 268 px frente a 266 px. Cuatro compases con las separaciones suman 1090 px y superan el ancho útil, por lo que el compás 4 pasa a la segunda fila y el 5 queda segundo.

Se reduce únicamente el relleno lateral de tarjeta de 6 a 5 px. El mismo fragmento mide 264 px al 125 % y cabe con holgura. No se modifica la geometría del mástil, la fuente de los textos, los datos musicales, el esquema JSON ni la regla adaptativa de reparto.

Validación mediante Abrir, Guardar JSON y Exportar HTML de la aplicación con los dos JSON completos: Chromium 153 al 100 %, 125 %, 150 % y 175 % en escritorio, y al 200 % en móvil 390×844; Chromium 130 al 125 % en escritorio. I Fall mantiene dos hojas, tres filas en la primera (1–4, 5–8 y 9–12) y dos en la segunda. Havana mantiene seis hojas. Datos guardados idénticos, 37 y 108 tarjetas en orden, SVG con las mismas dimensiones, sin recursos externos en HTML, sin recortes ni desniveles entre números y tarjetas. HTML autónomo y PDF A4 horizontal generados en esas comprobaciones. Primera hoja del PDF de I Fall revisada visualmente en PNG.

La prueba adicional de 24 compases y 86 tarjetas con textos largos, cuatro trastes, repeticiones, casilla y continuaciones vuelve a pasar sin pérdidas ni desbordamientos. Las 196 pruebas Node, el empaquetado de Pages y git diff --check pasan. No se ha probado el móvil físico del usuario ni Firefox, Safari o el diálogo nativo de impresión. Archivos: styles/sheet.css, package.json, index.html, README.md, CHANGELOG.md, docs/DISENO.md y este registro. Los archivos personales no se incorporan al repositorio.

## Versión 0.6.2: recuperar la tercera fila de I Fall — 18/10/2026

Revisión directa del repositorio, sin usar el conector local. Reproducido en Chromium 153 con el JSON aportado: la primera hoja contenía los compases 1–8 y el documento ocupaba tres páginas. Las tres primeras filas necesitaban 734,06 px frente a los 703,20 px disponibles bajo la cabecera. La alineación de 0.6.1 era correcta, pero el espacio vertical impedía colocar la tercera fila.

Se compactan los números de compás de 14 a 12 px, su separación inferior de 4 a 2 px, el espacio entre filas de 12 a 8 px y el de cabecera de 14 a 10 px. Se retira el margen inferior de 4 px de cada columna porque ya existe separación entre filas. Se conservan los márgenes de página de 5 mm, las fuentes de tarjeta, los textos y la geometría del mástil. No se impone un número fijo de filas: los contenidos altos siguen pasando a otra página.

Validación realizada sobre los dos JSON completos mediante los controles reales de la aplicación: I Fall tiene dos hojas, con tres filas (1–12) y dos filas (13–19), y conserva sus 37 tarjetas. Havana mantiene seis hojas y sus 108 tarjetas. Guardar JSON produce los mismos datos, IDs y orden que el archivo abierto. La exportación HTML coincide con la vista previa en tarjetas, dimensiones SVG, filas y numeración; no solicita recursos externos. Desnivel de 0 px entre números y tarjetas de cada fila y ningún elemento fuera de la página. PDF generado por Chromium: dos y seis páginas A4 horizontales, sin hoja vacía final; primera página de I Fall revisada visualmente en PNG.

Caso adicional: 24 compases, 40 tarjetas en el primero, 86 tarjetas en total, títulos y anotaciones de varias líneas, repeticiones, casilla, cuerdas al aire y cuatro trastes. Se conservan todas las tarjetas en nueve hojas, con seis continuaciones, sin errores de reparto, recortes ni solapamientos de filas. Primera hoja revisada visualmente. Las 196 pruebas Node pasan; el empaquetado de GitHub Pages y git diff --check pasan. No se han probado Firefox, Safari ni el diálogo nativo de impresión de Windows en esta revisión.

Archivos modificados: src/layout/spec.js, styles/sheet.css, package.json, index.html, README.md, CHANGELOG.md, docs/DISENO.md y este registro. Los JSON personales y los archivos de comprobación quedan fuera del repositorio.

## Versión 0.6.1: encuadre y alineación entre compases — 17/10/2026

El usuario aporta una captura y los JSON de I Fall in Love Too Easily y Havana. Reproducción en Chromium 153: un título como «Intro · Joe Pass», «Jim Hall» o «B · Tema» desplazaba solo su compás. El desnivel máximo era 31,56 px tanto en vista previa como en exportación.

Claude Sonnet, esfuerzo medium, corrige estilos, renderizador, medidor DOM y reparto. La rejilla se comparte a lo largo de toda la fila: marcas, títulos, tonalidades y zona del compás. Cada tarjeta conserva su ancho natural y participa en el reparto del espacio libre. El medidor informa de las pistas; la paginación suma sus máximos por fila para no infravalorar alturas complementarias de distintos compases. Sin cambios de esquema, digitaciones ni geometría del mástil.

Validación: 196 pruebas Node superadas en Windows mediante el conector, con seis pruebas nuevas de alturas combinadas, salto de página, compás vacío, continuaciones y compatibilidad del medidor. Chromium 153 en Linux con los dos JSON completos: guardado idéntico al original, mismas tarjetas e IDs en orden, desnivel de 0 px en bandas y bordes de tarjetas en todas las filas de vista previa y HTML. Se mantienen 3 páginas para los 19 compases de I Fall y 6 para los 78 de Havana. HTML autónomo sin peticiones externas y PDF A4 horizontal de todas las hojas revisado.

Casos adicionales: títulos y tonalidades de varias líneas, anotaciones altas en otro compás, franjas visibles y ocultas, compás vacío, repeticiones y casillas; sin solapamientos ni desbordamiento vertical. Caso extenso anterior de 40 tarjetas en un compás y 24 compases en total, continuaciones y trastes variables: correcto, con PDF de 6 hojas. No se incorporan los JSON personales al repositorio. Firefox, Safari e impresión nativa en Windows siguen pendientes; las comprobaciones visuales son en Linux.

## Versión 0.6.0: tarjetas independientes y bandas rectangulares — 17/10/2026

Claude Sonnet, esfuerzo medium, implementa el selector plano y la edición independiente en el worktree del PC. El supervisor incorpora el ajuste visual de la plantilla, revisa la integración y comprueba la interfaz. El formato sigue siendo esquema 1: no se migra al abrir o guardar. Cambiar nombre o calidad separa solo la tarjeta afectada; añadir, duplicar y quitar operan inmediatamente junto a la tarjeta activa.

La hoja elimina barras inferiores, separadores y contornos de grupos. Mantiene las barras de compás y las repeticiones. Las bandas tonales son rectangulares, con fondo tenue y línea inferior de 3 px; conservan herencia, calidad y paleta, con contraste mínimo de texto de 4,5:1.

Validación: 190 pruebas Node superadas en Windows mediante el conector. Chromium 153 en Linux: guardado de un JSON antiguo sin cambios; selector único; edición del nombre con foco y escritura continua; separación individual con IDs, orden y marcas conservados; deshacer/rehacer; textos, duplicar, añadir y quitar; tarjeta pendiente que solo se completa con digitación válida. Editor sin scroll interno con el ejemplo en 1440×900, 1366×768 y 1280×720; móvil 390×844 sin desbordamiento horizontal. Franjas y títulos alineados con textos de distinta altura. HTML autónomo sin peticiones externas, mismas etiquetas y colores; 40 tarjetas en un compás y 24 compases en total, con continuaciones y trastes variables. Impresión de 1 y 6 hojas A4 horizontal en Chromium sin interfaz. Sin errores JavaScript.

Manuales y DTS actualizados con capturas del editor de tarjetas. Firefox, Safari, impresión nativa y doble clic reales en Windows continúan pendientes. Las comprobaciones de navegador usan la copia de revisión en Linux; las pruebas Node se ejecutan en el worktree del PC. La carpeta principal de Windows se actualiza con git pull después de integrar en main.

## Versión 0.5.0: títulos, grado y tonalidad por posición — 17/10/2026

Implementación realizada con Claude Sonnet, esfuerzo medium, en el worktree aislado del PC; el supervisor revisa y valida una copia independiente antes de integrar. Se conservan los cambios aprobados de 0.4.1. La especificación de [textos y tonalidades por voicing](diseno/textos-y-tonalidades.md) pasa de pendiente a implementada.

La tonalidad general aparece a continuación del título. Los rótulos de tarjeta tienen recuadro y están por encima de la línea del compás; grado del voicing arriba a la derecha, sin cambiar los seis grados de cuerda. Cada posición admite tonalidad y calidad independientes de la del acorde. El contexto inicial usa la tonalidad general y su calidad, o Otro si falta. Vacío hereda el contexto y el color anteriores sin repetir etiqueta, cruzando compases y páginas en orden escrito. La casilla global oculta las franjas y conserva la tonalidad del título. No se infieren funciones ni se expanden repeticiones.

El esquema 1 incorpora los campos opcionales keyFamily, showTonalities, voicingDegree y tonality, con validación estricta. Los documentos anteriores se abren y guardan sin añadir esos campos. Los lectores anteriores rechazan los archivos con datos nuevos en vez de descartarlos. El historial, la recuperación, la duplicación y el orden conservan los valores. Títulos y franjas también seleccionan su posición al pulsarlos en la vista previa.

El renderizador usa tres filas compartidas mediante subgrid por fragmento: título, tonalidad y zona del compás. Revisión y corrección de un fallo inicial de anclaje inferior: una tarjeta con anotación/leyenda larga ya no sitúa el título de otra debajo del inicio de la línea. La medición, la vista previa y la exportación comparten esta composición. La geometría del mástil no cambia.

Validación: 171 pruebas Node superadas en Windows por el conector y 1751 casos de paridad manual/AJV en Linux. Chromium 153 en Linux: edición individual aunque el alcance de otros textos esté en todas; calidad preparada con campo vacío sin cambiar datos, herencia, borrar cambio, deshacer/rehacer, JSON, reapertura y recuperación. Títulos largos, anotaciones/leyendas de altura distinta, casillas y barras de repetición conservan alineación; cuatro trastes no se reducen. Prueba extensa con 40 posiciones en un compás y 24 compases en total, sin recortes ni errores JavaScript. HTML autónomo sin peticiones externas; etiquetas y color compartidos con vista previa, paleta oscura con contraste, franjas heredadas iguales y casilla global en exportación. Impresión en Chromium sin interfaz produce 1 y 6 hojas A4 horizontal, revisadas sin página vacía final. Regresión del historial y las marcas Coda/Fine superada.

Editor sin scroll interno con el ejemplo en 1440×900 (651/651), 1366×768 (573/573) y 1280×720 (525/525), valores de alto útil/alto de contenido. En 800×600 (406/499) usa desplazamiento interno; móvil 390×844 conserva todos los campos y no desborda horizontalmente. La captura de la vista previa en el PC confirma 0.5.0, los nuevos controles y cero errores JavaScript. El servidor de vista previa iniciado para esa captura se detiene después.

Manuales y DTS actualizados, con capturas nuevas, fuentes y PDF regenerados. Continúan pendientes Firefox, Safari y el diálogo de impresión nativo de Windows. Se necesita soporte CSS subgrid para la nueva composición.

## Registro original del encargo de textos y tonalidades — 17/10/2026

Petición documentada en [textos y tonalidades por voicing](diseno/textos-y-tonalidades.md), con revisión del archivo aportado `EJEMPLO.html` en Chromium. Incluye tonalidad junto al título de canción, rótulos enmarcados fuera de la línea del compás, grado propio del voicing y franjas de tonalidad con calidad, color heredado y visibilidad global. En ese momento se señalaron decisiones abiertas y quedó pendiente. La entrega 0.5.0 descrita arriba resuelve e implementa este encargo; 0.4.1 no contenía estas funciones.

## Versión 0.4.1: digitación, grados y textos sin pestañas — 17/10/2026

Claude trabaja en un worktree nuevo del PC desde main 0.4.0; se conserva el espacio antiguo con sus cambios. Se retiran la navegación de pestañas del editor de acordes y sus atributos ARIA asociados. Digitación/grados y los dos textos se muestran siempre en secciones apiladas con títulos discretos. Se mantienen el selector de alcance por posición y Deshacer/Rehacer. Las pestañas de Colores conservan sus reglas compartidas.

Validación final: 150 pruebas Node superadas en Windows mediante el conector. Chromium en Linux comprueba secciones siempre visibles, edición de textos, guardar/abrir, Deshacer/Rehacer, marcas, recuperación, colores, seis ventanas de escritorio y móvil, con 40 posiciones y 30 compases. El editor habitual cabe sin scroll en 1440×900, 1366×768 y 1280×720; en 800×600 necesita desplazamiento interno y conserva todos los campos. Sin desbordamiento horizontal ni scroll de página en escritorio. La captura del PC confirma 0.4.1 sin errores JavaScript. El HTML del ejemplo sin editar sigue idéntico al control anterior.

El desarrollo se ha realizado con Sonnet, esfuerzo medium. El supervisor revisa el diff, copia los archivos para comprobación independiente y mide el ajuste con Chromium. La versión se publica desde GitHub; no es necesario integrar cada paso intermedio en main para que Claude continúe en su rama.

## Versión 0.4.0: textos claros e historial de acciones — 17/10/2026

La pestaña de textos muestra solo Título sobre la tarjeta y Anotación dentro de la tarjeta, con el valor efectivo visible de cada posición. Se retiran los bloques de texto común y sobrescritura y el controlador ui/textOverride.js. El selector permite aplicar cada campo a esta posición o a todas las posiciones del acorde; la opción de todas retira las excepciones de ese campo, conservando el otro. Cambiar de posición vuelve a la edición individual. Los JSON anteriores conservan sus datos y se mantiene el esquema 1.

createStore registra los cambios de canción y restaura contenido y selección con Deshacer y Rehacer. Agrupa la escritura por campo, limita el historial a 100 pasos y un presupuesto de tamaño, conserva los pasos al guardar y los reinicia al abrir, crear o recuperar otra canción. Selección y zoom no crean pasos. No se serializa el historial. Hay botones en la cabecera y los diálogos de datos, marcas y colores. Los atajos operan fuera de campos y se respeta el deshacer nativo dentro de ellos. No actúan sobre confirmaciones ni importaciones pendientes.

Validación: 150 pruebas Node superadas. Chromium en Linux: texto propio visible frente a común, edición individual y conjunta, agrupación de escritura, deshacer/rehacer desde cabecera y diálogos, Coda/Fine añadida/editada/borrada/restaurada, IDs, selección, pendientes frente al último guardado, apertura, datos de canción, digitación válida e inválida, grados, paleta, teclado y recuperación tras recargar con historial vacío. La regresión adicional comprueba seis ventanas de escritorio, móvil, 40 posiciones y 30 compases. El HTML del ejemplo sin editar permanece idéntico al control anterior. No hay desplazamiento horizontal ni de página en escritorio. Sin errores JavaScript. No se declara revisión de Firefox, Safari ni impresión nativa de Windows.

Archivos: src/store.js, src/ui/history.js, src/ui/chord.js, src/model/song.js, suscripciones de datos/marcas/colores, iconos, cabecera, estilos, versión y pruebas de historial. Manuales y DTS actualizados con capturas y PDF. La geometría, el contrato JSON y el renderizador de hoja permanecen sin cambios.

## GitHub Pages publicado — 17/10/2026

GitHub confirma Pages activado. El propietario ha cambiado la visibilidad del repositorio a público. Reintentada la ejecución 39053339056: build y deploy completados correctamente, con URL confirmada por el trabajo de despliegue https://a01653.github.io/Compas-a-compas/. Aplicación 0.3.0, código sin cambios respecto a la revisión preparada. README.md y docs/WEB.md actualizados con el enlace definitivo y la configuración vigente. El arranque local mediante Abrir-Compas.cmd se conserva. No se ha realizado una nueva prueba de interacción en navegador sobre el sitio publicado.

## Preparación de GitHub Pages — 17/10/2026

El usuario solicita que el alojamiento sea GitHub Pages. Se añade .github/workflows/pages.yml con pruebas, empaquetado de archivos de ejecución y despliegue desde main; scripts/build-pages.mjs prepara _site/ con rutas relativas y sin documentación ni scripts locales. README.md y docs/WEB.md sustituyen el enlace principal de Sites por el procedimiento de GitHub Pages. El repositorio sigue privado. Pages todavía no está activado: requiere seleccionar GitHub Actions en Settings → Pages y disponer de un plan compatible. No se declara publicación correcta ni URL activa hasta comprobar el despliegue. El conector no ofrece la operación de administración para activarlo. Validación local: 138 pruebas Node superadas, paquete con 58 archivos, 128 referencias relativas sin destinos ausentes y sintaxis YAML comprobada. El contenido de ejecución coincide con el origen; el paquete excluye docs/ y scripts/.

## Acceso web público — 17/10/2026

Acceso de Sites cambiado a público por petición expresa del usuario. La política devuelta y una lectura posterior confirman `public`, revisión 2. Se conserva la misma URL, versión 0.3.0 y repositorio privado. README.md y docs/WEB.md actualizados para indicar que no hace falta iniciar sesión. Sin cambios de código ni nueva publicación de la aplicación.

## Acceso web privado — 17/10/2026

Aplicación 0.3.0 publicada en Sites: https://compas-a-compas.a01653.chatgpt.site. Despliegue confirmado como correcto por Sites. Los 57 archivos de ejecución coinciden con main en ed65dceb86d149572bd5444ff111574279650be8; 133 referencias de recursos comprobadas y 138 pruebas Node superadas. Sin cambios de código de aplicación ni de acceso al repositorio. No se realizó una nueva sesión de navegador sobre la URL publicada porque el navegador compatible con Sites no estaba disponible. GitHub y la publicación web se actualizan por separado. Enlace y procedimiento en README.md y docs/WEB.md.

## Versión 0.3.0: colores por familia y grado — 17/10/2026

Panel **Colores** añadido a la cabecera, con fondos para las seis familias, grados naturales, bemoles y sostenidos del 1 al 13, etiquetas personalizadas de hasta 32 caracteres y notas sin grado o sin color propio. Hay restauración individual y completa con confirmación. Los cambios se aplican a toda la canción y permanecen en su JSON, vista previa, HTML e impresión.

Campo opcional `palette` añadido al esquema 1 y al validador manual. Los JSON anteriores siguen abriendo y guardándose sin añadir datos por defecto; los archivos con paleta necesitan 0.3.0 o posterior. Solo se aceptan colores `#RRGGBB`, familias conocidas y etiquetas válidas; se rechazan campos desconocidos y claves reservadas. Los datos musicales permanecen separados de los colores. La paleta se pasa al renderizador compartido y adapta textos y trazos interiores a fondos oscuros sin cambiar los títulos exteriores ni las digitaciones.

Archivos: `src/model/palette.js`, `src/ui/colors.js`, pruebas de paleta, `src/model/{degrees,validate}.js`, `src/render/{card,sheet}.js`, `src/ui/{workspace,icons}.js`, `src/main.js`, `index.html`, `styles/workspace.css`, esquema, versión y documentación. Sin cambios en las referencias originales.

Validación: 138 pruebas Node superadas y 1685 casos de paridad manual/AJV con paleta. Chromium 153 en Linux: color por familia y grado, etiqueta bb7, JSON, reapertura y recuperación tras recargar, fondo oscuro con nombre y rejilla legibles, títulos exteriores intactos, colores en HTML y estilos de impresión, cancelar/restaurar, entrada hexadecimal inválida y panel en móvil. La regresión del editor pasa en seis tamaños de escritorio y 390×844, con 40 posiciones y 30 compases. El HTML del ejemplo sin paleta permanece idéntico al control anterior. No se declara prueba del diálogo de impresión nativo de Windows.

Manuales, DTS y capturas actualizados a 0.3.0. PDF regenerados y revisados; manifiestos SHA-256 y enlaces locales comprobados. Rama de implementación `feature/colores-acordes-grados`; entrega 0.3.0 validada para `main`.

## Versión 0.2.0: interfaz aprobada y marcas por compás — 17/10/2026

El usuario aprobó la propuesta y autorizó integrarla en `main`. Se conserva la rama `design/editor-sin-scroll` como origen del cambio. Sin creación de release, tag ni despliegue.

Acceso **Marcas** trasladado al bloque Compás. El panel lleva el compás activo en el título, muestra símbolos y saltos escritos allí y todos los tramos que lo incluyen. **Ver todas las marcas** mantiene la revisión global, con avisos pendientes siempre visibles. El selector del panel cambia también el compás del editor. Cambiar de compás prepara un borrador nuevo; no modifica marcas guardadas. Editar un tramo desde un compás intermedio conserva sus extremos. Cambiar solo de acorde o posición mantiene el borrador.

Archivos: `src/model/marksContext.js` y cuatro pruebas nuevas, `src/ui/{marks,measures,workspace}.js`, `src/main.js`, `index.html`, `styles/workspace.css`, `package.json`, README, CHANGELOG, manuales, DTS, generador y plantilla de PDF, capturas y esta ficha. Versión de aplicación 0.2.0; esquema JSON sigue en 1. El generador documental toma la versión de `package.json`.

Validación en Linux: 130 pruebas Node superadas. Chromium 153: seis tamaños de escritorio entre 800×600 y 1440×900 y móvil 390×844; JSON, notas, grados, textos, altas, duplicado, cancelación/borrado, 40 posiciones y 30 compases; sin errores JS. HTML exportado del ejemplo idéntico byte a byte al de `main` 0.1.3. Prueba específica del contexto: filtro local/global, extremos e interior, edición sin mover destinos, alta de salto al Coda y repetición desde el compás elegido, borrador conservado al cambiar de voicing y etiqueta visible actualizada. Los avisos y referencias pendientes se conservan.

Manual de uso, instalación y DTS regenerados con Pandoc/XeLaTeX para 0.2.0; capturas reales actualizadas. Validación documental: enlaces locales y manifiestos SHA-256, sin desbordamientos ni caracteres ausentes en LaTeX; PDF renderizados y revisados. Siguen pendientes Windows nativo y otros navegadores. La integración final se verifica leyendo la rama por defecto en GitHub.

## Propuesta de interfaz compacta — 17/10/2026

Rama `design/editor-sin-scroll`, desde `main` `e33d87c`. Propuesta solicitada por el usuario, pendiente de su revisión visual. Sin fusión en `main`, sin release ni despliegue. Aplicación 0.1.3; sin cambios de modelo, esquema, geometría de hoja ni exportador.

Implementación: dos columnas, navegación de compases por selector, edición de acorde y posición siempre a mano, pestañas de digitación/grados y textos, datos de canción y estructura en diálogos, operaciones secundarias en menús e iconos etiquetados. Archivos y evidencia en [la ficha de diseño](diseno/editor-compacto/README.md), con capturas a 1440×900 y 1280×720.

Comprobado en Chromium 153 sobre Linux: seis tamaños de escritorio, entrada de notas y grados sin perder foco, JSON, selección, textos personalizados, altas, duplicado y borrado de posición con cancelar/confirmar, diálogos y menús; 40 posiciones y 30 compases sin crecimiento vertical del editor; móvil a 390×844 sin desbordamiento horizontal. Editor habitual y posición vacía sin scroll a 1280×720 y 800×600. HTML exportado del ejemplo idéntico byte a byte a `main`; 126 pruebas Node pasan. Pendientes la aprobación visual y las comprobaciones nativas de Windows y otros navegadores. Los PDF no se regeneran para una propuesta aún no aceptada.

## Documentación de usuario y DTS — 17/10/2026

Preparada directamente por el supervisor, sin invocar Claude. Aplicación 0.1.3 sin cambios funcionales. Archivos: `docs/manuals/USO.md`, `INSTALACION.md` y `README.md`; `docs/DTS.md`; dos capturas en `docs/manuals/capturas`; `docs/latex/document-template.tex`; tres PDF con sus fuentes `.tex` y manifiestos `.build.json`; `scripts/build_docs.py`; enlaces y aclaración del intervalo de 32 trastes en README; registro en CHANGELOG.

El estilo sigue los manuales de Drop Route: portada azul con motivo de mástil, índice y tipografía editorial. Las capturas muestran la aplicación real 0.1.3 en Chromium 153 sobre Linux a 1440×960, con el ejemplo del repositorio. No se presentan como capturas de Windows.

Validación de esta entrega: construcción completa con Pandoc 3.1.3 y XeLaTeX, tres pasadas por documento; sin cajas desbordadas, glifos ausentes ni referencias sin resolver. PDF A4 vertical: uso 7 páginas, instalación 5 y DTS 10 (incluyen portada e índice). Todas las páginas renderizadas a PNG y revisadas; corregido el fondo de portada antes de la entrega. Enlaces locales, ejemplo JSON del DTS y SHA-256 de los manifiestos comprobados. No se repite la batería funcional por esta entrega documental; las 126 pruebas registradas debajo corresponden a la validación de producto anterior. Las comprobaciones nativas pendientes de Windows, Firefox y Safari permanecen pendientes.

---

Fecha: 16/10/2026. Especificación: 1.0. Versión de la aplicación: 0.1.3 (validado por el supervisor).

Parche 0.1.3 (proporciones de la plantilla; **validado por el supervisor**; Claude no ejecutó nada): `src/geometry/fretboard.js` (`GEOM.zone` 26, `GEOM.gap` 17; `cell` 28, `padTop` 10 y `padBottom` 18 sin cambio), `src/layout/spec.js` y fallback CSS (`GAPS.row` 12), `styles/sheet.css` (`.compas` padding-left 4; `.eventos` y `.evento` gap 4; `.evento` y `.tarjeta` `flex: 1 0 auto`; `.tarjeta` padding `3px 6px 4px`; `.mastil` `flex: none`; `.t-txt` 9px/1.1, `letter-spacing` .3px, `min-height` 15px), `src/render/card.js` (números de cuerda 1–6 en x 2, y = cuerda + 3.5, tamaño 11; líneas 1,3/1,5; puntos de radio 8; números de traste 10), `index.html`, `package.json`, README, CHANGELOG y `docs/DISENO.md`. Margen 5, columna 6 y cabecera 14 sin cambio. Objetivo medido por el supervisor en la plantilla: primera fila 128 × 161 px y rejilla de 3 trastes 84 × 85 px; con los textos de familia originales el prototipo del supervisor dio 128 × 161 px y 2 hojas (12 + 7 compases). Esas cifras son del prototipo, no de una comprobación mía. Las 3 hojas de la exportación anterior se debieron a los textos «Escala» y «Tiempos» que el supervisor añadió al primer JSON, no a textos del usuario; el JSON se corrige por separado y la aplicación no lo cambia. Validación del supervisor en Linux: 126 pruebas Node pasan; Chromium 153 importó JSON de 19 compases y 36 posiciones en 2 hojas (1–12 y 13–19); primeras 8 tarjetas 128×161 px, rejilla 3 trastes 84×85 px; JSON guardado idéntico, medidas app/exportación idénticas, sin recortes ni peticiones externas; páginas exportadas revisadas visualmente; JSON anterior con textos largos se conserva íntegro y crece de 3 a 4 y 8 trastes; 30 posiciones con continuaciones y repeticiones pasan. Windows real pendiente.

Lanzador de doble clic (sin cambio de versión): implementado, validado en Linux (Node y stubs); **doble clic real en Windows pendiente**; Claude no ejecutó nada. Archivos: `Abrir-Compas.cmd` (raíz, `cd /d "%~dp0"`, `where node.exe`, `node.exe scripts\launch.mjs`, `pause` solo en error), `scripts/launch.mjs` (helpers exportados `probeServer`, `waitForServer`, `openBrowser`, `main`; reutiliza el servidor si `GET /package.json` devuelve `name` `compas-a-compas`; puerto ocupado por otra cosa: mensaje y salida sin matar procesos; si no hay servidor, lanza `scripts/serve.mjs` con stdio heredado, espera HTTP hasta 10 s, abre el navegador con `rundll32.exe url.dll,FileProtocolHandler`), `.gitattributes` (`*.cmd` con CRLF) y README. Revisión posterior (sin ejecutar; pendiente de pruebas externas): `openBrowser` devuelve `Promise<boolean>` (resuelve en `spawn`/`error`, `unref` tras éxito); `main` espera la apertura y, si falla o lanza, indica la URL a mano; con servidor propio listo mantiene la consola aunque el navegador falle; si reutiliza un servidor y el navegador falla devuelve 1 (el `.cmd` hace `pause`); si el hijo ya terminó cuando el sondeo ve `compas` se trata como reutilización (salida 0); `try/finally` retira manejadores de señal y mata al hijo vivo; el punto de entrada captura errores; el `.cmd` usa `setlocal`, `title` y comprueba Node 18+ con `node.exe -e` antes de lanzar. Pendiente: doble clic real en Windows, Node ausente, puerto ocupado por otra aplicación.

Parche 0.1.2 (proporciones de hoja compartidas por vista previa, medición y exportación): implementado y validado supervisor. Cambios en `src/layout/spec.js` (margen 5 mm; separaciones columna 6, fila 18, cabecera 14 px), `src/geometry/fretboard.js` (traste 28 px, zona 22 px; `maxFrets` 32), `styles/sheet.css` (tipografías y alturas mínimas), `src/ui/exporter.js` (texto de márgenes), `index.html`, `package.json`, README, CHANGELOG, `docs/DISENO.md` y pruebas `tests/geometry.test.js` y `tests/layout-misc.test.js` (valores ajustados, sin pruebas nuevas). Sin cambios de modelo, esquema, controles ni scroll. Validación real del supervisor sobre la copia 0.1.2 (informe del supervisor; Claude no ejecutó comprobaciones): 126 pruebas Node pasan; Chromium 153 en Linux importó el JSON corregido de 19 compases y 36 posiciones en 2 hojas (1–12 y 13–19), con JSON guardado idéntico, dimensiones de vista previa y exportación idénticas, sin recortes ni peticiones externas; el JSON anterior con textos largos se conserva y crece de 3 a 4 y 8 trastes; 30 posiciones con continuaciones y repeticiones y el scroll a 8 resoluciones (360–1440) pasan. Llenado final de filas parciales (validado supervisor): `src/render/sheet.js` añade `flex-grow` proporcional a compases (`to - from`) y acordes (nº de tarjetas); `styles/sheet.css` pasa filas, eventos y tarjetas a `stretch`/`flex` con mástil centrado y pegado abajo (`margin-top: auto`), sin cambiar la geometría (28 px/traste). El medidor usa filas `max-content` sin crecer: las alturas medidas son conservadoras. Se retiró una aserción de holgura de `maxFrets` en `geometry.test.js` porque con el margen de 5 mm ya no es ajustada.

Parche 0.1.1 (UX del editor de acordes y scroll independiente en ancho ≥761 px): implementado en `src/ui/chord.js`, `src/ui/measures.js`, `src/ui/scrollRegions.js`, `src/render/sheet.js`, `index.html` y `styles/app.css`; sin cambios de modelo, esquema, paginación ni exportación.

Validación del parche 0.1.1 (realizada por el supervisor, según su informe; Claude no ejecutó comprobaciones):

- Node: 126 pruebas pasan.
- Chromium 153 en Linux, a 1440×900, 1280×720, 1181×600, 1180×600, 1024×768, 800×600, 761×600 y 360×800. La rueda sobre el editor mueve solo el editor: la posición superior del visor no cambia y `window.scrollY` es 0. Escribir grados conserva el foco, funciona PageDown con teclado y el último botón es accesible en móvil.
- Grupos de 2 acordes y de 2+1 posiciones claros. Añadir posición suma solo al acorde seleccionado; añadir acorde crea un grupo. Contadores, foco, selección desde la hoja y JSON intactos.
- HTML exportado de control idéntico byte a byte al original 0.1.0: las guías del editor no afectan al papel.
- Aviso de 99 trastes: ocultaba el visor a 800×600. Corregido en `styles/app.css` (`warn-vista` con `max-height: min(22vh, 130px)` y scroll propio); validado a 1440, 800 y 761×600, con exportación bloqueada y diálogo cerrable.
- Captura en Windows: no se declara todavía; falta la captura final.

Accesibilidad: el `aria-label` de `.posiciones` se actualiza al cambiar el nombre del acorde, sin reconstruir inputs (`src/ui/chord.js`). Implementado; el supervisor dará la última prueba.

## Estado actual

| Fase | Estado |
| --- | --- |
| 0. Propuesta de interfaz | Validada por el supervisor |
| 1. Edición y persistencia | Validada por el supervisor |
| 2. Mástil, tarjetas y grados | Validada por el supervisor |
| 3. Estructura musical | Validada por el supervisor |
| 4. Paginación y exportación | Validada por el supervisor |
| 5. Cierre y guía de uso | Validada por el supervisor |

La aplicación edita canciones por compases, guarda y abre JSON, pagina en hojas A4 apaisadas, exporta HTML autónomo e imprime desde el navegador. Se sirve con `npm start` (127.0.0.1:5174 por defecto, `--port` para otro).


**Limitaciones conocidas:** Firefox y Safari no probados; el diálogo de impresión nativo del sistema no está automatizado; sin deshacer, OCR, reproducción, teoría o generación de acordes ni alojamiento.

## Evidencia del supervisor (fases 0 a 4)

Aportada por el supervisor; quien implementó no tenía terminal ni navegador y no la ha repetido.

- Node 24: `npm test` con 126 pruebas superadas.
- Validador manual contra AJV 2020: 1575 casos de paridad.
- Chromium 153 en Linux: sin errores JS. Capturas a 1440 y 390 px generadas por conector; también ancho 360, 430, 1280 px en pruebas de navegador.
- Navegador: CRUD, JSON corrupto, versión, IDs, destinos, listas, recuperación, textos por voicing, grados, geometría, etiquetas, foco y móvil.
- Paginación: 24 compases × 2 tarjetas = 6 páginas; 48 × 2 = 12; un compás con 45 voicings = 5 páginas, con todas las tarjetas conservadas.
- HTML exportado (72 tarjetas, 6 páginas): abierto por `file://` sin conexión, fuentes incluidas, sin HTTP, sin JS, sin selección; `<script>` y `</title>` en textos escapados.
- PDF en Chromium headless de 1, 2, 3 y 6 hojas: el conteo coincide con la vista, sin hoja final vacía, A4 apaisado 841,92 × 594,96 pt; seis páginas revisadas en PNG.
- Continuaciones multipliego: Segno, Coda y barras de primer/último fragmento sin duplicados. Títulos largos ajustados.
- Exportación bloqueada con 99 trastes y datos intactos; destino pendiente con confirmar/cancelar; exportar tras editar usa el último título.
- Imprimir abre el marco y llama a `print` (comprobado con un stub); el diálogo nativo no se automatizó.
- Diferencia de 4 px entre títulos de la app y de la exportación, corregida con un reinicio de `box-sizing` en el CSS compartido; la comparación de 72 tarjetas se repitió y las medidas son idénticas.
- Las pruebas de navegador independientes se ejecutaron sobre una copia exacta de la revisión. No se ejecutó `run_check` (checks del conector vacíos).

## Registro por fase

### Fase 0: propuesta de interfaz

Cabecera con icono, datos de canción, lista de compases, edición de acorde y digitación con vista previa, hoja A4 con zoom, fuentes locales y adaptación a 390 px. Archivos principales: `index.html`, `assets/icon.svg`, `styles/`, `src/main.js`, `src/store.js`, `src/model/frets.js`, `src/geometry/fretboard.js`, `src/render/`, `src/ui/`. `frets.js` ya no admite punto ni guion como separadores. Validada con capturas a 1440 y 390 px sin errores JS.

### Fase 1: edición y persistencia

Alta, inserción, duplicado, movimiento y borrado de compases con IDs estables; varios acordes y voicings; textos heredados, personalizados u ocultos; validación de forma y `schemaVersion` 1; Nuevo, Abrir y Guardar JSON; cambios pendientes y recuperación en `localStorage`; importación por lista todo o nada. Archivos nuevos: `src/model/{ids,song,structure,validate,serialize,listImport}.js`, `src/persist/recovery.js`, `src/ui/{dialog,notify,textOverride,file,importList}.js`, `tests/`. Los campos desconocidos bloquean la apertura. Validada: 45 pruebas Node, 1575 casos de paridad con AJV y Chromium 153.

### Fase 2: mástil, tarjetas y grados

Seis grados manuales opcionales con los colores de la plantilla, también en cuerdas al aire; geometría con mínimo de tres trastes y crecimiento; por encima de 32 trastes (`GEOM.maxFrets`) la tarjeta avisa y los datos se conservan. Leyenda de grados abreviados bajo el mástil. Archivos: `src/model/degrees.js`, `src/geometry/fretboard.js`, `src/render/card.js`, `tests/{geometry,degrees,frets}.test.js`. Validada: 76 pruebas Node y navegador (leyenda, cuerda al aire, herencia sin perder foco, 16 trastes, aviso con 99).

### Fase 3: estructura musical

Alta, edición y borrado de repeticiones, casillas, Segno, Coda, Fine y siete saltos; destinos por etiqueta, referencias pendientes conservadas con aviso, consecuencias al borrar, IDs de marcas borradas no reutilizados. Dibujo en la hoja (SVG de Segno y Coda, barras, ×N, corchetes). Archivos: `src/model/{marks,marksProjection}.js`, `src/render/marks.js`, `src/ui/marks.js`, `tests/marks*.test.js`. Validada: 97 pruebas Node y Chromium 153.

### Fase 4: paginación y exportación

Un renderizador único para medir, mostrar y exportar; reparto puro en filas y hojas A4 (297 × 210 mm, márgenes de 10 mm); fragmentos con continuación; bloqueo de exportación con más de 32 trastes o piezas que no caben; Exportar HTML autónomo; Imprimir / PDF desde un marco oculto con guía de ajustes; aviso de referencias pendientes. Archivos: `src/layout/`, `src/export/document.js`, `src/ui/{paginator,exporter,preview}.js`, `src/render/sheet.js`, `styles/{tokens,export,sheet,app}.css`, `tests/`. Validada con la evidencia de arriba (126 pruebas, exportación y PDF reales).

### Fase 5: cierre y guía de uso

Fecha 16/10/2026. Versión 0.1.0 en `package.json` e `index.html` (se retira «Prototipo · fase 4»); `CHANGELOG.md`; `scripts/serve.mjs` (Node sin dependencias, 127.0.0.1:5174, `--port`, rutas confinadas a la raíz, MIME de HTML/JS/CSS/JSON/SVG, errores 400/403/404/405, HEAD) y `npm start`; campo opcional «Versión del documento» en `src/ui/song.js`, que solo escribe al teclear; README como guía de uso. Validada: servidor arranca, puertos rechazados, URL malformada retorna 400 sin cerrar, GET posterior 200; navegador muestra 0.1.0, f-version edita/guarda, JSON carga sin documentVersion, voicing y selección de tarjeta correctos, cero errores JS; `npm test` 126 pruebas.

Lanzador de doble clic (sin cambio de versión): implementado. Archivos: `Abrir-Compas.cmd` (raíz, `cd /d "%~dp0"`, `where node.exe`, `node.exe scripts\launch.mjs`, `pause` solo en error), `scripts/launch.mjs` (helpers exportados `probeServer`, `waitForServer`, `openBrowser`, `main`; reutiliza el servidor si `GET /package.json` devuelve `name` `compas-a-compas`; puerto ocupado por otra cosa: mensaje y salida sin matar procesos; si no hay servidor, lanza `scripts/serve.mjs` con stdio heredado, espera HTTP hasta 10 s, abre el navegador con `rundll32.exe url.dll,FileProtocolHandler`), `.gitattributes` (`*.cmd` con CRLF) y README. Validación del supervisor: Node `--check` correcto en copia exacta en Linux; sondeo HTTP (app correcta, otra app, puerto libre, JSON inválido, timeout, abort); spawn navegador Windows con EventEmitter (stub éxito/error asíncrono); arranque real del servidor y segundo llamador sin crear segundo servidor; Ctrl+C retira manejadores de señal y servidor propio queda en 5174 libre. Pendiente: doble clic real en Windows, Node ausente o antiguo, CRLF en Windows, cierre de ventana sin procesos huérfanos.
