# Manuales y DTS

Documentación de Compás a compás **0.6.0**, edición **17/10/2026**, con el estilo de los manuales de Drop Route: portada azul, índice, instrucciones breves y fuentes editables.

| Documento | PDF | Fuente |
| --- | --- | --- |
| Manual de uso | [Abrir PDF](../latex/Manual_Uso_Compas_a_compas.pdf) | [USO.md](USO.md) |
| Instalación y arranque | [Abrir PDF](../latex/Manual_Instalacion_Compas_a_compas.pdf) | [INSTALACION.md](INSTALACION.md) |
| Diseño técnico del software (DTS) | [Abrir PDF](../latex/DTS_Compas_a_compas.pdf) | [DTS.md](../DTS.md) |

Los PDF y las fuentes también se pueden consultar sin arrancar la aplicación. Descargar o abrir un PDF desde GitHub puede requerir acceso al repositorio.

## Regenerar los documentos

Solo para mantener la documentación: Python **3.10+**, Pandoc **3.x** y una distribución TeX con LuaLaTeX o XeLaTeX y los paquetes del archivo `docs/latex/document-template.tex`. La plantilla usa TeX Gyre Pagella, Heros y Cursor, con alternativas Nimbus/P052.

Desde la raíz del repositorio:

```text
python scripts/build_docs.py
```

Para elegir motor:

```text
python scripts/build_docs.py --engine xelatex
```

El modo automático prefiere LuaLaTeX si tiene disponible su cargador de fuentes; en otro caso usa XeLaTeX. Pandoc convierte el Markdown y el motor LaTeX se ejecuta tres veces para resolver índice y referencias. La construcción rechaza desbordamientos, caracteres ausentes y referencias sin resolver.

Cada documento genera en `docs/latex` un PDF, un `.tex` y un manifiesto `.build.json` con SHA-256 de fuentes, plantilla, generador, capturas y salidas. El manifiesto identifica la construcción; no exige que dos motores produzcan PDF idénticos byte a byte. No se guardan archivos auxiliares de TeX en el repositorio.

Editar primero el Markdown. Después regenerar y revisar visualmente todas las páginas, además de los mensajes de construcción. Los PDF son entregables generados, no fuentes de edición.

## Capturas

Las capturas de `capturas/` corresponden a la aplicación 0.6.0 real en Chromium 153 sobre Linux, con ventana de 1440 × 960 px y escala de dispositivo 1,5. Se abrió `examples/cancion-demo.json`, se esperó a las fuentes y a la paginación y se dejó desaparecer el aviso de apertura. La segunda imagen muestra el formulario compacto de tarjetas; otra muestra el diálogo de marcas del compás 2 y la nueva paleta de colores. Se conservan los estilos reales de la aplicación.

No son capturas de Windows ni acreditan la validación nativa del lanzador o del diálogo de impresión. Al cambiar controles, textos o distribución, actualizar las capturas antes de reconstruir el manual.

La captura textos-deshacer.png usa examples/textos-tonalidades.json, con ocho posiciones, títulos enmarcados, grados y cambios de tonalidad. No es una transcripción de la obra que sirve de referencia visual.
