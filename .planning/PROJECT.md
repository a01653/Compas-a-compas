# Compás a compás

## What This Is

Compás a compás es una aplicación web estática (HTML, CSS y JavaScript modular, sin backend ni framework), con interfaz y documentación en español, para crear y editar hojas de acordes de guitarra por compás. Cada compás lleva una o varias tarjetas independientes (acorde con mástil horizontal y voicing, con textos, grados y tonalidad) y la navegación musical de una partitura (repeticiones, casillas, Segno, Coda, D.C./D.S.). Guarda y abre JSON, exporta HTML autónomo y se imprime en A4 apaisado (PDF desde el navegador). Se usa en local, sin cuenta ni conexión.

**Estado:** proyecto existente y entregado, versión **0.10.1**, integrada en `main` y publicada en GitHub Pages ([a01653.github.io/Compas-a-compas](https://a01653.github.io/Compas-a-compas/)) con la autorización expresa del usuario. Rama de trabajo actual: `chore/gsd-onboarding` (onboarding de GSD; no modifica código ni documentación de producto).

## Core Value

Crear y editar hojas de acordes de guitarra por compás sin rehacer una canción cuando cambie un acorde o una digitación. El archivo JSON conserva la edición; HTML y PDF son salidas visuales. (Objetivo citado de [docs/REQUISITOS.md](../docs/REQUISITOS.md).)

## Métrica de éxito

No definido. Ninguna de las fuentes define una métrica de éxito.

## Requirements

Todos los requisitos de las fuentes describen funcionalidad **implementada y validada hasta la 0.10.1**. Texto citado sin modificar de [docs/REQUISITOS.md](../docs/REQUISITOS.md) (vía [intel/requirements.md](intel/requirements.md)); la lista completa con su trazado está en [REQUIREMENTS.md](REQUIREMENTS.md) y la evidencia de validación por versión, en [docs/ESTADO.md](../docs/ESTADO.md) y [CHANGELOG.md](../CHANGELOG.md).

### Validated

Hito completado: **v0.10.1** (ver [ROADMAP.md](ROADMAP.md)). La versión se indica solo cuando la fuente la declara.

**Canción y compases**

- ✓ REQ-R01 — Editar nombre de canción y tonalidad en campos separados. Mostrar ambos en la cabecera de la hoja. — ampliado en 0.5.0
- ✓ REQ-R02 — Añadir, insertar, duplicar, borrar y reordenar compases. Conservar un identificador interno estable y una etiqueta visible editable; no renumerar silenciosamente una partitura transcrita. (Ampliado en 0.8.0 por R34: la renumeración es por defecto, anunciada y desactivable por canción.) — ampliado en 0.8.0
- ✓ REQ-R05 — Corregir un compás o una tarjeta sin regenerar ni cambiar el resto de la canción.
- ✓ REQ-R06 — Permitir compases vacíos o de silencio y conservar su numeración.

**Entrada de acordes**

- ✓ REQ-R03 — Introducir acordes uno a uno o mediante una lista por compases. La importación de lista muestra una previsualización antes de aplicar.

**Tarjetas y voicings**

- ✓ REQ-R04 — Cada compás admite varias tarjetas independientes (en el formato, acordes con uno o varios voicings). No fijar un máximo de dos tarjetas.
- ✓ REQ-R07 — Cada tarjeta muestra el nombre del acorde y admite una línea de texto libre dentro, en la posición donde la plantilla indicaba familia/inversión. — ampliado en 0.5.0
- ✓ REQ-R08 — Cada tarjeta admite un título opcional encima y fuera de su borde, por ejemplo «Introducción». Funciona también con varias tarjetas en un compás. No confundirlo con una sección de la canción. — ampliado en 0.5.0
- ✓ REQ-R29 — La tarjeta es la única entidad visible en el editor: selector plano, añadir, duplicar y quitar tarjeta. Cada tarjeta edita todos sus campos sin afectar a las demás. Los archivos antiguos con varios voicings bajo un acorde se abren sin migrar; al editar el nombre o la calidad de una de esas tarjetas, solo ella se separa en un acorde independiente. — 0.6.0
- ✓ REQ-R30 — Cada tarjeta admite un grado opcional (texto libre) arriba a la derecha, dentro de la tarjeta, distinto de los grados manuales por cuerda. — 0.6.0
- ✓ REQ-ampliacion-0-6-0 — Tarjetas independientes con selector único y franjas rectangulares; sin barras ni separadores de grupos. (Implementada en 0.6.0; detalle en R29 y R30.) — 0.6.0

**Mástil y digitaciones**

- ✓ REQ-R09 — Introducir seis valores de cuerda: traste entero, 0 para cuerda al aire y x para cuerda muda. Orden de entrada: sexta a primera. Admitir trastes de dos cifras con separadores o con una letra (`a` = 10 … `o` = 24), de modo que `xa9axa` equivale a `x 10 9 10 x 10`.
- ✓ REQ-R10 — Mástil horizontal con primera cuerda arriba y sexta abajo. Puntos centrados entre líneas de traste; los números deben coincidir con los trastes reales.
- ✓ REQ-R11 — Mostrar al menos tres trastes; aumentar automáticamente a cuatro o más cuando se necesite. No truncar, cambiar notas ni descartar un voicing por su extensión.
- ✓ REQ-R12 — Dibujar cuerdas al aire y mudas en una zona exterior a la rejilla. Con cuerdas al aire, comenzar en traste 1, con cejuela, ampliando hasta cubrir el traste más alto.
- ✓ REQ-R13 — Conservar el color pastel por familia y los grados coloreados de las plantillas cuando estén definidos. Permitir etiqueta manual de grado; no inventar grados a partir de un nombre de acorde que no se sabe interpretar.

**Estructura de partitura**

- ✓ REQ-R14 — Añadir barras de inicio y fin de repetición, con número total de pasadas: ×2, ×3, etc.
- ✓ REQ-R15 — Casillas de primera, segunda y otras pasadas; pueden abarcar varios compases.
- ✓ REQ-R16 — Segno y Coda con símbolos; D.C., D.S., D.C. al Coda, D.S. al Coda, D.C. al Fine, D.S. al Fine, To Coda y Fine.
- ✓ REQ-R17 — Asociar cada marca al límite o tramo musical correspondiente. Validar referencias y avisar si un destino desaparece tras editar.
- ✓ REQ-R18 — Mostrar las marcas en editor, vista previa y exportación. Mantener los compases escritos; no expandir repeticiones ni duplicar compases.

**Guardado y apertura (JSON)**

- ✓ REQ-R19 — Guardar y abrir JSON con `schemaVersion`; conservar todos los campos, marcas, textos y digitaciones.
- ✓ REQ-R20 — Validar el archivo antes de sustituir el estado actual. Versiones desconocidas o datos inválidos muestran errores legibles y dejan intacta la canción abierta.

**Exportación, impresión y paginación**

- ✓ REQ-R21 — Exportar HTML autónomo, con estilos y fuentes incluidos. Abrirlo sin conexión debe conservar el diseño.
- ✓ REQ-R22 — Impresión A4 apaisada y PDF mediante el diálogo del navegador. No presentar una descarga PDF nativa como implementada si solo se usa impresión.
- ✓ REQ-R23 — Páginas numeradas arriba a la derecha, en formato `1/3`, `2/3`, `3/3`. Total de hojas exportadas, calculado después de la paginación.

**Tonalidad**

- ✓ REQ-R24 — No incluir páginas de análisis armónico. La tonalidad general permanece en la cabecera. Desde la 0.5.0 cada tarjeta puede llevar una tonalidad propia con calidad, que se hereda en el orden escrito y se muestra en una franja tonal; esa franja se puede ocultar globalmente sin afectar a la cabecera. No se infiere ninguna tonalidad ni calidad. — 0.5.0

**Interfaz y diseño**

- ✓ REQ-R25 — Toda la aplicación tendrá diseño moderno, musical y profesional: navegación, formularios, botones, editor y vista previa.
- ✓ REQ-R26 — Icono musical propio a la izquierda del nombre «Compás a compás», coherente con el resto de la interfaz.
- ✓ REQ-R27 — Mantener la tipografía de las plantillas en las hojas; usar las familias incluidas también como identidad de la aplicación, reservando tipografía de sistema para controles si mejora la lectura.
- ✓ REQ-R28 — Uso local, sin cuenta, backend ni conexión para trabajar con una canción. Adaptar el editor a móvil y escritorio. La hoja A4 mantiene proporciones con zoom o desplazamiento en la vista previa.

**Edición estructural, selección e historial**

- ✓ REQ-R31 — Seleccionar uno o varios compases (casillas en modo selección, Ctrl+clic, Mayús+clic o desde el menú del compás) y aplicarles insertar antes o después, copiar, cortar, pegar antes o después, duplicar, sustituir, subir, bajar, intercambiar y borrar. Las mismas acciones en el menú del compás y en un menú contextual de la hoja. (0.8.0) — 0.8.0
- ✓ REQ-R32 — Mover bloques no contiguos conservando su orden. Copias, duplicados y pegados conservan acordes, voicings, textos, tonalidades y ancho, con IDs nuevos y únicos. Sustituir cambia el contenido y conserva ID, etiqueta y marcas. (0.8.0) — 0.8.0
- ✓ REQ-R33 — Las marcas siguen a su compás por ID y nunca se redirigen. Las repeticiones de un bloque copiado se rehacen respecto a su nueva posición; una pareja de dos compases se mueve entera y no se separa al insertar. Los avisos nuevos se muestran y la corrección de referencias es una acción expresa. (0.8.0) — 0.8.0
- ✓ REQ-R34 — Renumerar las etiquetas numéricas tras cada operación estructural, desde el número del primer compás numerado; opción por canción para conservar los números originales. (0.8.0) — 0.8.0
- ✓ REQ-R35 — Copiar y pegar una o varias tarjetas entre compases o canciones, sustituir la tarjeta entera o solo su digitación y reordenar las tarjetas de un compás. Seleccionar varias tarjetas, también salteadas, con Ctrl+clic, Mayús+clic o el modo selección: en la hoja, el recuadro de una tarjeta señala la tarjeta y el resto del compás señala el compás; una selección no mezcla tarjetas y compases. (0.8.0) — 0.8.0
- ✓ REQ-R36 — Deshacer y rehacer cada operación en un paso; borrar pide confirmación. Atajos Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+Z, Ctrl+Y, Alt+↑/↓ y Supr fuera de los campos. El JSON guardado conserva exactamente el resultado. (0.8.0) — 0.8.0

**Hoja de ejemplo, saltos de línea e intercambio de tarjetas**

- ✓ REQ-R37 — Al abrir, la vista previa muestra una hoja de ejemplo con título «Nombre del tema», tonalidad «Tonalidad», sin marcas: un II–V–I mayor en Do en cuatro compases (Dm7 y G7, Cmaj7, Dm7 y G7, Cmaj7), con voicings Drop 2 del set 1, grados 1, 3, 5 y 7 con sus colores y la anotación «Drop 2 Set 1 · <inversión>». Un menú de la cabecera abre las páginas de la carpeta de ejemplos del proyecto y un botón Nuevo crea una hoja con solo ese título, esa tonalidad y un compás con una tarjeta vacía. (0.9.0) — 0.9.0
- ✓ REQ-R38 — Un compás seleccionado puede llevar un salto de línea forzado: empieza una línea nueva en la hoja aunque cupiera en la anterior. Se activa y se quita desde el menú del compás y el menú contextual, y se respeta en la vista previa, el HTML y la impresión. (0.9.0) — 0.9.0
- ✓ REQ-R39 — Con exactamente dos tarjetas seleccionadas, el menú de la tarjeta y el menú contextual ofrecen Intercambiar, que cambia de posición ambas tarjetas con todos sus datos, también entre compases distintos. Con otra cantidad, la opción no aparece. (0.9.0) — 0.9.0

**Filas compactas y salto de línea después**

- ✓ REQ-R40 — Cuando un compás no cabe a lo ancho en una línea, las tarjetas de esa línea se estrechan si así cabe, como mínimo hasta el ancho del mástil con sus números de cuerda y de traste. Cuatro compases de dos tarjetas de tres trastes caben en una línea. Se respeta el máximo de compases por línea y la salida coincide con la vista previa. (0.10.0) — 0.10.0
- ✓ REQ-R41 — Además del salto de línea antes, un compás seleccionado puede llevar un salto de línea después: termina su línea y el siguiente empieza otra. Ambos se activan y se quitan desde el menú del compás y el menú contextual y llevan un símbolo ↵ visible en la vista previa (no en la salida). (0.10.0) — 0.10.0

**Reglas que sustituyen decisiones anteriores**

- ✓ REQ-sustitucion-tres-trastes — «Exactamente tres trastes» queda sustituido por crecimiento automático con tres de base.
- ✓ REQ-sustitucion-voicings-por-compas — Varios voicings por compás no significa necesariamente varios acordes distintos.
- ✓ REQ-sustitucion-titulo-por-tarjeta — El título de cada tarjeta se admite incluso cuando comparte compás con otras.
- ✓ REQ-sustitucion-diseno-moderno — Diseño moderno para toda la aplicación; no se limita al icono.

### Active

(Sin requisitos activos — definir con /gsd-new-milestone)

### Out of Scope

- REQ-fuera-de-alcance-primera-version — Fuera de la primera versión: OCR de partituras, reproducción, generación automática de voicings, rearmonización, análisis funcional automático, catálogo completo de acordes, sincronización, colaboración, APK y publicación de una web. No son condiciones para terminar este editor. (La primera versión permite escribir y conservar la navegación musical; no incluye reproducción ni cálculo de un recorrido interpretado. No rechazar escrituras musicales complejas solo porque no exista un motor de reproducción.)

  **Nota (añadida por la ingesta, no es texto del PRD):** la publicación web estática en GitHub Pages ya existe; la exclusión «publicación de una web» delimita el alcance de la primera versión y no es una prohibición vigente. Cualquier publicación o despliegue requiere la autorización expresa del usuario (AGENTS.md).

## Context

**Instrucciones que gobiernan el trabajo.** [AGENTS.md](../AGENTS.md) y [CLAUDE.md](../CLAUDE.md) son las instrucciones operativas vigentes y **prevalecen sobre los artefactos de GSD**. En caso de conflicto, la instrucción más reciente del usuario manda; después, REQUISITOS, DISENO y DATOS, en ese orden. Los HTML y CSS de `references/` son referencias visuales, no especificaciones funcionales.

**Fuentes de verdad de los requisitos:**
- [docs/REQUISITOS.md](../docs/REQUISITOS.md): requisitos (PRD).
- [docs/DISENO.md](../docs/DISENO.md): diseño de interfaz, mástil, tarjetas y paginación.
- [docs/DATOS.md](../docs/DATOS.md) (con [schemas/song.schema.json](../schemas/song.schema.json)): contrato de datos, `schemaVersion` 1 con extensiones opcionales.
- [docs/diseno/textos-y-tonalidades.md](../docs/diseno/textos-y-tonalidades.md): textos y tonalidades por voicing (implementado en 0.5.0).

**Referenciados, no copiados:**
- [docs/ESTADO.md](../docs/ESTADO.md): registro de estado y evidencia de validación por versión; incluye las verificaciones pendientes.
- [docs/PLAN.md](../docs/PLAN.md): historial de fases 0 a 5.
- [.planning/codebase/](codebase/): mapa del código (stack, arquitectura, estructura, convenciones, pruebas, integraciones y preocupaciones).
- [CHANGELOG.md](../CHANGELOG.md), [README.md](../README.md), [docs/DTS.md](../docs/DTS.md) y [docs/VALIDACION.md](../docs/VALIDACION.md).

**Procedencia de estos artefactos.** Se han generado a partir de la ingesta de seis documentos ([ingest-manifest.yaml](ingest-manifest.yaml), [intel/SYNTHESIS.md](intel/SYNTHESIS.md), [INGEST-CONFLICTS.md](INGEST-CONFLICTS.md), ya aprobado por el usuario). No hay ADR: no existen decisiones bloqueadas. La ingesta no ha leído ni verificado la evidencia que las fuentes delegan en `docs/ESTADO.md`. [config.json](config.json) tiene `commit_docs: false`.

**Runtime y comandos.** Aplicación de navegador estática (módulos HTML/CSS/JS; sin backend ni framework). Pruebas: `npm test`. Construcción del paquete de Pages: `node scripts/build-pages.mjs`.

### Known documentation inconsistencies

Son pasajes desactualizados en documentos fuente. Se anotan como contexto; **no son tareas** ni generan trabajo pendiente.

- **AGENTS.md (línea 9 en el momento de la ingesta; el encargo de la ingesta citaba la 10):** declara pendiente el «Encargo pendiente del 18/10/2026» (repetición del compás anterior, nombres vacíos y crecimiento limitado de tarjetas), que está implementado en 0.7.0–0.7.1.
- **CLAUDE.md (línea 16):** afirma «La aplicación está implementada (versión 0.1.0)»; la versión real es 0.10.1.
- **Observación adicional, fuera del conjunto ingerido:** la tabla «Estado actual» de `docs/ESTADO.md` conserva la situación de la versión 0.1.0 (fases 0–5 y una lista de limitaciones que incluye «sin deshacer»); el estado vigente está en las secciones por versión de ese mismo archivo.
- Textos históricos resueltos en la ingesta (detalle en [INGEST-CONFLICTS.md](INGEST-CONFLICTS.md)): la cabecera «Estado: preparada para desarrollo» de REQUISITOS.md, las expresiones «propuesta» en DATOS.md y DISENO.md, la redacción en futuro de `textos-y-tonalidades.md` y la atribución de versión inconsistente de algunos campos opcionales dentro de DATOS.md.

**Verificaciones pendientes.** Las comprobaciones que quedan pendientes (por ejemplo Firefox, Safari, impresión real a PDF, pantalla táctil real) están registradas en [docs/ESTADO.md](../docs/ESTADO.md). No se han convertido en fases ni en tareas.

## Constraints

- **Stack y runtime**: HTML, CSS y JavaScript modular en el navegador; sin backend, autenticación ni servicios de pago; sin framework salvo necesidad concreta documentada. Estructura pequeña (`index.html`, `src/`, `styles/`, `assets/`, `tests/`). — AGENTS.md.
- **Arquitectura**: un único estado editable de canción del que se derivan editor, vista previa, JSON e impresión; modelo y validación, geometría del mástil, navegación musical, paginación y exportación separados; un mismo renderizador para vista previa y exportación; identificadores estables (los saltos nunca ligados a índices ni a números visibles); texto de usuario solo por APIs de texto; validar el JSON antes de reemplazar la canción. — AGENTS.md, [docs/DISENO.md](../docs/DISENO.md).
- **Digitaciones y geometría**: no alterar digitaciones manuales para ajustar el diseño; el dibujo se adapta a las notas. Mínimo de tres trastes, nunca un máximo; sin límite de dos tarjetas por compás ni cuatro compases rígidos por fila. — AGENTS.md, [docs/DISENO.md](../docs/DISENO.md).
- **Datos y compatibilidad**: `schemaVersion` 1 con campos opcionales; no descartar datos desconocidos fingiendo compatibilidad; cargar y guardar conserva valores, IDs y orden; un esquema futuro exige migración explícita y pruebas; los colores por defecto viven en `config/palette-defaults.json`, fuera del formato de canción. — [docs/DATOS.md](../docs/DATOS.md).
- **Salida**: A4 apaisado 297 × 210 mm con márgenes de 5 mm; esperar a `document.fonts.ready` antes de medir, paginar o exportar; la exportación no depende de fuentes remotas ni lleva herramientas de edición; la salida conserva la identidad de las hojas existentes (Caveat Brush y Gochi Hand). — [docs/DISENO.md](../docs/DISENO.md), AGENTS.md.
- **Alcance de la primera versión**: sin reproducción, OCR, transposición automática, selector inteligente de Drop, análisis armónico ni integración con otras aplicaciones. — AGENTS.md.
- **Flujo de trabajo**: una rama por objetivo, sin editar en `main`; pruebas dirigidas durante el desarrollo y una única batería final (`npm test` y `node scripts/build-pages.mjs`; no hay lint ni suite E2E configurados y no deben declararse ejecutados); la documentación de usuario, el DTS y el README se mantienen al día; no se cambia la versión por documentación sola. — AGENTS.md.
- **Publicación**: commit, fusión, push, release y despliegue requieren la autorización expresa del usuario; antes de afirmar que algo está publicado se verifican el SHA remoto, GitHub Actions y Pages. — AGENTS.md.

## Key Decisions

No hay ADR ni decisiones bloqueadas en esta ingesta. La tabla recoge decisiones de las fuentes que condicionan el trabajo futuro; no están marcadas como bloqueadas por ninguna fuente.

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Un único estado editable de canción; sin backend ni framework | Simplicidad y uso local sin cuenta (AGENTS.md; R28) | Vigente (implementada) |
| `schemaVersion` 1 con extensiones opcionales y compatibilidad hacia atrás | Los archivos antiguos se abren y guardan sin cambios; los lectores antiguos rechazan los campos nuevos en lugar de descartarlos ([DATOS.md](../docs/DATOS.md)) | Vigente (implementada) |
| La tarjeta es la unidad visible; `chordEvents` y `voicings` se conservan en el formato | Editar tarjetas sin migrar archivos antiguos (0.6.0; [DATOS.md](../docs/DATOS.md)) | Vigente (implementada) |
| Renumeración de etiquetas activada por defecto y desactivable por canción | Resuelve la tensión entre R02 y R34 sin renumeración silenciosa (0.8.0) | Vigente (implementada) |
| Las marcas siguen a su compás por ID y nunca se redirigen | Evitar saltos silenciosamente incorrectos tras mover o borrar (R33) | Vigente (implementada) |
| Filas compactas automáticas, calculadas en cada paginación y no guardadas en el JSON | La salida coincide con la vista previa sin añadir datos al formato (0.10.0; [DATOS.md](../docs/DATOS.md)) | Vigente (implementada) |
| Colores por defecto en `config/palette-defaults.json`; la paleta de la canción manda campo a campo | Un único origen de colores sin duplicados en `src/` (0.7.0; [DATOS.md](../docs/DATOS.md)) | Vigente (implementada) |

---
*Last updated: 2026-11-19 after brownfield onboarding (ingesta de documentos; hito v0.10.1 completado, sin requisitos activos)*
