# Contexto (DOC)

Fuentes DOC: `AGENTS.md` (precedencia 0) y `CLAUDE.md` (precedencia 1). Texto citado de las fuentes con atribución; los pasajes históricos se señalan sin corregirlos (ver `INGEST-CONFLICTS.md`).

## Contexto de la ingesta (no procede de un documento fuente)
- source: instrucciones del orquestador de la ingesta (no es un documento del repositorio)
- Compás a compás es una aplicación existente y publicada, versión 0.10.1. Los requisitos y restricciones extraídos describen funcionalidad ya implementada y validada, salvo indicación expresa de una fuente. No se han inventado requisitos pendientes.
- `.planning/codebase/` es un mapa del código separado; no se ha leído ni usado como contexto de planificación.

---

## Encargo
- source: AGENTS.md
Desarrollar Compás a compás a partir de los documentos de `docs/`. La interfaz y la documentación estarán en español. Leer todos los requisitos antes de editar código.

## Prioridad y precedencia de instrucciones
- source: AGENTS.md
Encargo pendiente del 18/10/2026: [repetición del compás anterior, nombres vacíos y crecimiento limitado de tarjetas](docs/encargos/repeticion-compas-y-ajustes-tarjetas.md). Leerlo cuando se solicite ese cambio. Su presencia no significa que esté implementado. (Pasaje histórico: ver INGEST-CONFLICTS.md, WARNING.)

Las instrucciones más recientes del usuario prevalecen sobre estos documentos. Después, seguir `docs/REQUISITOS.md`, `docs/DISENO.md` y `docs/DATOS.md`. Los HTML y CSS de `references/` son referencias visuales, no especificaciones funcionales ni código listo para reutilizar sin cambios.

No restaurar por copiar la plantilla: el límite fijo de tres trastes, dos tarjetas por compás, cuatro compases rígidos por fila, análisis automático ni páginas de armonía. La petición del 17/10/2026 sí incorpora franjas de tonalidad opcionales por voicing; seguir `docs/diseno/textos-y-tonalidades.md` para ese cambio.

## Reglas de implementación
- source: AGENTS.md
- Usar HTML, CSS y JavaScript modular. Sin backend, autenticación ni servicios de pago. No añadir un framework salvo necesidad concreta documentada.
- Proponer una estructura pequeña: `index.html`, `src/`, `styles/`, `assets/`, `tests/`. No crear una aplicación monolítica con datos y HTML duplicados.
- Mantener un único estado editable de canción; derivar de él editor, vista previa, JSON e impresión.
- Separar modelo y validación, geometría del mástil, navegación musical, paginación y exportación.
- Usar identificadores estables. No ligar los saltos musicales a índices de arrays ni a números visibles.
- No deducir duración o tiempos del número de tarjetas. Un voicing alternativo no crea otro acorde ni otro tiempo.
- Renderizar texto introducido por el usuario mediante APIs de texto. No insertar HTML sin tratar. Validar JSON antes de reemplazar la canción actual.
- No alterar digitaciones manuales para ajustar el diseño. El dibujo se adapta a las notas.
- No depender de fuentes remotas para la exportación. Usar las fuentes de referencia incluidas.
- No añadir reproducción, OCR, transposición automática, selector inteligente de Drop, análisis armónico o integración con otras aplicaciones en la primera versión.
- No modificar `references/` para hacer que una comparación visual pase. Crear el código de producto fuera de esa carpeta.

## Trabajo por fases
- source: AGENTS.md
Seguir `docs/PLAN.md`. Completar y validar una fase antes de la siguiente. Resolver elecciones reversibles de implementación con criterio; preguntar solo por dudas que cambien el resultado esperado o por un bloqueo real.

Registrar archivos cambiados, comprobaciones ejecutadas y pendientes en `docs/ESTADO.md`. Un proceso terminado no equivale a una fase validada. No afirmar que hay pruebas, capturas o exportaciones revisadas si no se han realizado.

No desplegar, crear releases ni publicar paquetes como consecuencia de preparar o implementar una fase. No sobrescribir cambios ajenos. Si se trabaja con el conector local, comprobar primero qué repositorio y carpeta están activos; deben corresponder a `a01653/Compas-a-compas`. El error de conexión `-32603` no demuestra un fallo del repositorio ni autoriza cambios en otro proyecto.

## Flujo común de trabajo: rama y alcance
- source: AGENTS.md
Estas reglas armonizan Compás a compás con Mástil Escalas y Drop Route. Las restricciones musicales y de arquitectura de este archivo siguen siendo específicas de Compás a compás.
- Dedica una rama a un solo objetivo. Antes de editar, revisa `git status --short` y la rama activa.
- Si el árbol está limpio, actualiza `main` con `git pull --ff-only origin main` y crea la rama de tarea antes del primer cambio. No edites directamente en `main`.
- Si hay cambios ajenos, no los descartes, sobrescribas, ocultes con `stash` ni incluyas en la tarea. Identifícalos y continúa dejando esos archivos intactos.
- Durante el desarrollo ejecuta pruebas dirigidas; no repitas toda la batería tras cada ajuste.

