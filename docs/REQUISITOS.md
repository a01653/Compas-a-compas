# Requisitos acordados

Versión de la especificación: 1.0. Fecha: 16/10/2026. Estado: preparada para desarrollo.

**Ampliación solicitada el 17/10/2026, implementada en 0.5.0:** [textos y tonalidades por voicing](diseno/textos-y-tonalidades.md). Amplía R01, R07 y R08, y sustituye para ese próximo cambio la exclusión de franjas de tonalidad de R24. La tabla siguiente conserva la especificación original; el documento enlazado precisa el cambio de las franjas.

**Ampliación 0.6.0:** tarjetas independientes con selector único y franjas rectangulares; sin barras ni separadores de grupos.

**Ampliación solicitada el 27/10/2026, implementada en 0.8.0:** edición estructural de compases (R31–R36). Amplía R02: la renumeración de etiquetas tras una operación estructural está activada por defecto, se anuncia en cada aviso y se puede desactivar por canción para conservar los números originales; ya no es silenciosa ni obligatoria.

## Objetivo

Crear y editar hojas de acordes de guitarra por compás sin rehacer una canción cuando cambie un acorde o una digitación. El archivo JSON conserva la edición; HTML y PDF son salidas visuales.

## Canción y compases

| ID | Requisito |
| --- | --- |
| R01 | Editar nombre de canción y tonalidad en campos separados. Mostrar ambos en la cabecera de la hoja. |
| R02 | Añadir, insertar, duplicar, borrar y reordenar compases. Conservar un identificador interno estable y una etiqueta visible editable; no renumerar silenciosamente una partitura transcrita. |
| R03 | Introducir acordes uno a uno o mediante una lista por compases. La importación de lista muestra una previsualización antes de aplicar. |
| R04 | Cada compás admite varias tarjetas independientes (en el formato, acordes con uno o varios voicings). No fijar un máximo de dos tarjetas. |
| R05 | Corregir un compás o una tarjeta sin regenerar ni cambiar el resto de la canción. |
| R06 | Permitir compases vacíos o de silencio y conservar su numeración. |

## Edición estructural de compases (0.8.0)

| ID | Requisito |
| --- | --- |
| R31 | Seleccionar uno o varios compases (casillas en modo selección, Ctrl+clic, Mayús+clic o desde el menú del compás) y aplicarles insertar antes o después, copiar, cortar, pegar antes o después, duplicar, sustituir, subir, bajar, intercambiar y borrar. Las mismas acciones en el menú del compás y en un menú contextual de la hoja. |
| R32 | Mover bloques no contiguos conservando su orden. Copias, duplicados y pegados conservan acordes, voicings, textos, tonalidades y ancho, con IDs nuevos y únicos. Sustituir cambia el contenido y conserva ID, etiqueta y marcas. |
| R33 | Las marcas siguen a su compás por ID y nunca se redirigen. Las repeticiones de un bloque copiado se rehacen respecto a su nueva posición; una pareja de dos compases se mueve entera y no se separa al insertar. Los avisos nuevos se muestran y la corrección de referencias es una acción expresa. |
| R34 | Renumerar las etiquetas numéricas tras cada operación estructural, desde el número del primer compás numerado; opción por canción para conservar los números originales. |
| R35 | Copiar y pegar una o varias tarjetas entre compases o canciones, sustituir la tarjeta entera o solo su digitación y reordenar las tarjetas de un compás. Seleccionar varias tarjetas, también salteadas, con Ctrl+clic, Mayús+clic o el modo selección: en la hoja, el recuadro de una tarjeta señala la tarjeta y el resto del compás señala el compás; una selección no mezcla tarjetas y compases. |
| R36 | Deshacer y rehacer cada operación en un paso; borrar pide confirmación. Atajos Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+Z, Ctrl+Y, Alt+↑/↓ y Supr fuera de los campos. El JSON guardado conserva exactamente el resultado. |

## Tarjetas y digitaciones

| ID | Requisito |
| --- | --- |
| R07 | Cada tarjeta muestra el nombre del acorde y admite una línea de texto libre dentro, en la posición donde la plantilla indicaba familia/inversión. |
| R08 | Cada tarjeta admite un título opcional encima y fuera de su borde, por ejemplo «Introducción». Funciona también con varias tarjetas en un compás. No confundirlo con una sección de la canción. |
| R09 | Introducir seis valores de cuerda: traste entero, 0 para cuerda al aire y x para cuerda muda. Orden de entrada: sexta a primera. Admitir trastes de dos cifras con separadores. |
| R10 | Mástil horizontal con primera cuerda arriba y sexta abajo. Puntos centrados entre líneas de traste; los números deben coincidir con los trastes reales. |
| R11 | Mostrar al menos tres trastes; aumentar automáticamente a cuatro o más cuando se necesite. No truncar, cambiar notas ni descartar un voicing por su extensión. |
| R12 | Dibujar cuerdas al aire y mudas en una zona exterior a la rejilla. Con cuerdas al aire, comenzar en traste 1, con cejuela, ampliando hasta cubrir el traste más alto. |
| R13 | Conservar el color pastel por familia y los grados coloreados de las plantillas cuando estén definidos. Permitir etiqueta manual de grado; no inventar grados a partir de un nombre de acorde que no se sabe interpretar. |

