const path = require('path');
const fsForEnv = require('fs');
const { app, BrowserWindow, Tray, Menu, ipcMain, screen, protocol, desktopCapturer } = require('electron');

// Evitar que Chromium pause/throttle el renderer oculto que hace el screen capture
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('enable-usermedia-screen-capture');
const fs = require('fs');
const os = require('os');
const SignalingClient = require('./src/signaling');
const { handleInput, releaseAll } = require('./src/input');
const { getPosId } = require('./src/posId');
const { initLogger, log } = require('./src/logger');

// ── Cargar .env ──────────────────────────────────────────────────────────────
function loadEnv() {
  const candidates = [
    path.join(path.dirname(process.execPath), '.env'),
    path.join(__dirname, '.env'),
  ];
  for (const p of candidates) {
    if (fsForEnv.existsSync(p)) {
      require('dotenv').config({ path: p });
      return p;
    }
  }
  return null;
}
const loadedEnvPath = loadEnv();

const DEFAULT_BACKEND = 'https://backend-production-a5b7d.up.railway.app';
const DEFAULT_SIGNALING = 'wss://backend-production-a5b7d.up.railway.app';
const SIGNALING_URL = process.env.SIGNALING_URL || DEFAULT_SIGNALING;
const BACKEND_HTTP_URL = process.env.BACKEND_HTTP_URL || DEFAULT_BACKEND;

// Si el proceso fue arrancado por el auto-start de Windows o el instalador
// pasa --hidden, no mostramos la ventana — solo queda el ícono en la bandeja.
const startHidden = process.argv.includes('--hidden');

let mainWindow = null;
let hiddenWindow = null;
let tray = null;
let sig = null;
let posId = null;
let isQuitting = false;
let connectionStatus = 'disconnected';
let activeSessions = 0;
let lastHeartbeatAt = null;

// Registrar el scheme custom como privilegiado ANTES de app ready.
// Sin esto, localStorage/sessionStorage/IndexedDB quedan bloqueados.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'dpsdesk',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      allowServiceWorkers: true,
      corsEnabled: true,
    },
  },
]);

// Single instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', (_e, argv) => {
  // Si la segunda instancia trae --hidden (lo manda el auto-start de Windows
  // si el usuario hace doble-click cuando ya estaba corriendo), no mostramos
  // la ventana. En cualquier otro caso, asumimos que el usuario quiere abrir
  // la UI.
  const wantsHidden = Array.isArray(argv) && argv.includes('--hidden');
  if (mainWindow && !wantsHidden) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

// ── Protocolo custom dpsdesk:// ──────────────────────────────────────────────
app.whenReady().then(() => {
  protocol.registerFileProtocol('dpsdesk', (request, callback) => {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/^\/app\/?/, '');
    let filePath = path.join(__dirname, 'ui', pathname || 'index.html');

    // Si el archivo no existe, cargar index.html (para React Router)
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, 'ui', 'index.html');
    }

    callback({ path: filePath });
  });
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 580,
    minWidth: 380,
    minHeight: 540,
    maxWidth: 520,
    maxHeight: 720,
    resizable: true,
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    center: true,
    title: 'DPS Desk',
    show: false,
    icon: getIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  mainWindow.setMenuBarVisibility(false);

  // En dev: cargar desde Vite. En prod: cargar desde protocolo custom
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadURL('dpsdesk://app/index.html');
  }

  // Cuando el agente arranca con Windows (--hidden) la ventana queda oculta:
  // solo se ve el ícono de la bandeja. El usuario puede abrirla desde ahí o
  // volviendo a ejecutar el acceso directo.
  if (!startHidden) {
    mainWindow.show();
  }

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Cerrar con la X minimiza a bandeja (no destruye la ventana).
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Minimizar también oculta a la bandeja en vez de minimizar.
  // Windows pone los procesos minimizados en "Power Throttling" lo que
  // suspende el WebSocket de signaling y mata las sesiones activas.
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createHiddenWindow() {
  hiddenWindow = new BrowserWindow({
    show: false,
    width: 1,
    height: 1,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });
  hiddenWindow.loadFile(path.join(__dirname, 'renderer.html'));
}