## Flujo común de trabajo: cierre y pruebas
- source: AGENTS.md
- Cuando el alcance funcional esté cerrado, actualiza la documentación aplicable y ejecuta una sola batería final sobre el árbol exacto que se propone integrar.
- Para cambios de aplicación, ejecuta `npm test` y `node scripts/build-pages.mjs`. No hay un comando de lint ni una suite E2E independiente configurados en este repositorio; no los declares ejecutados.
- En cambios solo documentales, limita la validación al contenido afectado: `git diff --check`; para los manuales o el DTS, ejecuta `python scripts/build_docs.py` y revisa visualmente los PDF generados. No ejecutes pruebas de aplicación si no cambia su comportamiento.
- Si una rama combina documentación y aplicación, aplica también la batería de aplicación.
- Si falla una validación, corrige y repite la prueba afectada y las comprobaciones que pueda alcanzar la corrección. No declares validado un estado distinto del revisado.

## Flujo común de trabajo: manual, DTS y README
- source: AGENTS.md
- Mantén el manual de uso y el de instalación al día cuando cambien las acciones, etiquetas, flujos, límites o requisitos que explican. La fuente es `docs/manuals/*.md`; genera los PDF y LaTeX derivados con `python scripts/build_docs.py`, sin editarlos a mano. Comprueba composición, índice, capturas, enlaces y márgenes.
- Usa como modelo editorial el manual de Compás a compás: organización por tareas del usuario, pasos numerados cuando el orden importe, nombres exactos de la interfaz, ejemplos y límites explicados, capturas actuales con pies que indiquen qué muestran. Deja arquitectura y detalles internos para el DTS.
- Mantén `docs/DTS.md` como fuente técnica. Actualízalo en la misma rama si cambian de forma material arquitectura, modelo JSON, persistencia, paginación, navegación, construcción, despliegue, pruebas o límites. Regenera `.tex` y PDF derivados y revísalos visualmente. Si no aplica, deja constancia del motivo en el cierre.
- Actualiza `README.md` cuando cambien las funciones disponibles, requisitos, instalación, comandos, documentación enlazada, límites o URL pública. Debe describir lo que ya existe en la rama publicada; no presentes una rama local como desplegada. Deja el detalle de pruebas, commit y despliegue en `docs/ESTADO.md` o el registro de fase, no como una lista de commits en el README.
- Mantén las fuentes, derivados y capturas en la misma rama. No cambies versión por documentación sola.

## Flujo común de trabajo: publicación y entrega
- source: AGENTS.md
- Commit, fusión, push, release y despliegue requieren autorización expresa. La orden de publicar no permite saltarse una validación obligatoria fallida.
- Con autorización, verifica el SHA remoto, las comprobaciones de GitHub Actions y el resultado de Pages antes de afirmar que está publicado.
- Al cerrar, informa de la rama, archivos modificados, documentación actualizada o no requerida, comandos ejecutados y resultados; separa los pendientes. No atribuyas validaciones a GitHub si no consultaste sus ejecuciones.

## Punto de entrada de Claude Code y orden de lectura
- source: CLAUDE.md
El flujo común de ramas, validación de cierre, mantenimiento documental y README está definido en `AGENTS.md`; las instrucciones de CLAUDE.md amplían ese flujo con el contexto específico de Compás a compás.

Antes de desarrollar, leer en este orden:
1. `AGENTS.md`
2. `docs/REQUISITOS.md`
3. `docs/DISENO.md`
4. `docs/DATOS.md` y `schemas/song.schema.json`
5. `references/README.md`
6. `docs/PLAN.md`, `docs/VALIDACION.md` y `docs/ESTADO.md`

El prompt de arranque y los encargos por fase están en `docs/INICIO_CLAUDE.md`.

## Estado declarado de la aplicación
- source: CLAUDE.md
La aplicación está implementada (versión 0.1.0); el estado real y la evidencia por fase están en `docs/ESTADO.md`. No confundir el ejemplo JSON ni la plantilla histórica con funcionalidades. Los tres trastes son un mínimo inicial, no un máximo. El diseño moderno y musical afecta a toda la interfaz, mientras que la salida conserva la identidad de las hojas existentes.

(Nota: "versión 0.1.0" es un número desactualizado respecto de 0.10.1; ver INGEST-CONFLICTS.md, WARNING.)

## Referencias a documentos fuera del conjunto ingerido
- source: AGENTS.md, CLAUDE.md, docs/DISENO.md, docs/diseno/textos-y-tonalidades.md, docs/DATOS.md
Referenciados pero no ingeridos (no son nodos del grafo; no se han leído): `docs/encargos/repeticion-compas-y-ajustes-tarjetas.md`, `docs/PLAN.md`, `docs/ESTADO.md`, `docs/DTS.md`, `docs/VALIDACION.md`, `docs/INICIO_CLAUDE.md`, `docs/manuals/*.md`, `README.md`, `references/` (incluido `references/README.md` y `references/fonts.css`), `schemas/song.schema.json`, `config/palette-defaults.json`, `examples/index.json`, `EJEMPLO.html`, `referencia-tarjetas.html`, `diseno.css`, `src/model/measureOps.js`, `styles/tokens.css`, `tests/setup.mjs`, `scripts/build-pages.mjs`.
