import {
  app,
  protocol,
  BrowserWindow,
  ipcMain,
  dialog,
} from 'electron';

import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import ElectronStore from '@/utils/ElectronStore';
import path from 'path';
import fs from 'fs';
import { genKeyPair } from '@/utils/elliptic';

const isDevelopment = process.env.NODE_ENV !== 'production';
const electronStore = new ElectronStore({
  configName: 'apecoin-preferences',
  defaults: {},
});

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      secure: true,
      standard: true,
    },
  },
]);

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {

      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration
      // for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    win.loadURL('app://./index.html');
  }

  ipcMain.on('checkAuth', async () => {
    const keyPair = electronStore.get('walletAuth');

    if (keyPair) {
      win.webContents.send('signInWallet', keyPair);
    }
  });

  ipcMain.on('createWallet', async () => {
    const keyPair = genKeyPair();
    win.webContents.send('newWalletCreated', keyPair);
  });
  ipcMain.on('saveNewWallet', async (event, keyPair) => {
    const { filePath, canceled } = await dialog.showSaveDialog(win, {
      defaultPath: path.resolve(app.getPath('desktop'), 'keyPair.txt'),
    });

    if (!canceled) {
      const txtKeyPair = `publicKey(your address): ${keyPair.pub}
privateKey(secret key, don't share it): ${keyPair.priv}`;
      fs.writeFile(filePath, txtKeyPair, (err) => {
        if (err) {
          win.webContents.send('newWalletSaveError');
          return;
        }
        win.webContents.send('newWalletSaved', filePath);
      });
    }
  });

  ipcMain.on('saveAuth', async (event, keyPair) => {
    electronStore.set('walletAuth', keyPair);
  });

  ipcMain.on('deleteAuth', async () => {
    electronStore.delete('walletAuth');
  });
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString());
    }
  }
  await createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}
