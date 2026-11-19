# Requisitos extraídos

Fuente única de requisitos (PRD): `docs/REQUISITOS.md` (precedencia 2, versión de la especificación 1.0, fecha 16/10/2026).

## Estado de implementación (contexto, no es un requisito nuevo)

Compás a compás es una aplicación existente y publicada (versión 0.10.1 según el encargo de la ingesta). Los requisitos de este archivo describen funcionalidad YA IMPLEMENTADA Y VALIDADA, salvo que una fuente diga expresamente otra cosa. Evidencia en las propias fuentes: la cabecera de REQUISITOS.md marca como implementadas las ampliaciones de 0.5.0 (textos y tonalidades por voicing), 0.6.0 (tarjetas independientes), 0.8.0 (R31–R36), 0.9.0 (R37–R39) y 0.10.0 (R40–R41); `CLAUDE.md` afirma "La aplicación está implementada". La cabecera "Estado: preparada para desarrollo" de REQUISITOS.md es un texto histórico (ver `INGEST-CONFLICTS.md`). No se ha generado ningún requisito pendiente.

Las fuentes no separan "criterios de aceptación" del enunciado de cada requisito: el campo `acceptance` figura como ausente en cada entrada y el enunciado completo está en `description`.

## Ampliaciones declaradas en la cabecera de REQUISITOS.md (verbatim)

- Ampliación solicitada el 17/10/2026, implementada en 0.5.0: textos y tonalidades por voicing (`docs/diseno/textos-y-tonalidades.md`). Amplía R01, R07 y R08, y sustituye para ese próximo cambio la exclusión de franjas de tonalidad de R24.
- Ampliación 0.6.0: tarjetas independientes con selector único y franjas rectangulares; sin barras ni separadores de grupos.
- Ampliación solicitada el 28/10/2026, implementada en 0.10.0: filas compactas (R40) y salto de línea después (R41).
- Ampliación solicitada el 27/10/2026, implementada en 0.9.0: hoja de ejemplo inicial, menú de ejemplos y botón Nuevo (R37), salto de línea forzado (R38) e intercambio de dos tarjetas (R39).
- Ampliación solicitada el 27/10/2026, implementada en 0.8.0: edición estructural de compases (R31–R36). Amplía R02: la renumeración de etiquetas tras una operación estructural está activada por defecto, se anuncia en cada aviso y se puede desactivar por canción para conservar los números originales; ya no es silenciosa ni obligatoria.

## Objetivo (verbatim)

Crear y editar hojas de acordes de guitarra por compás sin rehacer una canción cuando cambie un acorde o una digitación. El archivo JSON conserva la edición; HTML y PDF son salidas visuales.

## REQ-ampliacion-0-6-0
- source: docs/REQUISITOS.md
- description: Tarjetas independientes con selector único y franjas rectangulares; sin barras ni separadores de grupos. (Implementada en 0.6.0; detalle en R29 y R30.)
- acceptance: ausente
- scope: tarjetas, selector, franjas de tonalidad

## REQ-R01
- source: docs/REQUISITOS.md
- description: Editar nombre de canción y tonalidad en campos separados. Mostrar ambos en la cabecera de la hoja.
- acceptance: ausente
- scope: canción y compases; cabecera de la hoja

## REQ-R02
- source: docs/REQUISITOS.md
- description: Añadir, insertar, duplicar, borrar y reordenar compases. Conservar un identificador interno estable y una etiqueta visible editable; no renumerar silenciosamente una partitura transcrita. (Ampliado en 0.8.0 por R34: la renumeración es por defecto, anunciada y desactivable por canción.)
- acceptance: ausente
- scope: canción y compases; identificadores y etiquetas

## REQ-R03
- source: docs/REQUISITOS.md
- description: Introducir acordes uno a uno o mediante una lista por compases. La importación de lista muestra una previsualización antes de aplicar.
- acceptance: ausente
- scope: entrada de acordes; importación de lista

## REQ-R04
- source: docs/REQUISITOS.md
- description: Cada compás admite varias tarjetas independientes (en el formato, acordes con uno o varios voicings). No fijar un máximo de dos tarjetas.
- acceptance: ausente
- scope: compases; tarjetas

## REQ-R05
- source: docs/REQUISITOS.md
- description: Corregir un compás o una tarjeta sin regenerar ni cambiar el resto de la canción.
- acceptance: ausente
- scope: edición local de compás y tarjeta

## REQ-R06
- source: docs/REQUISITOS.md
- description: Permitir compases vacíos o de silencio y conservar su numeración.
- acceptance: ausente
- scope: compases vacíos o de silencio

