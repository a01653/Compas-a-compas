# Requisitos acordados

Versión de la especificación: 1.0. Fecha: 16/10/2026. Estado: preparada para desarrollo.

**Ampliación solicitada el 17/10/2026, implementada en 0.5.0:** [textos y tonalidades por voicing](diseno/textos-y-tonalidades.md). Amplía R01, R07 y R08, y sustituye para ese próximo cambio la exclusión de franjas de tonalidad de R24. La tabla siguiente conserva la especificación original; el documento enlazado precisa el cambio de las franjas.

## Objetivo

Crear y editar hojas de acordes de guitarra por compás sin rehacer una canción cuando cambie un acorde o una digitación. El archivo JSON conserva la edición; HTML y PDF son salidas visuales.

## Canción y compases

| ID | Requisito |
| --- | --- |
| R01 | Editar nombre de canción y tonalidad en campos separados. Mostrar ambos en la cabecera de la hoja. |
| R02 | Añadir, insertar, duplicar, borrar y reordenar compases. Conservar un identificador interno estable y una etiqueta visible editable; no renumerar silenciosamente una partitura transcrita. |
| R03 | Introducir acordes uno a uno o mediante una lista por compases. La importación de lista muestra una previsualización antes de aplicar. |
| R04 | Cada compás admite varios acordes; cada acorde admite varios voicings. No fijar un máximo de dos tarjetas. |
| R05 | Corregir un compás, un acorde o un voicing sin regenerar ni cambiar el resto de la canción. |
| R06 | Permitir compases vacíos o de silencio y conservar su numeración. |

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
| R24 | No incluir franja de tonalidad/escala ni páginas de análisis armónico. La tonalidad permanece como dato en la cabecera. |

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
