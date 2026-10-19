# Instrucciones de trabajo

## Encargo

Desarrollar Compás a compás a partir de los documentos de `docs/`. La interfaz y la documentación estarán en español. Leer todos los requisitos antes de editar código.

## Prioridad

Encargo pendiente del 18/10/2026: [repetición del compás anterior, nombres vacíos y crecimiento limitado de tarjetas](docs/encargos/repeticion-compas-y-ajustes-tarjetas.md). Leerlo cuando se solicite ese cambio. Su presencia no significa que esté implementado.

Las instrucciones más recientes del usuario prevalecen sobre estos documentos. Después, seguir `docs/REQUISITOS.md`, `docs/DISENO.md` y `docs/DATOS.md`. Los HTML y CSS de `references/` son referencias visuales, no especificaciones funcionales ni código listo para reutilizar sin cambios.

No restaurar por copiar la plantilla: el límite fijo de tres trastes, dos tarjetas por compás, cuatro compases rígidos por fila, análisis automático ni páginas de armonía. La petición del 17/10/2026 sí incorpora franjas de tonalidad opcionales por voicing; seguir `docs/diseno/textos-y-tonalidades.md` para ese cambio.

## Implementación

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

Seguir `docs/PLAN.md`. Completar y validar una fase antes de la siguiente. Resolver elecciones reversibles de implementación con criterio; preguntar solo por dudas que cambien el resultado esperado o por un bloqueo real.

Registrar archivos cambiados, comprobaciones ejecutadas y pendientes en `docs/ESTADO.md`. Un proceso terminado no equivale a una fase validada. No afirmar que hay pruebas, capturas o exportaciones revisadas si no se han realizado.

No desplegar, crear releases ni publicar paquetes como consecuencia de preparar o implementar una fase. No sobrescribir cambios ajenos. Si se trabaja con el conector local, comprobar primero qué repositorio y carpeta están activos; deben corresponder a `a01653/Compas-a-compas`. El error de conexión `-32603` no demuestra un fallo del repositorio ni autoriza cambios en otro proyecto.

## Flujo común de trabajo y cierre

Estas reglas armonizan Compás a compás con Mástil Escalas y Drop Route. Las restricciones musicales y de arquitectura de este archivo siguen siendo específicas de Compás a compás.

### Rama y alcance

- Dedica una rama a un solo objetivo. Antes de editar, revisa `git status --short` y la rama activa.
- Si el árbol está limpio, actualiza `main` con `git pull --ff-only origin main` y crea la rama de tarea antes del primer cambio. No edites directamente en `main`.
- Si hay cambios ajenos, no los descartes, sobrescribas, ocultes con `stash` ni incluyas en la tarea. Identifícalos y continúa dejando esos archivos intactos.
- Durante el desarrollo ejecuta pruebas dirigidas; no repitas toda la batería tras cada ajuste.

### Cierre y pruebas

- Cuando el alcance funcional esté cerrado, actualiza la documentación aplicable y ejecuta una sola batería final sobre el árbol exacto que se propone integrar.
- Para cambios de aplicación, ejecuta `npm test` y `node scripts/build-pages.mjs`. No hay un comando de lint ni una suite E2E independiente configurados en este repositorio; no los declares ejecutados.
- En cambios solo documentales, limita la validación al contenido afectado: `git diff --check`; para los manuales o el DTS, ejecuta `python scripts/build_docs.py` y revisa visualmente los PDF generados. No ejecutes pruebas de aplicación si no cambia su comportamiento.
- Si una rama combina documentación y aplicación, aplica también la batería de aplicación.
- Si falla una validación, corrige y repite la prueba afectada y las comprobaciones que pueda alcanzar la corrección. No declares validado un estado distinto del revisado.

### Manual, DTS y README

- Mantén el manual de uso y el de instalación al día cuando cambien las acciones, etiquetas, flujos, límites o requisitos que explican. La fuente es `docs/manuals/*.md`; genera los PDF y LaTeX derivados con `python scripts/build_docs.py`, sin editarlos a mano. Comprueba composición, índice, capturas, enlaces y márgenes.
- Usa como modelo editorial el manual de Compás a compás: organización por tareas del usuario, pasos numerados cuando el orden importe, nombres exactos de la interfaz, ejemplos y límites explicados, capturas actuales con pies que indiquen qué muestran. Deja arquitectura y detalles internos para el DTS.
- Mantén `docs/DTS.md` como fuente técnica. Actualízalo en la misma rama si cambian de forma material arquitectura, modelo JSON, persistencia, paginación, navegación, construcción, despliegue, pruebas o límites. Regenera `.tex` y PDF derivados y revísalos visualmente. Si no aplica, deja constancia del motivo en el cierre.
- Actualiza `README.md` cuando cambien las funciones disponibles, requisitos, instalación, comandos, documentación enlazada, límites o URL pública. Debe describir lo que ya existe en la rama publicada; no presentes una rama local como desplegada. Deja el detalle de pruebas, commit y despliegue en `docs/ESTADO.md` o el registro de fase, no como una lista de commits en el README.
- Mantén las fuentes, derivados y capturas en la misma rama. No cambies versión por documentación sola.

### Publicación y entrega

- Commit, fusión, push, release y despliegue requieren autorización expresa. La orden de publicar no permite saltarse una validación obligatoria fallida.
- Con autorización, verifica el SHA remoto, las comprobaciones de GitHub Actions y el resultado de Pages antes de afirmar que está publicado.
- Al cerrar, informa de la rama, archivos modificados, documentación actualizada o no requerida, comandos ejecutados y resultados; separa los pendientes. No atribuyas validaciones a GitHub si no consultaste sus ejecuciones.
