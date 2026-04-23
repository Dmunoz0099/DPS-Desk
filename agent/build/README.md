# Icons

Para que el `electron-builder` genere correctamente el .exe con icon:

1. Convierte `icon.svg` a `icon.ico` (Windows) usando un servicio como:
   - https://convertio.co/svg-ico/
   - https://cloudconvert.com/svg-to-ico

2. Coloca `icon.ico` aquí: `agent/build/icon.ico`

Para el tray icon: convierte también a `icon.png` (256x256) y colócalo en `agent/build/icon.png`.

Si no agregas estos archivos, el build usará iconos por defecto de Electron.
