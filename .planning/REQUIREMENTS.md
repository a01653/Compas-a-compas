# Requirements: Compás a compás

**Defined:** 2026-11-19 (onboarding brownfield a partir de la ingesta de documentos existentes)
**Core Value:** Crear y editar hojas de acordes de guitarra por compás sin rehacer una canción cuando cambie un acorde o una digitación.

Compás a compás es una aplicación existente y publicada (versión 0.10.1). **Todos los requisitos de este archivo describen funcionalidad ya implementada y validada hasta la 0.10.1** y se trazan al hito completado v0.10.1 (ver [ROADMAP.md](ROADMAP.md)). La fuente de verdad de cada requisito es [docs/REQUISITOS.md](../docs/REQUISITOS.md); el texto se cita sin modificar desde [.planning/intel/requirements.md](intel/requirements.md). La evidencia de validación por versión está en [docs/ESTADO.md](../docs/ESTADO.md) y [CHANGELOG.md](../CHANGELOG.md); la ingesta no la ha verificado de forma independiente.

Las fuentes no separan criterios de aceptación del enunciado de cada requisito: el enunciado completo es el criterio. Las etiquetas de versión entre paréntesis solo se indican cuando la fuente las declara.

## v1 Requirements

Todos completados y validados (hito v0.10.1).

### Canción y compases

- [x] **REQ-R01**: Editar nombre de canción y tonalidad en campos separados. Mostrar ambos en la cabecera de la hoja. *(ampliado en 0.5.0: textos y tonalidades por voicing)*
- [x] **REQ-R02**: Añadir, insertar, duplicar, borrar y reordenar compases. Conservar un identificador interno estable y una etiqueta visible editable; no renumerar silenciosamente una partitura transcrita. (Ampliado en 0.8.0 por R34: la renumeración es por defecto, anunciada y desactivable por canción.)
- [x] **REQ-R05**: Corregir un compás o una tarjeta sin regenerar ni cambiar el resto de la canción.
- [x] **REQ-R06**: Permitir compases vacíos o de silencio y conservar su numeración.

### Entrada de acordes

- [x] **REQ-R03**: Introducir acordes uno a uno o mediante una lista por compases. La importación de lista muestra una previsualización antes de aplicar.

### Tarjetas y voicings

- [x] **REQ-R04**: Cada compás admite varias tarjetas independientes (en el formato, acordes con uno o varios voicings). No fijar un máximo de dos tarjetas.
- [x] **REQ-R07**: Cada tarjeta muestra el nombre del acorde y admite una línea de texto libre dentro, en la posición donde la plantilla indicaba familia/inversión. *(ampliado en 0.5.0)*
- [x] **REQ-R08**: Cada tarjeta admite un título opcional encima y fuera de su borde, por ejemplo «Introducción». Funciona también con varias tarjetas en un compás. No confundirlo con una sección de la canción. *(ampliado en 0.5.0)*
- [x] **REQ-R29**: La tarjeta es la única entidad visible en el editor: selector plano, añadir, duplicar y quitar tarjeta. Cada tarjeta edita todos sus campos sin afectar a las demás. Los archivos antiguos con varios voicings bajo un acorde se abren sin migrar; al editar el nombre o la calidad de una de esas tarjetas, solo ella se separa en un acorde independiente. *(0.6.0)*
- [x] **REQ-R30**: Cada tarjeta admite un grado opcional (texto libre) arriba a la derecha, dentro de la tarjeta, distinto de los grados manuales por cuerda. *(0.6.0)*
- [x] **REQ-ampliacion-0-6-0**: Tarjetas independientes con selector único y franjas rectangulares; sin barras ni separadores de grupos. (Implementada en 0.6.0; detalle en R29 y R30.) *(0.6.0)*

### Mástil y digitaciones

- [x] **REQ-R09**: Introducir seis valores de cuerda: traste entero, 0 para cuerda al aire y x para cuerda muda. Orden de entrada: sexta a primera. Admitir trastes de dos cifras con separadores o con una letra (`a` = 10 … `o` = 24), de modo que `xa9axa` equivale a `x 10 9 10 x 10`.
- [x] **REQ-R10**: Mástil horizontal con primera cuerda arriba y sexta abajo. Puntos centrados entre líneas de traste; los números deben coincidir con los trastes reales.
- [x] **REQ-R11**: Mostrar al menos tres trastes; aumentar automáticamente a cuatro o más cuando se necesite. No truncar, cambiar notas ni descartar un voicing por su extensión.
- [x] **REQ-R12**: Dibujar cuerdas al aire y mudas en una zona exterior a la rejilla. Con cuerdas al aire, comenzar en traste 1, con cejuela, ampliando hasta cubrir el traste más alto.
- [x] **REQ-R13**: Conservar el color pastel por familia y los grados coloreados de las plantillas cuando estén definidos. Permitir etiqueta manual de grado; no inventar grados a partir de un nombre de acorde que no se sabe interpretar.