function getIcon() {
  const { nativeImage } = require('electron');
  // En Windows el .ico se ve más nítido en la bandeja porque trae los tamaños
  // 16/24/32 embebidos. En empaquetado, los recursos quedan junto al .exe.
  const candidates = [
    path.join(__dirname, 'build', 'icon.ico'),
    path.join(__dirname, 'build', 'icon.png'),
    path.join(process.resourcesPath || '', 'build', 'icon.ico'),
    path.join(process.resourcesPath || '', 'build', 'icon.png'),
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) {
      const img = nativeImage.createFromPath(p);
      if (!img.isEmpty()) return img;
    }
  }
  return nativeImage.createEmpty();
}

function ensureAutoStart() {
  // En desarrollo (electron .) no registramos auto-start: process.execPath
  // apunta al binario de electron, no al .exe del agente.
  if (!app.isPackaged) return;
  try {
    // Siempre re-registramos. El instalador NSIS también escribe la entrada,
    // pero acá la fijamos en cada arranque para que sobreviva a:
    //   - reinstalaciones que cambian la ruta del .exe
    //   - usuarios que la borran a mano
    //   - actualizaciones que rompen la entrada vieja
    app.setLoginItemSettings({
      openAtLogin: true,
      path: process.execPath,
      args: ['--hidden'],
    });

    const settings = app.getLoginItemSettings({ args: ['--hidden'] });
    log(`Auto-start: openAtLogin=${settings.openAtLogin} willLaunch=${settings.executableWillLaunchAtLogin} path=${process.execPath}`);
  } catch (err) {
    log(`ensureAutoStart failed: ${err.message}`);
  }
}

function createTray() {
  tray = new Tray(getIcon());
  tray.setToolTip('DPS Desk');
  updateTrayMenu();

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function updateTrayMenu() {
  if (!tray) return;

  const statusEmoji = connectionStatus === 'connected' ? '🟢' : '🔴';
  const sessionsText = activeSessions > 0 ? ` (${activeSessions} sesión${activeSessions > 1 ? 'es' : ''})` : '';

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `${statusEmoji} ${connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}${sessionsText}`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Mostrar ventana',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: 'Reconectar',
      click: () => reconnectSignaling(),
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip(`DPS Desk\n${connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}\nID: ${posId?.slice(0, 8) || '...'}`);
}

function updateMainWindowStatus() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('status-update', {
      posId,
      connectionStatus,
      activeSessions,
      signalingUrl: SIGNALING_URL,
      lastHeartbeatAt,
    });
  }
}

function setConnectionStatus(status) {
  connectionStatus = status;
  if (status === 'connected') {
    lastHeartbeatAt = Date.now();
  }
  log(`Connection status: ${status}`);
  updateTrayMenu();
  updateMainWindowStatus();
}

// Refrescar el heartbeat mientras el WS está vivo (el signaling envía ping cada 25s).
setInterval(() => {
  if (connectionStatus === 'connected') {
    lastHeartbeatAt = Date.now();
    updateMainWindowStatus();
  }
}, 25000);

function reconnectSignaling() {
  if (sig) {
    try { sig.close(); } catch {}
  }
  setupSignaling();
}

