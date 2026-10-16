# Compás a compás

Editor local de hojas de acordes de guitarra, organizado por compases. Permite preparar canciones, corregir sus tarjetas, guardar el proyecto editable en JSON y exportar una hoja HTML autónoma para imprimir o guardar como PDF desde el navegador.

**Estado: fases 0 a 3 validadas por el supervisor; fase 4 (paginación y exportación) implementada, pendiente de validación.** Ver [docs/ESTADO.md](docs/ESTADO.md) para la evidencia real de cada fase.

## Abrir la aplicación

Los módulos JavaScript y la carga del ejemplo necesitan HTTP; no funciona con `file://`. No hay dependencias que instalar.

- Con el servidor local del conector: <http://127.0.0.1:5174>.
- Tras clonar el repositorio, desde su carpeta raíz (requiere Python 3):

```text
python -m http.server 5174 --bind 127.0.0.1
```

y abrir <http://127.0.0.1:5174>.

## Pruebas

Requiere Node.js 18 o superior; no hay dependencias.

```text
npm test
```

(equivale a `node --test`; ejecuta los archivos `tests/*.test.js`).

## Uso (fase 1)

- **Compases:** añadir al final, insertar después del seleccionado, duplicar (IDs nuevos), subir, bajar y borrar. La etiqueta visible es editable y no se renumera sola. Al borrar se listan las consecuencias para las marcas y se puede cancelar; ninguna marca se redirige a otro compás. Al mover se avisa de los tramos que quedan invertidos.
- **Acordes y voicings:** varios acordes por compás y varios voicings por acorde. Un acorde sin digitación se conserva como pendiente; un voicing nuevo empieza con todas las cuerdas mudas.
- **Digitación:** seis valores de sexta a primera: traste, `0` al aire, `x` muda. Compacto (`x35343`) o con espacios (`x 10 12 10 11 10`). Una entrada inválida muestra el error y no cambia el voicing.
- **Textos de la tarjeta:** el acorde define valores por defecto de «título encima» y «texto dentro». Cada tarjeta puede heredarlos, sustituirlos (override) u ocultarlos (cadena vacía); cambiar una tarjeta no toca las demás.
- **Grados manuales (fase 2, sin validar):** seis campos opcionales de la sexta a la primera cuerda. Vacío = sin grado. Colorean la nota según la plantilla, también en cuerdas al aire. Una digitación que abarque más de 32 trastes no se dibuja: se avisa y los datos se conservan.
- **Importar lista:** una línea por compás, `etiqueta | acorde @ digitación ; acorde @ digitación`; otro voicing del mismo acorde se separa con ` / ` (con espacios) después de `@`, por lo que `C/E` sigue siendo un acorde con bajo. Se previsualiza y se añade al final solo si no hay ningún error; no hay importación parcial.
- **Archivo:** Nuevo, Abrir JSON y Guardar JSON. Antes de abrir se valida la forma (`schemaVersion` 1, tipos, seis cuerdas, IDs únicos, campos permitidos); un archivo inválido o de otra versión se rechaza con errores legibles y la canción abierta queda intacta. Los campos desconocidos bloquean la apertura en lugar de descartarse. Las marcas con referencias incompletas se abren con avisos y se conservan. No se puede guardar con un acorde o una etiqueta sin texto, porque el archivo no podría volver a abrirse.
- **Cambios sin guardar:** el encabezado los indica; Nuevo y Abrir piden decidir (guardar, descartar o cancelar) y el navegador avisa al cerrar la pestaña.
- **Recuperación:** los cambios pendientes se copian en `localStorage` del navegador y se ofrecen al volver a abrir la aplicación. Es una red de seguridad, no un guardado; si el almacenamiento no está disponible, la aplicación funciona igual. Se borra al guardar, abrir o crear una canción.
- **Guardar JSON** usa el selector de archivos del navegador si existe; si no, una descarga normal (en ese caso el navegador no confirma que se haya guardado).

**Marcas musicales (fase 3):** el panel «Marcas musicales» permite añadir, editar y borrar repeticiones ×N, casillas de una o varias pasadas, Segno, Coda, Fine y los siete saltos. Los compases y destinos se eligen por ID con etiquetas legibles; un destino que ya no existe se conserva como opción pendiente. Borrar una marca muestra sus consecuencias y permite cancelar. Las marcas se dibujan en la hoja (Segno y Coda como SVG propio, barras de repetición, ×N y corchetes de casilla) sin expandir el recorrido.

## Hojas, exportación e impresión (fase 4, sin validar en navegador)

