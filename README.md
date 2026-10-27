# Compás a compás

Interfaz compacta: acordes, posiciones, digitación y grados a mano; datos de canción y marcas musicales en paneles. [Capturas y comprobaciones](docs/diseno/editor-compacto/README.md).

Editor local de hojas de acordes de guitarra, organizado por compases. Permite preparar una canción, corregir sus tarjetas, guardar el proyecto editable en JSON y exportar una hoja HTML autónoma para imprimir o guardar como PDF desde el navegador.

Versión 0.8.0 ([CHANGELOG](CHANGELOG.md)). La evidencia de cada fase está en [docs/ESTADO.md](docs/ESTADO.md).

**Textos y tonalidades por posición:** [textos, títulos enmarcados, grado y tonalidad por voicing](docs/diseno/textos-y-tonalidades.md), según la plantilla aportada el 17/10/2026.

## Empezar

**Web en GitHub Pages:** [Abrir Compás a compás](https://a01653.github.io/Compas-a-compas/). Sin instalación ni servidor local. Consulta [acceso web y guardado](docs/WEB.md). La opción local sigue disponible:

Requiere Node.js 18 o superior. No hay dependencias que instalar.

**En Windows, doble clic en `Abrir-Compas.cmd`.** Arranca el servidor en esa ventana y abre el navegador en <http://127.0.0.1:5174>. Si la aplicación ya estaba en marcha, solo abre el navegador. Si el puerto 5174 lo usa otra aplicación, avisa y no cierra nada. La ventana es el servidor: cierra la ventana o pulsa Ctrl+C para detenerlo, y la aplicación deja de responder. Si falta Node.js, la ventana lo indica y espera una tecla.

**Opción manual:**

```text
npm start
```

Abre <http://127.0.0.1:5174>. Para otro puerto: `npm start -- --port 8080`. El servidor solo escucha en 127.0.0.1 y solo sirve archivos de la carpeta del proyecto. Los módulos JavaScript necesitan HTTP; no funciona abriendo `index.html` con `file://`.

Pruebas:

```text
npm test
```

## Guía de uso

### Compases y tarjetas

Cada dibujo se edita como una **tarjeta**, con nombre, calidad/color, digitación, grados, textos y tonalidad propios. El único selector recorre las tarjetas del compás. **Añadir tarjeta** crea otra y **Duplicar tarjeta** copia la elegida a continuación. El menú de tres puntos de la tarjeta permite copiarla, pegarla en otro compás o canción, sustituir solo la digitación por la copiada, cambiar su orden y quitarla.

Dos digitaciones del mismo acorde se escriben como dos tarjetas con ese nombre. Todos los campos son independientes: cambiar el nombre o la calidad de una tarjeta antigua no modifica las demás. Los JSON anteriores siguen abriendo y no se transforman al abrir o guardar sin editar.

**Compases:** selector y flechas para recorrerlos y + para añadir. El menú de tres puntos y el clic derecho sobre un compás de la hoja ofrecen insertar antes o después, copiar, cortar, pegar, sustituir, duplicar, subir, bajar, intercambiar y borrar, sobre un compás o sobre varios (Ctrl+clic, Mayús+clic o **Modo selección**). En la hoja, Ctrl+clic dentro de una tarjeta marca solo esa tarjeta, aunque estén salteadas; fuera de las tarjetas marca el compás entero. Las tarjetas marcadas se copian, cortan, pegan, sustituyen enteras o solo en su digitación, duplican y quitan desde su menú o con el clic derecho. Atajos fuera de los campos, sobre lo señalado: Ctrl+C, Ctrl+X, Ctrl+V, Alt+↑/↓ y Supr. Las copias reciben IDs nuevos, las marcas siguen a su compás sin redirigirse y cada acción se deshace en un paso. Las etiquetas numéricas se renumeran tras cada cambio, con aviso; la opción se desactiva por canción para conservar la numeración original. Antes de borrar se muestran las consecuencias para las marcas.

**Digitación:** seis valores de sexta a primera, `x` muda y `0` al aire. Formato compacto (`x35343`), con espacios (`x 10 12 10 11 10`) o compacto con letras para los trastes de 10 a 24 (`a` = 10 … `o` = 24): `xa9axa` equivale a `x 10 9 10 x 10`. El mástil parte de tres trastes y crece cuando hace falta, sin cambiar notas. Un intervalo de más de 32 trastes visibles se conserva con aviso y bloquea la salida hasta corregirlo.

Los seis grados de cuerda son opcionales y manuales. Colorean las notas y no se calculan desde el nombre del acorde.

### Colores

**Colores**, en la cabecera, configura el fondo de cada familia de acorde y el de las notas por grado. Incluye naturales, bemoles y sostenidos del 1 al 13, etiquetas personalizadas como `bb7` o `R` y notas sin grado. Se aplican a toda la canción, se guardan en su JSON y se conservan en HTML e impresión. Hay restauración individual y de la paleta completa. Texto y trazos se adaptan a fondos oscuros.

Los JSON anteriores siguen abriendo. Un JSON con el nuevo campo opcional `palette` necesita la aplicación 0.3.0 o posterior; las versiones antiguas lo rechazan para no perder los colores.

### Textos de la tarjeta

Digitación, grados y **Textos de la tarjeta** están siempre visibles, uno debajo de otro, sin pestañas. Los datos generales se abren pulsando el nombre de canción en la cabecera. **Exportar** agrupa HTML e impresión; el menú superior de tres puntos contiene **Nueva canción**.

**Título sobre compás** aparece enmarcado, por encima y fuera de la línea vertical del compás; empieza en la tarjeta donde se escribe y puede extenderse sobre las tarjetas siguientes del mismo compás hasta la próxima con título; **Anotación dentro** sigue bajo el nombre del acorde. Muestran el texto que realmente aparece, también en archivos anteriores con textos propios por posición. Dejar un campo vacío lo quita de esa tarjeta.

Los textos afectan únicamente a la tarjeta seleccionada. No hay un selector de alcance compartido.

### Grado y tonalidad de la tarjeta

**Grado de la tarjeta** coloca un texto manual como `V7/ii` arriba a la derecha, junto al nombre del acorde. Es independiente de los seis grados de las cuerdas.

**Tonalidad** y **Calidad de tonalidad** crean un cambio sobre esa tarjeta. Vacío mantiene la tonalidad y el color anteriores sin repetir la etiqueta, también entre compases y páginas. La banda tiene fondo tenue y línea inferior, con esquinas rectas como la plantilla. No hay barras de color bajo las tarjetas ni separadores de grupos. La calidad de la tonalidad usa la paleta de familias y es independiente de la calidad del acorde. Todos los campos afectan solo a la tarjeta seleccionada.

En datos de canción se elige la calidad del contexto general y se puede desmarcar **Mostrar tonalidades de las tarjetas** para ocultar todas las franjas sin borrar datos. La tonalidad general sigue junto al título de canción. Sin calidad elegida usa el color neutro de Otro; no se deduce del texto. Prueba [el nuevo ejemplo](examples/textos-tonalidades.json).

Los JSON anteriores siguen abriendo sin cambios. Los que contienen `voicingDegree`, `tonality`, `keyFamily` o `showTonalities` requieren 0.5.0 o posterior; las versiones anteriores rechazan esos campos para conservar la información.

### Deshacer y rehacer

Las dos flechas de la cabecera deshacen y rehacen textos, digitaciones, grados, colores, compases, acordes, posiciones y marcas musicales. También están en los diálogos de datos, marcas y colores. La escritura continua de un campo se agrupa hasta salir de él. Fuera de los campos, usa **Ctrl+Z** y **Ctrl+Y** o **Ctrl+Mayús+Z**; dentro, se conserva el deshacer habitual del navegador.

Guardar conserva el historial. Abrir, crear una canción o recuperar otra copia empieza uno nuevo; al recargar no se conserva el historial. La selección y el zoom no cuentan como cambios. Se retienen hasta 100 pasos con un presupuesto de tamaño; la última acción se conserva aunque lo supere. El JSON contiene la canción, sin el historial.

### Importar lista

Una línea por compás: `etiqueta | acorde @ digitación ; acorde @ digitación`. Otro voicing del mismo acorde se separa con ` / ` (con espacios) después de `@`, así que `C/E` sigue siendo un acorde con bajo. Se previsualiza y se añade al final solo si no hay errores; no hay importación parcial.

### Marcas y destinos

El botón **Marcas**, dentro del bloque Compás, abre **Marcas del compás seleccionado**: muestra las que se escriben allí y los tramos que lo incluyen. **Ver todas las marcas** permite revisar la canción completa. Las nuevas parten del compás activo y las guardadas conservan su ubicación al cambiar de selección. Desde este panel se añaden, editan y borran repeticiones ×N, casillas de una o varias pasadas, Segno, Coda, Fine y los siete saltos (D.C., D.S., To Coda y variantes). Compases y destinos se eligen por etiqueta legible. Un destino que ya no existe se conserva como pendiente y se avisa; nunca se redirige a otro compás. Las marcas se dibujan, pero la aplicación no expande ni valida el recorrido.

### Continuaciones

Un compás que no cabe en una fila pasa a la siguiente; si no cabe ni así, se parte entre tarjetas en fragmentos con la misma etiqueta y la marca «continuación». Inicio y fin de repetición solo aparecen en el primer y último fragmento; casillas y repeticiones se muestran como continuación al cruzar fila u hoja. Todas las tarjetas se conservan en orden.

### Guardar, exportar e imprimir

| Acción | Resultado |
| --- | --- |
| **Guardar JSON** | El proyecto editable completo. Es la única copia que permite seguir editando. Usa el selector de archivos del navegador si existe; si no, una descarga normal. Una canción abierta desde un archivo se guarda con el nombre de ese archivo; una nueva propone el título de la canción. |
| **Exportar HTML** | Un archivo único con las hojas, fuentes y estilos incluidos. Sin editor, sin JavaScript y sin peticiones externas; se abre sin conexión. No se puede volver a editar. El nombre propuesto es el título de la canción, como el del PDF. |
| **Imprimir / PDF** | Abre el diálogo de impresión del navegador sobre ese mismo HTML. Al guardar como PDF, el nombre propuesto es el título de la canción. No hay descarga de PDF nativa. |

- **Impresión A4:** en el diálogo elige «Guardar como PDF» (o la impresora), A4 horizontal, márgenes «Ninguno» y desactiva «Encabezados y pies de página». La hoja mide 297 × 210 mm con márgenes de 5 mm y `actual/total` arriba a la derecha. Ctrl+P sobre el editor no imprime la interfaz.
- Si hay referencias musicales pendientes, se muestran y se pide confirmar antes de exportar o imprimir.
- **Archivo:** Nuevo, Abrir JSON y Guardar JSON. Un archivo inválido o de otra versión se rechaza con errores legibles y la canción abierta queda intacta. Los campos desconocidos bloquean la apertura en vez de descartarse.
- **Versión del documento:** campo opcional de texto libre para tus revisiones. No es la versión de la aplicación ni la del formato del archivo; abrir un archivo no la modifica.
- **Cambios sin guardar:** el encabezado los indica y Nuevo y Abrir piden decidir.
- **Recuperación local:** los cambios pendientes se copian en `localStorage` del navegador y se ofrecen al volver a abrir la aplicación. Es una red de seguridad, no un guardado; se borra al guardar, abrir o crear una canción.

## Navegadores

Comprobado en Chromium. Firefox y Safari no se han probado. El diálogo de impresión nativo del sistema depende del navegador.

## Documentación

Manuales en PDF, con fuentes editables: [uso](docs/latex/Manual_Uso_Compas_a_compas.pdf), [instalación y arranque](docs/latex/Manual_Instalacion_Compas_a_compas.pdf) y [DTS](docs/latex/DTS_Compas_a_compas.pdf). El [índice de manuales](docs/manuals/README.md) explica cómo regenerarlos.

| Archivo | Contenido |
| --- | --- |
| [Manual de uso](docs/manuals/USO.md) | Primeros pasos, acordes y posiciones, marcas, guardado e impresión |
| [Instalación y arranque](docs/manuals/INSTALACION.md) | Doble clic en Windows, actualización y resolución de problemas |
| [DTS](docs/DTS.md) | Arquitectura, contrato JSON, geometría, paginación y evidencia técnica |
| [Requisitos](docs/REQUISITOS.md) | Funciones acordadas y límites de alcance |
| [Encargo: repetición, tarjetas y opciones de página](docs/encargos/repeticion-compas-y-ajustes-tarjetas.md) | Repeticiones de uno y dos compases, nombres vacíos, colores de grado, máximo de compases por línea, numeración y separadores opcionales, anchos por compás y controles tonales contextuales; mejoras de alineación en 0.7.1 |
| [Diseño](docs/DISENO.md) | Aplicación completa, tarjetas e impresión |
| [Modelo de datos](docs/DATOS.md) | Canción, compases, acordes, voicings y navegación musical |
| [Colores predeterminados](config/palette-defaults.json) | Fondos y textos de calidades, grados y notas cuando la canción no define los suyos (ver DATOS.md) |
| [Manual de uso (PDF)](docs/latex/Manual_Uso_Compas_a_compas.pdf) | Se llega desde el botón **Manual** de la aplicación, que abre una página de ayuda con el enlace |
| [Esquema JSON](schemas/song.schema.json) | Contrato para guardar canciones |
| [Ejemplo editable](examples/cancion-demo.json) | Datos de prueba; no es una transcripción de una obra |
| [Plan](docs/PLAN.md) | Fases, entregables y condiciones de cierre |
| [Validación](docs/VALIDACION.md) | Casos que debe superar la aplicación |
| [Estado](docs/ESTADO.md) | Estado actual y registro por fase |
| [Referencias](references/README.md) | Procedencia y diferencias frente a las plantillas |

Las instrucciones de trabajo y cierre están en [AGENTS.md](AGENTS.md) y el punto de entrada de Claude en [CLAUDE.md](CLAUDE.md). La publicación y sus validaciones se consultan en [GitHub Actions](https://github.com/a01653/Compas-a-compas/actions); la aplicación pública está en [GitHub Pages](https://a01653.github.io/Compas-a-compas/).

## Alcance

Sin OCR, reproducción de audio, teoría ni generación automática de acordes. La aplicación se puede abrir desde el lanzador local o en GitHub Pages. Las canciones se guardan en JSON y no se sincronizan entre dispositivos.


Los ejemplos de recorridos II–V–I Drop 2 están en [`examples/ii-v-i/`](examples/ii-v-i/). Incluyen cuatro rutas completas por archivo y el campo opcional `anchorFret`; requieren la aplicación 0.7.2 o posterior.