## Estructura musical

| ID | Requisito |
| --- | --- |
| R14 | Añadir barras de inicio y fin de repetición, con número total de pasadas: ×2, ×3, etc. |
| R15 | Casillas de primera, segunda y otras pasadas; pueden abarcar varios compases. |
| R16 | Segno y Coda con símbolos; D.C., D.S., D.C. al Coda, D.S. al Coda, D.C. al Fine, D.S. al Fine, To Coda y Fine. |
| R17 | Asociar cada marca al límite o tramo musical correspondiente. Validar referencias y avisar si un destino desaparece tras editar. |
| R18 | Mostrar las marcas en editor, vista previa y exportación. Mantener los compases escritos; no expandir repeticiones ni duplicar compases. |

La primera versión permite escribir y conservar la navegación musical. No incluye reproducción ni cálculo de un recorrido interpretado. No rechazar escrituras musicales complejas solo porque no exista un motor de reproducción.

## Guardado y exportación

| ID | Requisito |
| --- | --- |
| R19 | Guardar y abrir JSON con `schemaVersion`; conservar todos los campos, marcas, textos y digitaciones. |
| R20 | Validar el archivo antes de sustituir el estado actual. Versiones desconocidas o datos inválidos muestran errores legibles y dejan intacta la canción abierta. |
| R21 | Exportar HTML autónomo, con estilos y fuentes incluidos. Abrirlo sin conexión debe conservar el diseño. |
| R22 | Impresión A4 apaisada y PDF mediante el diálogo del navegador. No presentar una descarga PDF nativa como implementada si solo se usa impresión. |
| R23 | Páginas numeradas arriba a la derecha, en formato `1/3`, `2/3`, `3/3`. Total de hojas exportadas, calculado después de la paginación. |
| R24 | No incluir páginas de análisis armónico. La tonalidad general permanece en la cabecera. Desde la 0.5.0 cada tarjeta puede llevar una tonalidad propia con calidad, que se hereda en el orden escrito y se muestra en una franja tonal; esa franja se puede ocultar globalmente sin afectar a la cabecera. No se infiere ninguna tonalidad ni calidad. |
| R29 | La tarjeta es la única entidad visible en el editor: selector plano, añadir, duplicar y quitar tarjeta. Cada tarjeta edita todos sus campos sin afectar a las demás. Los archivos antiguos con varios voicings bajo un acorde se abren sin migrar; al editar el nombre o la calidad de una de esas tarjetas, solo ella se separa en un acorde independiente. |
| R30 | Cada tarjeta admite un grado opcional (texto libre) arriba a la derecha, dentro de la tarjeta, distinto de los grados manuales por cuerda. |

## Interfaz

| ID | Requisito |
| --- | --- |
| R25 | Toda la aplicación tendrá diseño moderno, musical y profesional: navegación, formularios, botones, editor y vista previa. |
| R26 | Icono musical propio a la izquierda del nombre «Compás a compás», coherente con el resto de la interfaz. |
| R27 | Mantener la tipografía de las plantillas en las hojas; usar las familias incluidas también como identidad de la aplicación, reservando tipografía de sistema para controles si mejora la lectura. |
| R28 | Uso local, sin cuenta, backend ni conexión para trabajar con una canción. Adaptar el editor a móvil y escritorio. La hoja A4 mantiene proporciones con zoom o desplazamiento en la vista previa. |

## Fuera de la primera versión

OCR de partituras, reproducción, generación automática de voicings, rearmonización, análisis funcional automático, catálogo completo de acordes, sincronización, colaboración, APK y publicación de una web. No son condiciones para terminar este editor.

## Reglas que sustituyen decisiones anteriores

- «Exactamente tres trastes» queda sustituido por crecimiento automático con tres de base.
- Varios voicings por compás no significa necesariamente varios acordes distintos.
- El título de cada tarjeta se admite incluso cuando comparte compás con otras.
- Diseño moderno para toda la aplicación; no se limita al icono.

La propuesta técnica del modelo y de las fases puede ajustarse sin perder estas funciones. No presentar decisiones de implementación como peticiones literales del usuario.