- **Vista previa:** varias hojas A4 apaisadas (297 × 210 mm, márgenes de 10 mm, área útil 277 × 190 mm) con `actual/total` arriba a la derecha y canción + tonalidad en la cabecera. Tras cada edición se espera a que carguen las fuentes, se mide el DOM real y se reparten compases en filas y hojas. El zoom solo escala lo dibujado (no vuelve a medir) y «Ajustar al ancho» admite escalas inferiores al 30 % para caber en móviles de 360 px. Seleccionar un compás o tarjeta solo cambia clases: no se repagina ni se pierde el desplazamiento.
- **Reparto:** todas las tarjetas aparecen en su orden, sin máximos ocultos. Un compás que no cabe en una fila se mueve a la siguiente; si no cabe ni así, se parte entre tarjetas en fragmentos con la misma etiqueta y la marca «continuación». Inicio/fin de repetición y símbolos «antes»/«después» solo se dibujan en el primer/último fragmento; casillas y repeticiones se muestran como continuación al cruzar fila u hoja. Un acorde cuyos voicings quedan en dos fragmentos se marca con un trazo de puntos en el lado cortado.
- **Textos largos:** título, nombre del acorde y texto interior ajustan línea al ancho del mástil; la cabecera reserva su columna al número de hoja.
- **Bloqueo:** si una digitación abarca más de 32 trastes, o si una tarjeta o la cabecera no caben ni solas, la vista previa lo avisa, se conservan los datos y **Exportar HTML e Imprimir / PDF se bloquean** con la lista de problemas.
- **Exportar HTML:** un único archivo con las hojas, `references/fonts.css` y los estilos incluidos; sin editor, sin JavaScript y sin peticiones externas. Las fuentes y estilos se leen con `fetch` desde los archivos locales de la aplicación (por eso hace falta el servidor local). Antes de exportar espera a la última paginación; si se edita mientras tanto, no se exporta la hoja anterior. Si hay referencias musicales pendientes, se muestran y se pide confirmación; la exportación conserva las marcas tal cual y **no valida el recorrido**.
- **Imprimir / PDF:** abre el diálogo de impresión del navegador sobre ese mismo HTML (marco oculto): no hay descarga de PDF nativa. En el diálogo del navegador elige «Guardar como PDF», A4 horizontal, márgenes «Ninguno» y desactiva «Encabezados y pies de página»; la aplicación lo recuerda antes de imprimir. Ctrl+P sobre el editor no imprime la interfaz y remite a ese botón.

## Empezar con Claude

Leer [CLAUDE.md](CLAUDE.md), [AGENTS.md](AGENTS.md) y [docs/INICIO_CLAUDE.md](docs/INICIO_CLAUDE.md). Ejecutar las fases de [docs/PLAN.md](docs/PLAN.md) y registrar resultados reales en [docs/ESTADO.md](docs/ESTADO.md).

## Documentación

| Archivo | Contenido |
| --- | --- |
| [Requisitos](docs/REQUISITOS.md) | Funciones acordadas y límites de alcance |
| [Diseño](docs/DISENO.md) | Aplicación completa, tarjetas e impresión |
| [Modelo de datos](docs/DATOS.md) | Canción, compases, acordes, voicings y navegación musical |
| [Esquema JSON](schemas/song.schema.json) | Contrato inicial propuesto para guardar canciones |
| [Ejemplo editable](examples/cancion-demo.json) | Datos de prueba; no es una transcripción de una obra |
| [Plan](docs/PLAN.md) | Fases, entregables y condiciones de cierre |
| [Validación](docs/VALIDACION.md) | Casos que debe superar la aplicación |
| [Referencias](references/README.md) | Procedencia y diferencias frente a las plantillas |

## Decisiones ya tomadas

- HTML, CSS y JavaScript; funcionamiento local, sin servidor de aplicación ni cuenta.
- Varios acordes y varios voicings del mismo acorde por compás.
- Tres trastes visibles por defecto; crecimiento automático cuando se necesiten más.
- Nombre del acorde, texto libre dentro y título opcional fuera de cada tarjeta.
- Nombre de canción y tonalidad en la cabecera; páginas `actual/total` arriba a la derecha.
- Exportación A4 apaisada con la tipografía de las plantillas y sin franja tonal ni análisis armónico.
- Diseño moderno, musical y profesional para toda la aplicación; icono a la izquierda del nombre.
- Repeticiones, casillas, Segno, Coda, D.C., D.S., To Coda y Fine.

La planificación no autoriza publicar una web ni activar alojamiento. El encargo actual consiste en preparar este repositorio para el desarrollo.
