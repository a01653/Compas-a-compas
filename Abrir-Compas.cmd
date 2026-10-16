@echo off
setlocal
title Compas a compas
rem Doble clic: arranca Compas a compas y abre el navegador. Cerrar esta ventana detiene la aplicacion.
cd /d "%~dp0"
where node.exe >nul 2>nul
if errorlevel 1 (
  echo No se encuentra Node.js ^(node.exe^) en el PATH.
  echo Instala Node.js 18 o superior desde https://nodejs.org y vuelve a abrir este archivo.
  pause
  exit /b 1
)
node.exe -e "process.exit(+process.versions.node.split('.')[0]<18?1:0)" >nul 2>nul
if errorlevel 1 (
  echo Se necesita Node.js 18 o superior y la version instalada es mas antigua.
  echo Actualiza Node.js desde https://nodejs.org y vuelve a abrir este archivo.
  pause
  exit /b 1
)
node.exe scripts\launch.mjs
if errorlevel 1 (
  echo.
  echo Compas a compas no se ha podido iniciar. Revisa el mensaje de arriba.
  pause
  exit /b 1
)
