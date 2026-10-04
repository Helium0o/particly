'use strict';
/*
 * Particly desktop shell (Electron). Wraps the web app with a native window,
 * menus, Open/Save dialogs and "open with Particly" support.
 */
const { app, BrowserWindow, Menu, dialog, ipcMain, shell, session } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.join(__dirname, '..');
const OPENABLE = /\.(json|rbxmx|rbxm|lua|luau|txt|png|jpe?g|webp|gif)$/i;
const isMac = process.platform === 'darwin';

let win = null;
let rendererReady = false;
const pendingFiles = [];

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

/* ---------------------------- persisted state ---------------------------- */

const statePath = () => path.join(app.getPath('userData'), 'window-state.json');
function readState() {
  try { return JSON.parse(fs.readFileSync(statePath(), 'utf8')); } catch { return {}; }
}
function writeState(patch) {
  try {
    fs.mkdirSync(path.dirname(statePath()), { recursive: true });
    fs.writeFileSync(statePath(), JSON.stringify({ ...readState(), ...patch }));
  } catch { /* ignore */ }
}

// Allow software WebGL when the GPU is missing or blocklisted, so the preview always works.
// ("unsafe" refers to untrusted web content; this app only loads its own local files.)
app.commandLine.appendSwitch('enable-unsafe-swiftshader');
// If WebGL failed on a previous launch, render with the SwiftShader software GPU.
if (readState().softwareGL) app.commandLine.appendSwitch('use-angle', 'swiftshader');

/* ------------------------------ opening files ----------------------------- */

function filesFromArgv(argv) {
  return argv.slice(app.isPackaged ? 1 : 2).filter((a) => OPENABLE.test(a) && fs.existsSync(a));
}

function sendFile(filePath) {
  if (!win || !rendererReady) { pendingFiles.push(filePath); return; }
  try {
    const data = fs.readFileSync(filePath);
    win.webContents.send('open-file', { name: path.basename(filePath), data: new Uint8Array(data) });
  } catch (e) {
    dialog.showErrorBox('Could not open file', `${filePath}\n\n${e.message}`);
  }
}

async function showOpenDialog() {
  const res = await dialog.showOpenDialog(win, {
    title: 'Open effect, Roblox model, script or image',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Effects & Roblox files', extensions: ['json', 'rbxmx', 'lua', 'luau', 'txt'] },
      { name: 'Images (textures)', extensions: ['png', 'jpg', 'jpeg', 'webp'] },
      { name: 'All files', extensions: ['*'] },
    ],
  });
  if (!res.canceled) res.filePaths.forEach(sendFile);
}

/* --------------------------------- menu --------------------------------- */

const send = (cmd) => () => win && win.webContents.send('menu', cmd);

function buildMenu() {
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'New Effect', accelerator: 'CmdOrCtrl+N', click: send('new') },
        { label: 'Open…', accelerator: 'CmdOrCtrl+O', click: showOpenDialog },
        { label: 'Import…', accelerator: 'CmdOrCtrl+I', click: send('import') },
        { type: 'separator' },
        { label: 'Export to Roblox…', accelerator: 'CmdOrCtrl+E', click: send('export') },
        { label: 'Save to My Library', accelerator: 'CmdOrCtrl+S', click: send('save') },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit', label: 'Exit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: send('undo') },
        { label: 'Redo', accelerator: isMac ? 'Cmd+Shift+Z' : 'Ctrl+Y', click: send('redo') },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'Effect',
      submenu: [
        { label: 'Random Effect', accelerator: 'CmdOrCtrl+Shift+R', click: send('random') },
        { label: 'Create Variation', accelerator: 'CmdOrCtrl+Shift+V', click: send('vary') },
        { label: 'Add Layer', accelerator: 'CmdOrCtrl+L', click: send('addLayer') },
        { type: 'separator' },
        { label: 'Emit Burst', accelerator: 'CmdOrCtrl+B', click: send('burst') },
        { label: 'Pause / Play', accelerator: 'CmdOrCtrl+P', click: send('pause') },
        { label: 'Restart Preview', click: send('restart') },
        { label: 'Frame Particles', accelerator: 'CmdOrCtrl+F', click: send('frame') },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
      ],
    },
    {
      role: 'help',
      submenu: [
        { label: 'Quick Guide', accelerator: 'F1', click: send('help') },
        { label: 'Particly on GitHub', click: () => shell.openExternal('https://github.com/Helium0o/particly') },
        { type: 'separator' },
        { label: 'Open Data Folder', click: () => shell.openPath(app.getPath('userData')) },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* -------------------------------- window -------------------------------- */

function createWindow() {
  const st = readState();
  win = new BrowserWindow({
    width: st.width || 1440,
    height: st.height || 900,
    x: st.x,
    y: st.y,
    minWidth: 960,
    minHeight: 620,
    show: false,
    title: 'Particly',
    backgroundColor: '#0e1016',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  if (st.maximized) win.maximize();
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(ROOT, 'index.html'));

  // Links open in the user's browser, never inside the app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file:')) {
      e.preventDefault();
      if (/^https?:\/\//.test(url)) shell.openExternal(url);
    }
  });
  win.webContents.on('did-start-loading', () => { rendererReady = false; });

  win.on('close', () => {
    const b = win.getNormalBounds();
    writeState({ ...b, maximized: win.isMaximized() });
  });
  win.on('closed', () => { win = null; });
}

/* ------------------------------- downloads ------------------------------- */

function setupDownloads() {
  // Exports use browser downloads; show a native Save dialog and remember the folder.
  session.defaultSession.on('will-download', (_e, item) => {
    const dir = readState().saveDir || app.getPath('documents');
    const ext = path.extname(item.getFilename()).slice(1);
    item.setSaveDialogOptions({
      title: 'Save',
      defaultPath: path.join(dir, item.getFilename()),
      filters: ext ? [{ name: ext.toUpperCase() + ' file', extensions: [ext] }, { name: 'All files', extensions: ['*'] }] : [],
    });
    item.once('done', (_ev, state) => {
      if (state === 'completed') writeState({ saveDir: path.dirname(item.getSavePath()) });
    });
  });
}

/* ------------------------------ app lifecycle ----------------------------- */

ipcMain.on('renderer-ready', (e) => {
  if (!win || e.sender !== win.webContents) return;
  rendererReady = true;
  pendingFiles.splice(0).forEach(sendFile);
});
ipcMain.handle('open-dialog', () => showOpenDialog());

// The preview couldn't get WebGL (no GPU / blocklisted driver): relaunch once in software mode.
ipcMain.on('webgl-failed', () => {
  if (readState().softwareGL) return;
  writeState({ softwareGL: true });
  app.relaunch();
  app.exit(0);
});

app.on('second-instance', (_e, argv) => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
  filesFromArgv(argv).forEach(sendFile);
});

// macOS: files dropped on the dock icon / "Open With"
app.on('open-file', (e, filePath) => {
  e.preventDefault();
  sendFile(filePath);
});

app.whenReady().then(() => {
  buildMenu();
  setupDownloads();
  createWindow();
  filesFromArgv(process.argv).forEach(sendFile);
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});

app.on('window-all-closed', () => {
  if (!isMac) app.quit();
});
