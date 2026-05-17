import { app, BrowserWindow, ipcMain, globalShortcut, shell, Menu } from 'electron';
import path from 'node:path';
import { sc, setOAuthToken } from './soundcloud';
import { loginWithSoundCloud, loadExistingToken, logout } from './auth';
import { setPresence, clearPresence } from './rpc';

/* ---- Electron performance tweaks ---- */
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=128 --lite-mode --optimize-for-size');
app.commandLine.appendSwitch('disable-features', 'SpareRendererForSitePerProcess,TranslateUI,HeavyAdIntervention,AutofillServerCommunication');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-breakpad');
app.commandLine.appendSwitch('disk-cache-size', '52428800'); // 50MB disk cache
app.commandLine.appendSwitch('disable-speech-api');
app.commandLine.appendSwitch('disable-component-update');
app.commandLine.appendSwitch('disable-ipc-flooding-protection');
app.commandLine.appendSwitch('force-gpu-mem-available-mb', '128');
app.commandLine.appendSwitch('renderer-process-limit', '1');
app.commandLine.appendSwitch('in-process-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-extensions');
app.commandLine.appendSwitch('disable-pdf-extension');
app.commandLine.appendSwitch('disable-default-apps');

const isDev = !!process.env.VITE_DEV_SERVER_URL;
let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1340,
    height: 840,
    minWidth: 980,
    minHeight: 620,
    backgroundColor: '#0b0b0d',
    title: 'Wavebox',
    frame: false,
    titleBarStyle: 'hidden',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
      v8CacheOptions: 'code',
      backgroundThrottling: true,
    },
  });

  // Open external links in the default browser, not inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  if (isDev) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!);
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.on('render-process-gone', (_e, details) => {
    console.error('[renderer-gone]', details);
  });
}

function registerMediaKeys() {
  const send = (channel: string) => mainWindow?.webContents.send(channel);
  globalShortcut.register('MediaPlayPause', () => send('media:playpause'));
  globalShortcut.register('MediaNextTrack', () => send('media:next'));
  globalShortcut.register('MediaPreviousTrack', () => send('media:prev'));
  globalShortcut.register('MediaStop', () => send('media:stop'));
}

function registerIpc() {
  /* ---------- window controls ---------- */
  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (!mainWindow) return;
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  });
  ipcMain.handle('window:close', () => mainWindow?.close());
  ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);

  /* ---------- soundcloud api proxy ---------- */
  ipcMain.handle('sc:call', async (_e, method: string, args: unknown[]) => {
    const fn = (sc as any)[method];
    if (typeof fn !== 'function') throw new Error(`Unknown sc method: ${method}`);
    return await fn(...(args ?? []));
  });

  /* ---------- auth ---------- */
  ipcMain.handle('auth:login', async () => {
    const token = await loginWithSoundCloud(mainWindow ?? undefined);
    return { token, me: token ? await sc.me().catch(() => null) : null };
  });
  ipcMain.handle('auth:loadExisting', async () => {
    const token = await loadExistingToken();
    return { token, me: token ? await sc.me().catch(() => null) : null };
  });
  ipcMain.handle('auth:logout', async () => {
    await logout();
    setOAuthToken(null);
    return true;
  });

  /* ---------- discord rpc ---------- */
  ipcMain.handle('rpc:set', (_e, payload: any) => setPresence(payload));
  ipcMain.handle('rpc:clear', () => clearPresence());

  /* ---------- shell ---------- */
  ipcMain.handle('shell:openExternal', (_e, url: string) => shell.openExternal(url));
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  registerIpc();
  await createWindow();
  registerMediaKeys();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