### Estructura de partitura (marcas de navegación)

- [x] **REQ-R14**: Añadir barras de inicio y fin de repetición, con número total de pasadas: ×2, ×3, etc.
- [x] **REQ-R15**: Casillas de primera, segunda y otras pasadas; pueden abarcar varios compases.
- [x] **REQ-R16**: Segno y Coda con símbolos; D.C., D.S., D.C. al Coda, D.S. al Coda, D.C. al Fine, D.S. al Fine, To Coda y Fine.
- [x] **REQ-R17**: Asociar cada marca al límite o tramo musical correspondiente. Validar referencias y avisar si un destino desaparece tras editar.
- [x] **REQ-R18**: Mostrar las marcas en editor, vista previa y exportación. Mantener los compases escritos; no expandir repeticiones ni duplicar compases.

### Guardado y apertura (JSON)

- [x] **REQ-R19**: Guardar y abrir JSON con `schemaVersion`; conservar todos los campos, marcas, textos y digitaciones.
- [x] **REQ-R20**: Validar el archivo antes de sustituir el estado actual. Versiones desconocidas o datos inválidos muestran errores legibles y dejan intacta la canción abierta.

### Exportación, impresión y paginación

- [x] **REQ-R21**: Exportar HTML autónomo, con estilos y fuentes incluidos. Abrirlo sin conexión debe conservar el diseño.
- [x] **REQ-R22**: Impresión A4 apaisada y PDF mediante el diálogo del navegador. No presentar una descarga PDF nativa como implementada si solo se usa impresión.
- [x] **REQ-R23**: Páginas numeradas arriba a la derecha, en formato `1/3`, `2/3`, `3/3`. Total de hojas exportadas, calculado después de la paginación.

### Tonalidad

- [x] **REQ-R24**: No incluir páginas de análisis armónico. La tonalidad general permanece en la cabecera. Desde la 0.5.0 cada tarjeta puede llevar una tonalidad propia con calidad, que se hereda en el orden escrito y se muestra en una franja tonal; esa franja se puede ocultar globalmente sin afectar a la cabecera. No se infiere ninguna tonalidad ni calidad. *(0.5.0)*

### Interfaz y diseño

- [x] **REQ-R25**: Toda la aplicación tendrá diseño moderno, musical y profesional: navegación, formularios, botones, editor y vista previa.
- [x] **REQ-R26**: Icono musical propio a la izquierda del nombre «Compás a compás», coherente con el resto de la interfaz.
- [x] **REQ-R27**: Mantener la tipografía de las plantillas en las hojas; usar las familias incluidas también como identidad de la aplicación, reservando tipografía de sistema para controles si mejora la lectura.
- [x] **REQ-R28**: Uso local, sin cuenta, backend ni conexión para trabajar con una canción. Adaptar el editor a móvil y escritorio. La hoja A4 mantiene proporciones con zoom o desplazamiento en la vista previa.

### Edición estructural, selección e historial (0.8.0)

