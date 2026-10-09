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
      devTools: false,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  });

  Menu.setApplicationMenu(null);

  // Block DevTools shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U)
  win.webContents.on('before-input-event', (event, input) => {
    const key = (input.key || '').toUpperCase();
    if (
      key === 'F12' ||
      ((input.control || input.meta) && input.shift && ['I', 'J', 'C'].includes(key)) ||
      ((input.control || input.meta) && key === 'U')
    ) {
      event.preventDefault();
    }
  });

  win.webContents.on('devtools-opened', () => {
    win.webContents.closeDevTools();
  });

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

const BACKEND_BASE = (
  isDev
    ? 'http://localhost:5000/api'
    : (process.env.VITE_API_URL || 'https://timelogic-api-fbd3128caa55.herokuapp.com/api')
).replace(/\/$/, '');

// IPC handler to securely proxy API calls in Node.js process so they never appear in Chromium DevTools Network tab
ipcMain.handle('api-request', async (_, { path: reqPath, method = 'GET', headers = {}, body, responseType = 'json' }) => {
  try {
    const targetUrl = reqPath.startsWith('http')
      ? reqPath
      : `${BACKEND_BASE}${reqPath.startsWith('/') ? reqPath : '/' + reqPath}`;

    const fetchOptions = {
      method: method.toUpperCase(),
      headers: { ...headers },
    };

    if (body !== undefined && body !== null) {
      if (body?.isMultipart) {
        const formData = new FormData();
        if (body.fields) {
          for (const [k, v] of Object.entries(body.fields)) {
            formData.append(k, String(v));
          }
        }
        if (body.files) {
          for (const f of body.files) {
            const buffer = Buffer.from(f.data, 'base64');
            const blob = new Blob([buffer], { type: f.type || 'application/octet-stream' });
            formData.append(f.name, blob, f.filename || 'upload.bin');
          }
        }
        fetchOptions.body = formData;
      } else if (typeof body === 'string') {
        fetchOptions.body = body;
      } else {
        fetchOptions.body = JSON.stringify(body);
      }
    }

    const res = await fetch(targetUrl, fetchOptions);
    const respHeaders = {};
    res.headers.forEach((val, key) => { respHeaders[key] = val; });

    if (responseType === 'arraybuffer' || responseType === 'blob') {
      const buffer = await res.arrayBuffer();
      return {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        headers: respHeaders,
        data: Buffer.from(buffer).toString('base64'),
        isBase64: true,
      };
    }

    const text = await res.text();
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch {
      parsedData = text;
    }

    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      headers: respHeaders,
      data: parsedData,
    };
  } catch (err) {
    return {
      ok: false,
      status: 500,
      statusText: 'Network Error',
      headers: {},
      error: err.message,
    };
  }
});

