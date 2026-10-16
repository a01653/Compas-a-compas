# Instrucciones listas para Claude

## Prompt de arranque

```text
Trabaja en el repositorio a01653/Compas-a-compas. Antes de editar, comprueba repositorio, rama y cambios locales. No trabajes en otro proyecto si el espacio activo no corresponde.

Lee CLAUDE.md, AGENTS.md, docs/REQUISITOS.md, docs/DISENO.md, docs/DATOS.md, schemas/song.schema.json, references/README.md, docs/PLAN.md, docs/VALIDACION.md y docs/ESTADO.md. Examina las referencias visuales sin ejecutarlas como código de producto.

Desarrolla el editor local HTML/CSS/JS Compás a compás por las fases documentadas. Empieza por la primera fase pendiente. Completa su entrega y sus comprobaciones antes de pasar a la siguiente. No vuelvas a pedir decisiones ya especificadas.

Respeta especialmente: varios acordes y varios voicings por compás; tres trastes de base con crecimiento automático; texto libre dentro y título fuera de cada tarjeta; cabecera con canción y tonalidad; páginas actual/total arriba a la derecha; fuentes Caveat Brush y Gochi Hand; diseño moderno, musical y profesional en toda la aplicación; repeticiones, casillas y saltos; JSON editable y HTML autónomo A4 apaisado. No incluir franja tonal ni páginas de análisis.

No añadas OCR, reproducción, generación automática de voicings, backend ni despliegue. No cambies digitaciones para ajustar tarjetas. No confundas el número de tarjetas con tiempos musicales. Mantén una única fuente de datos para editor y exportación.

Actualiza docs/ESTADO.md con el resultado real: archivos modificados, pruebas, revisión visual y pendientes. Si no tienes acceso a terminal o navegador, deja la validación pendiente y entrega el trabajo para revisión externa; no digas que está validado. Un bloqueo de conexión no se resuelve cambiando de repositorio.
```

## Encargo breve por fase

Usar después del prompt inicial y repetir la lectura del estado actualizado:

| Fase | Instrucción |
| --- | --- |
| 0 | Prepara estructura y propuesta visual de toda la aplicación. Incluye icono y fuentes originales. Declara acciones todavía inactivas. |
| 1 | Implementa estado, edición por compás, varios acordes/voicings, campos de tarjeta, entrada por lista y persistencia mínima. |
| 2 | Implementa tarjetas y geometría del mástil variable. Comprueba los ejemplos de rango y centrado de notas. |
| 3 | Implementa marcas de repetición, casillas y saltos con destinos por ID y avisos. No añadas reproducción. |
| 4 | Completa paginación, HTML autónomo e impresión/PDF. Revisa varias páginas y funcionamiento sin conexión. |
| 5 | Completa validación, correcciones, versión visible, registro de cambios y guía de uso. No publiques una web. |

## Si se utiliza el conector Claude local

1. Consultar `workspace_info` y verificar que apunta a este repositorio. No iniciar tareas sobre un espacio de otro proyecto.
2. Si responde `-32603`, registrar el bloqueo y comprobar el servidor local/túnel y su arranque; no afirmar que Claude está trabajando.
3. Cuando el espacio correcto esté disponible, comprobar las verificaciones configuradas y preparar una rama de trabajo conservando los cambios existentes. Un repositorio vacío ya no debería ser el punto de partida después de incorporar estos documentos.
4. Enviar una fase mediante `claude_task_start` en modo `develop`. Consultar el trabajo devuelto; no lanzar otro sobre los mismos archivos mientras esté activo.
5. Revisar diferencias y archivos nuevos. Ejecutar `run_check` con nombres realmente presentes en la configuración local. No inventar comandos configurados.
6. Revisar la vista previa de escritorio y móvil y la exportación cuando corresponda. `completed` indica que terminó el proceso, no que pasó la revisión.

También puede ejecutarse Claude Code directamente desde una copia local del repositorio. El error del conector no impide leer estas instrucciones desde GitHub.