- [x] **REQ-R31**: Seleccionar uno o varios compases (casillas en modo selección, Ctrl+clic, Mayús+clic o desde el menú del compás) y aplicarles insertar antes o después, copiar, cortar, pegar antes o después, duplicar, sustituir, subir, bajar, intercambiar y borrar. Las mismas acciones en el menú del compás y en un menú contextual de la hoja. (0.8.0)
- [x] **REQ-R32**: Mover bloques no contiguos conservando su orden. Copias, duplicados y pegados conservan acordes, voicings, textos, tonalidades y ancho, con IDs nuevos y únicos. Sustituir cambia el contenido y conserva ID, etiqueta y marcas. (0.8.0)
- [x] **REQ-R33**: Las marcas siguen a su compás por ID y nunca se redirigen. Las repeticiones de un bloque copiado se rehacen respecto a su nueva posición; una pareja de dos compases se mueve entera y no se separa al insertar. Los avisos nuevos se muestran y la corrección de referencias es una acción expresa. (0.8.0)
- [x] **REQ-R34**: Renumerar las etiquetas numéricas tras cada operación estructural, desde el número del primer compás numerado; opción por canción para conservar los números originales. (0.8.0)
- [x] **REQ-R35**: Copiar y pegar una o varias tarjetas entre compases o canciones, sustituir la tarjeta entera o solo su digitación y reordenar las tarjetas de un compás. Seleccionar varias tarjetas, también salteadas, con Ctrl+clic, Mayús+clic o el modo selección: en la hoja, el recuadro de una tarjeta señala la tarjeta y el resto del compás señala el compás; una selección no mezcla tarjetas y compases. (0.8.0)
- [x] **REQ-R36**: Deshacer y rehacer cada operación en un paso; borrar pide confirmación. Atajos Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+Z, Ctrl+Y, Alt+↑/↓ y Supr fuera de los campos. El JSON guardado conserva exactamente el resultado. (0.8.0)

### Hoja de ejemplo, saltos de línea e intercambio de tarjetas (0.9.0)

- [x] **REQ-R37**: Al abrir, la vista previa muestra una hoja de ejemplo con título «Nombre del tema», tonalidad «Tonalidad», sin marcas: un II–V–I mayor en Do en cuatro compases (Dm7 y G7, Cmaj7, Dm7 y G7, Cmaj7), con voicings Drop 2 del set 1, grados 1, 3, 5 y 7 con sus colores y la anotación «Drop 2 Set 1 · <inversión>». Un menú de la cabecera abre las páginas de la carpeta de ejemplos del proyecto y un botón Nuevo crea una hoja con solo ese título, esa tonalidad y un compás con una tarjeta vacía. (0.9.0)
- [x] **REQ-R38**: Un compás seleccionado puede llevar un salto de línea forzado: empieza una línea nueva en la hoja aunque cupiera en la anterior. Se activa y se quita desde el menú del compás y el menú contextual, y se respeta en la vista previa, el HTML y la impresión. (0.9.0)
- [x] **REQ-R39**: Con exactamente dos tarjetas seleccionadas, el menú de la tarjeta y el menú contextual ofrecen Intercambiar, que cambia de posición ambas tarjetas con todos sus datos, también entre compases distintos. Con otra cantidad, la opción no aparece. (0.9.0)

### Filas compactas y salto de línea después (0.10.0)

- [x] **REQ-R40**: Cuando un compás no cabe a lo ancho en una línea, las tarjetas de esa línea se estrechan si así cabe, como mínimo hasta el ancho del mástil con sus números de cuerda y de traste. Cuatro compases de dos tarjetas de tres trastes caben en una línea. Se respeta el máximo de compases por línea y la salida coincide con la vista previa. (0.10.0)
- [x] **REQ-R41**: Además del salto de línea antes, un compás seleccionado puede llevar un salto de línea después: termina su línea y el siguiente empieza otra. Ambos se activan y se quitan desde el menú del compás y el menú contextual y llevan un símbolo ↵ visible en la vista previa (no en la salida). (0.10.0)

### Reglas que sustituyen decisiones anteriores

Reglas del PRD que reemplazan una decisión previa; vigentes e implementadas.

- [x] **REQ-sustitucion-tres-trastes**: «Exactamente tres trastes» queda sustituido por crecimiento automático con tres de base.
- [x] **REQ-sustitucion-voicings-por-compas**: Varios voicings por compás no significa necesariamente varios acordes distintos.
- [x] **REQ-sustitucion-titulo-por-tarjeta**: El título de cada tarjeta se admite incluso cuando comparte compás con otras.
- [x] **REQ-sustitucion-diseno-moderno**: Diseño moderno para toda la aplicación; no se limita al icono.

## v2 Requirements

(Sin requisitos v2 definidos — definir con /gsd-new-milestone)

## Requisitos activos

(Sin requisitos activos — definir con /gsd-new-milestone)

## Out of Scope

Explícitamente excluido de la primera versión. Texto de [docs/REQUISITOS.md](../docs/REQUISITOS.md) citado sin modificar:

| Feature | Reason |
|---------|--------|
| REQ-fuera-de-alcance-primera-version | Fuera de la primera versión: OCR de partituras, reproducción, generación automática de voicings, rearmonización, análisis funcional automático, catálogo completo de acordes, sincronización, colaboración, APK y publicación de una web. No son condiciones para terminar este editor. (La primera versión permite escribir y conservar la navegación musical; no incluye reproducción ni cálculo de un recorrido interpretado. No rechazar escrituras musicales complejas solo porque no exista un motor de reproducción.) |

