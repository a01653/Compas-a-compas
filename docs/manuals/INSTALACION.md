# Instalación y arranque — Compás a compás

Aplicación 0.9.0 · Edición del manual: 27/10/2026. Autor del proyecto: Jesús Quevedo Rodríguez.

## Qué necesitas

- Windows para el lanzador de doble clic.
- **Node.js 18 o superior**, con `node.exe` disponible en el PATH.
- Un navegador. Las comprobaciones realizadas usan Chromium.
- La carpeta completa del repositorio. No hay dependencias npm que instalar.

La aplicación funciona en tu equipo, sin cuentas ni backend. Para usarla no hacen falta Claude, el conector ni el túnel de Cloudflare. Python, Pandoc y LaTeX solo se usan si quieres regenerar esta documentación.

## Tener el proyecto en su carpeta

La ruta prevista en este equipo es:

```text
C:\temp\Compas-a-compas
```

Si ya tienes el repositorio, actualízalo siguiendo el apartado de actualización. Si todavía no lo tienes y dispones de Git con acceso al repositorio, abre PowerShell y ejecuta:

```powershell
git clone https://github.com/a01653/Compas-a-compas.git C:\temp\Compas-a-compas
```

No ejecutes el clonado sobre una carpeta que ya contiene el proyecto. Si descargas un ZIP, extrae todo su contenido: no basta con copiar `index.html`.

En la raíz deben estar `Abrir-Compas.cmd`, `index.html`, `package.json`, `scripts`, `src`, `styles`, `assets` y `references`. Los manuales y sus fuentes están en `docs`.

## Abrir cada día

1. Abre `C:\temp\Compas-a-compas` en el Explorador.
2. Haz doble clic en **Abrir-Compas.cmd**.
3. Se abrirá el navegador en `http://127.0.0.1:5174`.
4. Pulsa **Abrir JSON** y elige tu canción guardada, o acepta la recuperación local si se ofrece y corresponde a tu trabajo.

Puedes crear un acceso directo a `Abrir-Compas.cmd` en el escritorio. Mantén el archivo original dentro del proyecto.

La consola que arranca el servidor debe permanecer abierta. Al terminar, guarda tu JSON y pulsa **Ctrl+C** en esa consola para detenerlo. Si el servidor ya estaba abierto, el lanzador reutiliza esa instancia y su segunda ventana puede cerrarse sola; la consola original sigue siendo la que mantiene la aplicación.

Si sigue abierta una instancia de una carpeta antigua o un *worktree*, ciérrala antes de arrancar desde la carpeta principal. El lanzador reconoce la aplicación del puerto 5174 y puede reutilizar esa instancia anterior.

## Arranque manual

Si necesitas ver los mensajes o usar otro puerto:

```powershell
cd C:\temp\Compas-a-compas
npm.cmd start
```

Abre `http://127.0.0.1:5174`. Para otro puerto:

```powershell
npm.cmd start -- --port 8080
```

En ese caso abre `http://127.0.0.1:8080`. El lanzador de doble clic siempre utiliza 5174. En Linux y macOS se usa `npm start` desde la raíz del proyecto.

El servidor escucha solo en `127.0.0.1`: es una aplicación local del equipo. Abrir `index.html` con doble clic no arranca el editor; sus módulos necesitan una dirección HTTP. Los HTML exportados sí pueden abrirse directamente sin servidor.

## Actualizar sin perder las canciones

1. Guarda el proyecto abierto como JSON en una carpeta conocida.
2. Detén la consola que sirve la aplicación.
3. Actualiza la copia principal:

```powershell
git -C C:\temp\Compas-a-compas pull --ff-only origin main
```

4. Vuelve a abrir **Abrir-Compas.cmd** y recarga el navegador con **Ctrl+F5**.
5. Comprueba la versión visible y abre tu JSON.

Si Git avisa de cambios locales o de ramas divergentes, detente y revisa esos cambios antes de continuar. No hace falta borrar carpetas ni descartar archivos para una actualización normal. Los JSON guardados son tus copias editables: mantenlos aparte de los archivos de programa.

## Resolver los problemas habituales

| Mensaje o síntoma | Solución |
| --- | --- |
| Falta Node.js o la versión es antigua | Instala o actualiza Node.js a 18 o superior. Reabre la consola y comprueba `node --version`. |
| PowerShell bloquea `npm.ps1` | Usa el lanzador o escribe `npm.cmd start`, como en esta guía. |
| El puerto 5174 está ocupado por otra aplicación | No cierres procesos al azar. Identifica la aplicación o arranca manualmente en otro puerto. |
| El navegador no se abre automáticamente | Conserva la consola y abre a mano la URL que indica. |
| La página deja de responder | Comprueba que sigue abierta la consola del servidor y que usas su mismo puerto. |
| Aparece una versión anterior | Cierra la instancia anterior, actualiza la carpeta principal, arranca otra vez y pulsa Ctrl+F5. |
| No encuentro mi canción al volver | Abre el JSON que guardaste. La recuperación depende del navegador y del puerto utilizados. |

## Dónde están la ayuda y los archivos

| Archivo o carpeta | Uso |
| --- | --- |
| `Abrir-Compas.cmd` | Arranque diario en Windows |
| `examples/index.json` | Lista de ejemplos del menú **Ejemplos**; el primero se abre al arrancar |
| `examples/ii-v-i-mayor-do.json` | Hoja de ejemplo inicial: II–V–I mayor en Do, Drop 2 set 1 |
| `examples/cancion-demo.json` | Ejemplo para practicar |
| `examples/textos-tonalidades.json` | Títulos enmarcados, grado y tonalidad por posición |
| `examples/Catalogo_Drop_voicings_Compas_a_compas.json` | Catálogo de voicings Drop 2, Drop 3, Drop 2+4 y disminuidos en Do |
| `docs/manuals/USO.md` | Manual de uso editable |
| `docs/manuals/INSTALACION.md` | Esta guía editable |
| `docs/DTS.md` | Diseño técnico del software |
| `docs/latex` | Manuales y DTS en PDF, fuentes LaTeX y manifiestos de construcción |

No se requiere instalar una PWA ni crear un entorno Python para utilizar el editor. El doble clic real del lanzador y el diálogo de impresión en Windows están pendientes de validación en ese sistema; su lógica de servidor y arranque se ha comprobado en Linux.
