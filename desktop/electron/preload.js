const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  version: process.env.npm_package_version ?? '1.0.0',
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  apiRequest: (options) => ipcRenderer.invoke('api-request', options),
});