**Nota añadida por la ingesta (no es texto del PRD):** la publicación web estática en GitHub Pages ya existe, y la exclusión «publicación de una web» se entiende como delimitación del alcance de la primera versión, no como prohibición vigente (ver [INGEST-CONFLICTS.md](INGEST-CONFLICTS.md), INFO). Cualquier publicación o despliegue requiere la autorización expresa del usuario (AGENTS.md).

## Traceability

Todos los requisitos se asignan al hito completado v0.10.1 ([ROADMAP.md](ROADMAP.md): Fases 0–5 e «Incrementos 0.2.0–0.10.1»). Las fuentes no asignan requisitos a fases individuales, por lo que el trazado es a nivel de hito.

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-R01 | Hito v0.10.1 | Complete |
| REQ-R02 | Hito v0.10.1 | Complete |
| REQ-R03 | Hito v0.10.1 | Complete |
| REQ-R04 | Hito v0.10.1 | Complete |
| REQ-R05 | Hito v0.10.1 | Complete |
| REQ-R06 | Hito v0.10.1 | Complete |
| REQ-R07 | Hito v0.10.1 | Complete |
| REQ-R08 | Hito v0.10.1 | Complete |
| REQ-R09 | Hito v0.10.1 | Complete |
| REQ-R10 | Hito v0.10.1 | Complete |
| REQ-R11 | Hito v0.10.1 | Complete |
| REQ-R12 | Hito v0.10.1 | Complete |
| REQ-R13 | Hito v0.10.1 | Complete |
| REQ-R14 | Hito v0.10.1 | Complete |
| REQ-R15 | Hito v0.10.1 | Complete |
| REQ-R16 | Hito v0.10.1 | Complete |
| REQ-R17 | Hito v0.10.1 | Complete |
| REQ-R18 | Hito v0.10.1 | Complete |
| REQ-R19 | Hito v0.10.1 | Complete |
| REQ-R20 | Hito v0.10.1 | Complete |
| REQ-R21 | Hito v0.10.1 | Complete |
| REQ-R22 | Hito v0.10.1 | Complete |
| REQ-R23 | Hito v0.10.1 | Complete |
| REQ-R24 | Hito v0.10.1 | Complete |
| REQ-R25 | Hito v0.10.1 | Complete |
| REQ-R26 | Hito v0.10.1 | Complete |
| REQ-R27 | Hito v0.10.1 | Complete |
| REQ-R28 | Hito v0.10.1 | Complete |
| REQ-R29 | Hito v0.10.1 | Complete |
| REQ-R30 | Hito v0.10.1 | Complete |
| REQ-R31 | Hito v0.10.1 | Complete |
| REQ-R32 | Hito v0.10.1 | Complete |
| REQ-R33 | Hito v0.10.1 | Complete |
| REQ-R34 | Hito v0.10.1 | Complete |
| REQ-R35 | Hito v0.10.1 | Complete |
| REQ-R36 | Hito v0.10.1 | Complete |
| REQ-R37 | Hito v0.10.1 | Complete |
| REQ-R38 | Hito v0.10.1 | Complete |
| REQ-R39 | Hito v0.10.1 | Complete |
| REQ-R40 | Hito v0.10.1 | Complete |
| REQ-R41 | Hito v0.10.1 | Complete |
| REQ-ampliacion-0-6-0 | Hito v0.10.1 | Complete |
| REQ-sustitucion-tres-trastes | Hito v0.10.1 | Complete |
| REQ-sustitucion-voicings-por-compas | Hito v0.10.1 | Complete |
| REQ-sustitucion-titulo-por-tarjeta | Hito v0.10.1 | Complete |
| REQ-sustitucion-diseno-moderno | Hito v0.10.1 | Complete |

**Coverage:**
- v1 requirements: 46 total (41 REQ-R + 1 ampliación + 4 reglas de sustitución)
- Mapped to the milestone: 46
- Unmapped: 0 ✓
- Fuera de alcance (no se traza): 1 (REQ-fuera-de-alcance-primera-version)

---
*Requirements defined: 2026-11-19*
*Last updated: 2026-11-19 after brownfield onboarding (ingesta de documentos; sin trabajo pendiente)*