async function registerDevice() {
  try {
    const res = await fetch(`${BACKEND_HTTP_URL}/api/devices/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        posId,
        hostname: os.hostname(),
        ip: getLocalIP(),
        os: `${os.platform()} ${os.release()}`,
        version: app.getVersion(),
        screenWidth: screen.getPrimaryDisplay().bounds.width,
        screenHeight: screen.getPrimaryDisplay().bounds.height,
      }),
    });
    if (res.ok) {
      log(`Device registered: ${posId}`);
    }
  } catch (err) {
    log(`Device registration failed: ${err.message}`);
  }
}

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function setupSignaling() {
  sig = new SignalingClient(SIGNALING_URL, posId);

  sig.onOpen(() => setConnectionStatus('connected'));
  sig.onClose(() => setConnectionStatus('disconnected'));

  sig.on('joined', (msg) => {
    log(`Joined as agent: ${msg.posId}`);
  });

  sig.on('browser-ready', async (msg) => {
    log(`Browser ready for session: ${msg.sessionId}`);
    // CRÍTICO: ocultar la UI del agente en cuanto entra una sesión. Si quedaba
    // visible en el PC remoto y el operador hacía un clic encima, podía dar a
    // "Reconectar" (que cierra el WS y mata la sesión activa) o a la X — por
    // eso "el agente se desconecta al hacer clic". El usuario puede volver a
    // mostrar la ventana desde el ícono de la bandeja.
    try {
      if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
        mainWindow.hide();
      }
    } catch {}
    try {
      log(`Fetching ICE config from ${BACKEND_HTTP_URL}/api/sessions/ice-config`);
      const res = await fetch(`${BACKEND_HTTP_URL}/api/sessions/ice-config`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { iceServers } = await res.json();
      log(`Got ${iceServers.length} ICE servers`);
      activeSessions++;
      updateTrayMenu();
      updateMainWindowStatus();
      if (!hiddenWindow || hiddenWindow.isDestroyed()) {
        log(`ERROR: hiddenWindow is null or destroyed`);
        return;
      }
      log(`Sending signal to renderer for session ${msg.sessionId}`);
      hiddenWindow.webContents.send('signal', {
        ...msg,
        payload: { iceServers },
      });
      log(`Signal sent to renderer`);
    } catch (err) {
      log(`ice-config error: ${err.message}`);
    }
  });

  sig.on('answer', (msg) => hiddenWindow?.webContents.send('signal', msg));
  sig.on('ice-candidate', (msg) => hiddenWindow?.webContents.send('signal', msg));

  sig.on('browser-left', (msg) => {
    log(`Browser left session: ${msg.sessionId}`);
    activeSessions = Math.max(0, activeSessions - 1);
    updateTrayMenu();
    updateMainWindowStatus();
    hiddenWindow?.webContents.send('signal', msg);
    // Si el navegador dejó la sesión con botones/teclas presionadas (por ejemplo
    // un drag que cortó la conexión), aquí soltamos todo para no dejar el PC
    // remoto arrastrando ventanas o con teclas atascadas.
    try { releaseAll(); } catch {}
  });
}

// ── App ready ────────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  initLogger(app.getPath('userData'));
  posId = getPosId();
  log(`========================================`);
  log(`DPS Desk starting`);
  log(`POS ID: ${posId}`);
  log(`Signaling: ${SIGNALING_URL}`);
  log(`Backend: ${BACKEND_HTTP_URL}`);
  log(`Env file: ${loadedEnvPath || '(not found, using defaults)'}`);
  log(`========================================`);

  // IPC handlers — registrar ANTES de crear ventanas, porque los preloads
  // hacen sendSync('get-config') tan pronto cargan el renderer.
  ipcMain.on('signal-out', (_e, msg) => {
    if (sig) sig.send({ ...msg, posId });
  });

  ipcMain.on('get-posid', (e) => {
    e.returnValue = posId;
  });

  ipcMain.on('input', async (_e, msg) => {
    const display = screen.getPrimaryDisplay();
    // CRÍTICO: bounds/size están en DIPs (puntos lógicos). robotjs en Windows
    // posiciona el cursor en píxeles FÍSICOS. En pantallas con DPI scaling
    // (125%, 150%, 4K) sin esta multiplicación el cursor solo alcanzaba una
    // fracción de la pantalla y aparecía desalineado vs el cursor local.
    const sf = display.scaleFactor || 1;
    const width = Math.round(display.size.width * sf);
    const height = Math.round(display.size.height * sf);
    await handleInput(msg, width, height);
  });

  // El renderer llama a esto cuando una RTCPeerConnection se cierra o falla,
  // para garantizar que no queden botones de mouse o teclas atascadas.
  ipcMain.on('release-inputs', () => {
    try { releaseAll(); } catch {}
  });

  ipcMain.on('renderer-log', (_e, msg) => {
    log(`[RENDERER] ${msg}`);
  });

  ipcMain.handle('get-desktop-sources', async () => {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 0, height: 0 },
    });
    return sources.map(s => ({ id: s.id, name: s.name }));
  });

  ipcMain.on('get-config', (event) => {
    event.returnValue = {
      backendUrl: BACKEND_HTTP_URL,
      wsUrl: SIGNALING_URL,
      posId,
      hostname: os.hostname(),
    };
  });

  ipcMain.on('reconnect', () => reconnectSignaling());

  ipcMain.on('quit-app', () => {
    isQuitting = true;
    app.quit();
  });

  ipcMain.on('minimize-to-tray', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
    }
  });

  createMainWindow();
  createHiddenWindow();
  createTray();

  // Registrar arranque automático con Windows (oculto, solo bandeja).
  ensureAutoStart();

  // Registrar dispositivo en el backend
  await registerDevice();

  setupSignaling();
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.on('before-quit', () => {
  isQuitting = true;
  if (sig) sig.close();
  log('DPS Desk shutting down');
});
