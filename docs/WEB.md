# Aplicación en GitHub Pages

La publicación prevista es **https://a01653.github.io/Compas-a-compas/**. Esta dirección no se da por activa hasta que GitHub confirme el despliegue. El enlace confirmado aparecerá en el entorno `github-pages` y en la ejecución de Actions.

## Activación inicial

1. Abrir [Settings → Pages](https://github.com/a01653/Compas-a-compas/settings/pages).
2. En **Build and deployment → Source**, seleccionar **GitHub Actions**.
3. En [Actions](https://github.com/a01653/Compas-a-compas/actions), abrir **Publicar en GitHub Pages** y ejecutar **Run workflow** sobre `main`. También se ejecuta al subir cambios a `main`.
4. Esperar a que los trabajos `build` y `deploy` terminen correctamente. Abrir la dirección que muestre GitHub.

El repositorio es privado. GitHub Pages requiere GitHub Pro o un plan compatible para publicar desde un repositorio privado. Si GitHub pide cambiar de plan, detenerse antes de cambiar la visibilidad: hacer público el repositorio es una decisión distinta. El conector utilizado permite editar el código pero no activar Pages en los ajustes de administración.

## Qué se publica

`scripts/build-pages.mjs` genera `_site/` con `index.html`, `src/`, `styles/`, `assets/`, `examples/`, `references/fonts.css` y `.nojekyll`. El workflow publica solo esa carpeta, después de superar las pruebas. Los recursos usan rutas relativas para que funcionen bajo la ruta del proyecto.

No se incluyen los scripts de arranque de Windows, pruebas, manuales ni las plantillas históricas completas. La aplicación local sigue abriéndose con `Abrir-Compas.cmd`. No necesita cambios para funcionar en GitHub Pages.

## Canciones y actualizaciones

Abre una canción con **Abrir** y conserva su archivo con **Guardar JSON**. La recuperación pertenece a cada navegador y dirección; no comparte los cambios de localhost ni de la publicación anterior de Sites y no sincroniza dispositivos. Lleva el JSON cuando cambies de dirección o dispositivo.

Una vez activado GitHub Pages, los cambios que se integren en `main` se probarán y publicarán automáticamente. La publicación anterior en el dominio de Sites no es GitHub Pages y no es la dirección elegida para este proyecto.

Documentación oficial: [workflows de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) y [planes compatibles](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).
