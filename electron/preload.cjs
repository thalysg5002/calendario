const { contextBridge } = require('electron');

// Expor APIs seguras para o renderer se necessário
contextBridge.exposeInMainWorld('electron', {
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});
