'use strict';
// Minimal, safe bridge between the desktop shell and the web app.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('particlyDesktop', {
  platform: process.platform,
  /** Menu commands: 'new', 'import', 'export', 'save', 'undo', 'redo', ... */
  onMenu: (cb) => ipcRenderer.on('menu', (_e, cmd) => cb(cmd)),
  /** Files opened via File > Open, "Open with", or a second launch. */
  onOpenFile: (cb) => ipcRenderer.on('open-file', (_e, file) => cb(file)),
  openDialog: () => ipcRenderer.invoke('open-dialog'),
  ready: () => ipcRenderer.send('renderer-ready'),
  webglFailed: () => ipcRenderer.send('webgl-failed'),
});