## REQ-R07
- source: docs/REQUISITOS.md
- description: Cada tarjeta muestra el nombre del acorde y admite una línea de texto libre dentro, en la posición donde la plantilla indicaba familia/inversión.
- acceptance: ausente
- scope: tarjetas; nombre del acorde; texto interior

## REQ-R08
- source: docs/REQUISITOS.md
- description: Cada tarjeta admite un título opcional encima y fuera de su borde, por ejemplo «Introducción». Funciona también con varias tarjetas en un compás. No confundirlo con una sección de la canción.
- acceptance: ausente
- scope: tarjetas; título exterior

## REQ-R09
- source: docs/REQUISITOS.md
- description: Introducir seis valores de cuerda: traste entero, 0 para cuerda al aire y x para cuerda muda. Orden de entrada: sexta a primera. Admitir trastes de dos cifras con separadores o con una letra (`a` = 10 … `o` = 24), de modo que `xa9axa` equivale a `x 10 9 10 x 10`.
- acceptance: ausente
- scope: digitaciones; entrada de cuerdas

## REQ-R10
- source: docs/REQUISITOS.md
- description: Mástil horizontal con primera cuerda arriba y sexta abajo. Puntos centrados entre líneas de traste; los números deben coincidir con los trastes reales.
- acceptance: ausente
- scope: mástil; geometría

## REQ-R11
- source: docs/REQUISITOS.md
- description: Mostrar al menos tres trastes; aumentar automáticamente a cuatro o más cuando se necesite. No truncar, cambiar notas ni descartar un voicing por su extensión.
- acceptance: ausente
- scope: mástil; número de trastes

## REQ-R12
- source: docs/REQUISITOS.md
- description: Dibujar cuerdas al aire y mudas en una zona exterior a la rejilla. Con cuerdas al aire, comenzar en traste 1, con cejuela, ampliando hasta cubrir el traste más alto.
- acceptance: ausente
- scope: mástil; cuerdas al aire y mudas

## REQ-R13
- source: docs/REQUISITOS.md
- description: Conservar el color pastel por familia y los grados coloreados de las plantillas cuando estén definidos. Permitir etiqueta manual de grado; no inventar grados a partir de un nombre de acorde que no se sabe interpretar.
- acceptance: ausente
- scope: color por familia; grados

## REQ-R14
- source: docs/REQUISITOS.md
- description: Añadir barras de inicio y fin de repetición, con número total de pasadas: ×2, ×3, etc.
- acceptance: ausente
- scope: estructura musical; repeticiones

## REQ-R15
- source: docs/REQUISITOS.md
- description: Casillas de primera, segunda y otras pasadas; pueden abarcar varios compases.
- acceptance: ausente
- scope: estructura musical; casillas

## REQ-R16
- source: docs/REQUISITOS.md
- description: Segno y Coda con símbolos; D.C., D.S., D.C. al Coda, D.S. al Coda, D.C. al Fine, D.S. al Fine, To Coda y Fine.
- acceptance: ausente
- scope: estructura musical; Segno, Coda, saltos

## REQ-R17
- source: docs/REQUISITOS.md
- description: Asociar cada marca al límite o tramo musical correspondiente. Validar referencias y avisar si un destino desaparece tras editar.
- acceptance: ausente
- scope: estructura musical; validación de referencias

## REQ-R18
- source: docs/REQUISITOS.md
- description: Mostrar las marcas en editor, vista previa y exportación. Mantener los compases escritos; no expandir repeticiones ni duplicar compases.
- acceptance: ausente
- scope: estructura musical; visualización de marcas

## REQ-R19
- source: docs/REQUISITOS.md
- description: Guardar y abrir JSON con `schemaVersion`; conservar todos los campos, marcas, textos y digitaciones.
- acceptance: ausente
- scope: guardado JSON

## REQ-R20
- source: docs/REQUISITOS.md
- description: Validar el archivo antes de sustituir el estado actual. Versiones desconocidas o datos inválidos muestran errores legibles y dejan intacta la canción abierta.
- acceptance: ausente
- scope: apertura y validación de JSON

## REQ-R21
- source: docs/REQUISITOS.md
- description: Exportar HTML autónomo, con estilos y fuentes incluidos. Abrirlo sin conexión debe conservar el diseño.
- acceptance: ausente
- scope: exportación HTML

## REQ-R22
- source: docs/REQUISITOS.md
- description: Impresión A4 apaisada y PDF mediante el diálogo del navegador. No presentar una descarga PDF nativa como implementada si solo se usa impresión.
- acceptance: ausente
- scope: impresión; PDF

## REQ-R23
- source: docs/REQUISITOS.md
- description: Páginas numeradas arriba a la derecha, en formato `1/3`, `2/3`, `3/3`. Total de hojas exportadas, calculado después de la paginación.
- acceptance: ausente
- scope: paginación; numeración de páginas

