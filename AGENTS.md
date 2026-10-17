# Instrucciones de trabajo

## Encargo

Desarrollar Compás a compás a partir de los documentos de `docs/`. La interfaz y la documentación estarán en español. Leer todos los requisitos antes de editar código.

## Prioridad

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
