const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('agentStatus', {
  getStatus: () => ipcRenderer.invoke('get-status'),
  onStatusUpdate: (fn) => ipcRenderer.on('status-update', (_e, data) => fn(data)),
  reconnect: () => ipcRenderer.send('reconnect'),
  quit: () => ipcRenderer.send('quit-app'),
});