## REQ-R24
- source: docs/REQUISITOS.md
- description: No incluir páginas de análisis armónico. La tonalidad general permanece en la cabecera. Desde la 0.5.0 cada tarjeta puede llevar una tonalidad propia con calidad, que se hereda en el orden escrito y se muestra en una franja tonal; esa franja se puede ocultar globalmente sin afectar a la cabecera. No se infiere ninguna tonalidad ni calidad.
- acceptance: ausente
- scope: tonalidad; análisis armónico (exclusión); franja tonal

## REQ-R25
- source: docs/REQUISITOS.md
- description: Toda la aplicación tendrá diseño moderno, musical y profesional: navegación, formularios, botones, editor y vista previa.
- acceptance: ausente
- scope: interfaz; diseño

## REQ-R26
- source: docs/REQUISITOS.md
- description: Icono musical propio a la izquierda del nombre «Compás a compás», coherente con el resto de la interfaz.
- acceptance: ausente
- scope: interfaz; icono de cabecera

## REQ-R27
- source: docs/REQUISITOS.md
- description: Mantener la tipografía de las plantillas en las hojas; usar las familias incluidas también como identidad de la aplicación, reservando tipografía de sistema para controles si mejora la lectura.
- acceptance: ausente
- scope: interfaz; tipografía

## REQ-R28
- source: docs/REQUISITOS.md
- description: Uso local, sin cuenta, backend ni conexión para trabajar con una canción. Adaptar el editor a móvil y escritorio. La hoja A4 mantiene proporciones con zoom o desplazamiento en la vista previa.
- acceptance: ausente
- scope: interfaz; uso local; responsive

## REQ-R29
- source: docs/REQUISITOS.md
- description: La tarjeta es la única entidad visible en el editor: selector plano, añadir, duplicar y quitar tarjeta. Cada tarjeta edita todos sus campos sin afectar a las demás. Los archivos antiguos con varios voicings bajo un acorde se abren sin migrar; al editar el nombre o la calidad de una de esas tarjetas, solo ella se separa en un acorde independiente.
- acceptance: ausente
- scope: tarjetas; editor; compatibilidad de archivos antiguos

## REQ-R30
- source: docs/REQUISITOS.md
- description: Cada tarjeta admite un grado opcional (texto libre) arriba a la derecha, dentro de la tarjeta, distinto de los grados manuales por cuerda.
- acceptance: ausente
- scope: tarjetas; grado del voicing

## REQ-R31
- source: docs/REQUISITOS.md
- description: Seleccionar uno o varios compases (casillas en modo selección, Ctrl+clic, Mayús+clic o desde el menú del compás) y aplicarles insertar antes o después, copiar, cortar, pegar antes o después, duplicar, sustituir, subir, bajar, intercambiar y borrar. Las mismas acciones en el menú del compás y en un menú contextual de la hoja. (0.8.0)
- acceptance: ausente
- scope: edición estructural de compases; selección múltiple

## REQ-R32
- source: docs/REQUISITOS.md
- description: Mover bloques no contiguos conservando su orden. Copias, duplicados y pegados conservan acordes, voicings, textos, tonalidades y ancho, con IDs nuevos y únicos. Sustituir cambia el contenido y conserva ID, etiqueta y marcas. (0.8.0)
- acceptance: ausente
- scope: edición estructural de compases; identidad

## REQ-R33
- source: docs/REQUISITOS.md
- description: Las marcas siguen a su compás por ID y nunca se redirigen. Las repeticiones de un bloque copiado se rehacen respecto a su nueva posición; una pareja de dos compases se mueve entera y no se separa al insertar. Los avisos nuevos se muestran y la corrección de referencias es una acción expresa. (0.8.0)
- acceptance: ausente
- scope: edición estructural de compases; marcas y repeticiones

## REQ-R34
- source: docs/REQUISITOS.md
- description: Renumerar las etiquetas numéricas tras cada operación estructural, desde el número del primer compás numerado; opción por canción para conservar los números originales. (0.8.0)
- acceptance: ausente
- scope: edición estructural de compases; etiquetas

## REQ-R35
- source: docs/REQUISITOS.md
- description: Copiar y pegar una o varias tarjetas entre compases o canciones, sustituir la tarjeta entera o solo su digitación y reordenar las tarjetas de un compás. Seleccionar varias tarjetas, también salteadas, con Ctrl+clic, Mayús+clic o el modo selección: en la hoja, el recuadro de una tarjeta señala la tarjeta y el resto del compás señala el compás; una selección no mezcla tarjetas y compases. (0.8.0)
- acceptance: ausente
- scope: edición de tarjetas; selección múltiple

