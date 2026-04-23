const { contextBridge, ipcRenderer } = require('electron');

// Inyectar config ANTES de que React renderice
const config = ipcRenderer.sendSync('get-config');
window.__DPSDESK_CONFIG__ = config;

contextBridge.exposeInMainWorld('agent', {
  onSignal: (fn) => ipcRenderer.on('signal', (_e, msg) => fn(msg)),
  sendSignal: (msg) => ipcRenderer.send('signal-out', msg),
  sendInput: (msg) => ipcRenderer.send('input', msg),
  getPosId: () => ipcRenderer.sendSync('get-posid'),
  getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),
  log: (msg) => ipcRenderer.send('renderer-log', msg),
});
