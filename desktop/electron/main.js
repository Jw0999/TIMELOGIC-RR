const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

// app.isPackaged is false when running via `electron .` in dev, true in a built binary
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 640,
    title: 'TimeLogic — Admin',
    backgroundColor: '#EFF6FF',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false,
      devTools: isDev,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  });

  Menu.setApplicationMenu(null);

  // Handle external links (e.g. WhatsApp Web/Desktop, download links) by opening in user's default browser or OS app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^(https?|whatsapp|mailto):/.test(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    const currentUrl = win.webContents.getURL();
    if (url !== currentUrl) {
      if (/^(https?|whatsapp|mailto):/.test(url) && !url.startsWith('http://localhost') && !url.startsWith('file://')) {
        event.preventDefault();
        shell.openExternal(url);
      } else {
        event.preventDefault();
      }
    }
  });

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

function checkForUpdates() {
  if (isDev) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.checkForUpdatesAndNotify().catch(() => {});
}

app.whenReady().then(() => {
  createWindow();
  checkForUpdates();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handler to open external URLs in user's default browser or registered OS handler (e.g. WhatsApp)
ipcMain.handle('open-external', async (_, url) => {
  try {
    if (/^(https?|whatsapp|mailto):/.test(url)) {
      await shell.openExternal(url);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to open external url:', err);
    return false;
  }
});