## REQ-R36
- source: docs/REQUISITOS.md
- description: Deshacer y rehacer cada operación en un paso; borrar pide confirmación. Atajos Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+Z, Ctrl+Y, Alt+↑/↓ y Supr fuera de los campos. El JSON guardado conserva exactamente el resultado. (0.8.0)
- acceptance: ausente
- scope: historial; atajos de teclado; confirmación de borrado

## REQ-R37
- source: docs/REQUISITOS.md
- description: Al abrir, la vista previa muestra una hoja de ejemplo con título «Nombre del tema», tonalidad «Tonalidad», sin marcas: un II–V–I mayor en Do en cuatro compases (Dm7 y G7, Cmaj7, Dm7 y G7, Cmaj7), con voicings Drop 2 del set 1, grados 1, 3, 5 y 7 con sus colores y la anotación «Drop 2 Set 1 · <inversión>». Un menú de la cabecera abre las páginas de la carpeta de ejemplos del proyecto y un botón Nuevo crea una hoja con solo ese título, esa tonalidad y un compás con una tarjeta vacía. (0.9.0)
- acceptance: ausente
- scope: hoja de ejemplo inicial; menú Ejemplos; botón Nuevo

## REQ-R38
- source: docs/REQUISITOS.md
- description: Un compás seleccionado puede llevar un salto de línea forzado: empieza una línea nueva en la hoja aunque cupiera en la anterior. Se activa y se quita desde el menú del compás y el menú contextual, y se respeta en la vista previa, el HTML y la impresión. (0.9.0)
- acceptance: ausente
- scope: saltos de línea antes

## REQ-R39
- source: docs/REQUISITOS.md
- description: Con exactamente dos tarjetas seleccionadas, el menú de la tarjeta y el menú contextual ofrecen Intercambiar, que cambia de posición ambas tarjetas con todos sus datos, también entre compases distintos. Con otra cantidad, la opción no aparece. (0.9.0)
- acceptance: ausente
- scope: intercambio de tarjetas

## REQ-R40
- source: docs/REQUISITOS.md
- description: Cuando un compás no cabe a lo ancho en una línea, las tarjetas de esa línea se estrechan si así cabe, como mínimo hasta el ancho del mástil con sus números de cuerda y de traste. Cuatro compases de dos tarjetas de tres trastes caben en una línea. Se respeta el máximo de compases por línea y la salida coincide con la vista previa. (0.10.0)
- acceptance: ausente
- scope: filas compactas; paginación

## REQ-R41
- source: docs/REQUISITOS.md
- description: Además del salto de línea antes, un compás seleccionado puede llevar un salto de línea después: termina su línea y el siguiente empieza otra. Ambos se activan y se quitan desde el menú del compás y el menú contextual y llevan un símbolo ↵ visible en la vista previa (no en la salida). (0.10.0)
- acceptance: ausente
- scope: saltos de línea después

## REQ-fuera-de-alcance-primera-version
- source: docs/REQUISITOS.md
- description: Fuera de la primera versión: OCR de partituras, reproducción, generación automática de voicings, rearmonización, análisis funcional automático, catálogo completo de acordes, sincronización, colaboración, APK y publicación de una web. No son condiciones para terminar este editor. (La primera versión permite escribir y conservar la navegación musical; no incluye reproducción ni cálculo de un recorrido interpretado. No rechazar escrituras musicales complejas solo porque no exista un motor de reproducción.)
- acceptance: ausente
- scope: exclusiones de alcance (ver conflicto sobre "publicación de una web" en INGEST-CONFLICTS.md)

## REQ-sustitucion-tres-trastes
- source: docs/REQUISITOS.md
- description: «Exactamente tres trastes» queda sustituido por crecimiento automático con tres de base.
- acceptance: ausente
- scope: regla que sustituye una decisión anterior; mástil

## REQ-sustitucion-voicings-por-compas
- source: docs/REQUISITOS.md
- description: Varios voicings por compás no significa necesariamente varios acordes distintos.
- acceptance: ausente
- scope: regla que sustituye una decisión anterior; voicings

## REQ-sustitucion-titulo-por-tarjeta
- source: docs/REQUISITOS.md
- description: El título de cada tarjeta se admite incluso cuando comparte compás con otras.
- acceptance: ausente
- scope: regla que sustituye una decisión anterior; títulos de tarjeta

## REQ-sustitucion-diseno-moderno
- source: docs/REQUISITOS.md
- description: Diseño moderno para toda la aplicación; no se limita al icono.
- acceptance: ausente
- scope: regla que sustituye una decisión anterior; interfaz

## Nota de cierre de la fuente (verbatim)

La propuesta técnica del modelo y de las fases puede ajustarse sin perder estas funciones. No presentar decisiones de implementación como peticiones literales del usuario.
