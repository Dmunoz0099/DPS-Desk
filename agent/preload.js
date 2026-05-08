const { contextBridge, ipcRenderer } = require('electron');

// Obtener config del main process
const config = ipcRenderer.sendSync('get-config');

// Exponer config y agent API al renderer (con contextIsolation: true)
contextBridge.exposeInMainWorld('__DPSDESK_CONFIG__', config);

contextBridge.exposeInMainWorld('agent', {
  onSignal: (fn) => ipcRenderer.on('signal', (_e, msg) => fn(msg)),
  sendSignal: (msg) => ipcRenderer.send('signal-out', msg),
  sendInput: (msg) => ipcRenderer.send('input', msg),
  releaseInputs: () => ipcRenderer.send('release-inputs'),
  getPosId: () => ipcRenderer.sendSync('get-posid'),
  getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),
  log: (msg) => ipcRenderer.send('renderer-log', msg),
  minimizeToTray: () => ipcRenderer.send('minimize-to-tray'),
  onStatusUpdate: (fn) => {
    const listener = (_e, status) => fn(status);
    ipcRenderer.on('status-update', listener);
    return () => ipcRenderer.removeListener('status-update', listener);
  },
});
