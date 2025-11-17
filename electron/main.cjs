const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

const isDev = !app.isPackaged;
const port = 8080;

function log(...args) {
  console.log('[ELECTRON]', ...args);
}

function createWindow() {
  const iconPath = isDev 
    ? path.join(__dirname, '..', 'assets', 'icon.png')
    : path.join(process.resourcesPath, 'icon.png');

  const windowOptions = {
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
    title: 'Calendário - Sistema de Gestão de Igrejas',
    backgroundColor: '#f5f5f5',
  };

  // Adiciona ícone se existir
  if (fs.existsSync(iconPath)) {
    windowOptions.icon = iconPath;
    log('Ícone carregado:', iconPath);
  } else {
    log('Ícone não encontrado:', iconPath);
  }

  mainWindow = new BrowserWindow(windowOptions);

  mainWindow.setMenuBarVisibility(false);

  if (isDev) {
    // Em desenvolvimento, conecta ao servidor Vite
    mainWindow.loadURL(`http://localhost:${port}`);
    mainWindow.webContents.openDevTools();
  } else {
    // Em produção, carrega os arquivos estáticos
    const indexPath = path.join(process.resourcesPath, 'app', 'dist', 'index.html');
    log('Carregando arquivo:', indexPath);
    
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      log('ERRO: index.html não encontrado em:', indexPath);
      // Fallback para URL localhost se houver servidor
      mainWindow.loadURL(`http://localhost:${port}`).catch(err => {
        log('Erro ao carregar URL:', err.message);
      });
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log('Falha ao carregar:', errorCode, errorDescription);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
