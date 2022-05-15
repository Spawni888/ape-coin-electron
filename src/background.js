import {
  app,
  protocol,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
// eslint-disable-next-line no-unused-vars
import installExtension from 'electron-devtools-installer';
import ElectronStore from '@/utils/ElectronStore';
import path from 'path';
import bgHandlers from '@/utils/backgroundHandlers';
import winFade from '@/utils/winAnimation';
import { FROM_APP, FROM_BG, TO_BG } from '@/resources/channels';

const isDevelopment = process.env.NODE_ENV !== 'production';

try {
  const electronStore = new ElectronStore({
    configName: 'ape-coin-data',
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

  let tray = null;
  let mainWin = null;
  let shouldBeUpdated = false;

  const sendP2pForm = () => {
    const form = electronStore.get('p2pForm');
    if (form) {
      mainWin.webContents.send(FROM_BG.LOAD_P2P_FORM, form);
    }
  };

  const createMainWin = async () => {
    const RESOURCES_PATH = !isDevelopment
      ? path.resolve(app.getAppPath(), '../')
      : path.resolve(app.getAppPath(), '../src/resources');
    const WINDOWS_PATH = !isDevelopment
      ? path.resolve(app.getAppPath(), './windows')
      : path.resolve(RESOURCES_PATH, './windows');

    const loadingWin = new BrowserWindow({
      width: 300,
      height: 360,
      icon: path.resolve(__dirname, './assets/icon.ico'),
      titleBarStyle: 'hiddenInset',
      frame: false,
      show: false,
      resizable: false,
    });

    loadingWin.once('show', () => {
      mainWin = new BrowserWindow({
        width: 1000,
        height: 650,
        icon: path.resolve(__dirname, './assets/icon.ico'),
        titleBarStyle: 'hiddenInset',
        frame: false,
        minWidth: 650,
        minHeight: 600,
        webPreferences: {
          enableRemoteModule: true,
          contextIsolation: false,
          // Use pluginOptions.nodeIntegration, leave this alone
          // eslint-disable-next-line max-len
          // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration
          // for more info
          nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
        },
        show: false,
      });

      const MIN_LOADING_TIME = 4000;
      let readyToShow = false;

      const showMainWin = () => {
        if (!readyToShow) {
          readyToShow = true;
          return;
        }
        console.log('main win loaded!');
        mainWin.show();
        loadingWin.hide();
        loadingWin.close();
        sendP2pForm();
      };
      setTimeout(showMainWin, MIN_LOADING_TIME);
      mainWin.webContents.once('ready-to-show', showMainWin);

      // long loading html
      if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        mainWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
        if (!process.env.IS_TEST) mainWin.webContents.openDevTools();
      } else {
        createProtocol('app');
        // Load the index.html when not in development
        mainWin.loadURL('app://./index.html');
      }

      // --------------------------------------------------------------------------
      // Auto updates
      // --------------------------------------------------------------------------
      ipcMain.once(TO_BG.CHECK_APP_UPDATES, () => {
        const alertUI = (alert, onlyLog = false) => {
          mainWin.webContents.send(
            FROM_BG.CONSOLE_LOG,
            alert.message,
          );
          if (onlyLog) return;
          mainWin.webContents.send(
            FROM_APP.ALERT,
            alert,
          );
        };

        autoUpdater.on('checking-for-update', () => {
          alertUI({
            type: 'info',
            title: 'Info',
            message: 'Checking for update...',
          }, true);
        });
        autoUpdater.on('update-available', () => {
          console.log('Update available!');
          mainWin.webContents.send(FROM_BG.APP_UPDATE_AVAILABLE);
        });
        autoUpdater.on('update-not-available', () => {
          alertUI({
            type: 'success',
            title: 'Success',
            message: 'Application is up to date.',
          }, true);
        });

        autoUpdater.on('error', err => {
          console.log(err);
          alertUI({
            type: 'error',
            title: 'Error',
            message: err.message,
          }, true);
        });

        autoUpdater.on('download-progress', progressObj => {
          alertUI({
            type: 'info',
            title: 'Info',
            message: `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`,
          }, true);

          mainWin.webContents.send(
            FROM_BG.APP_UPDATE_PROGRESS,
            {
              percent: progressObj.percent,
              bytesPerSecond: progressObj.bytesPerSecond,
            },
          );
          mainWin.setProgressBar(progressObj.percent / 100);
        });

        autoUpdater.on('update-downloaded', ({ releaseName }) => {
          ipcMain.on(TO_BG.UPDATE_APP, (event, updateNow) => {
            if (updateNow) autoUpdater.quitAndInstall();
          });
          mainWin.webContents.send(FROM_BG.APP_UPDATE_DOWNLOADED, { releaseName });
          shouldBeUpdated = true;
        });

        autoUpdater.checkForUpdatesAndNotify();
      });
    });

    await loadingWin.loadFile(path.resolve(WINDOWS_PATH, 'loading.html'));
    loadingWin.show();

    let isQuiting = false;
    mainWin.on('close', async (event) => {
      if (!isQuiting) {
        event.preventDefault();
        await winFade(mainWin, (win) => win.hide(), 1);
        return;
      }
      if (shouldBeUpdated) {
        event.preventDefault();
        autoUpdater.quitAndInstall(true, false);
      }
      app.quit();
    });

    ipcMain.on(TO_BG.CLOSE_MAIN_WINDOW, async () => {
      await winFade(mainWin, (win) => win.hide(), 1);
    });
    ipcMain.on(TO_BG.HIDE_MAIN_WINDOW, async () => {
      mainWin.minimize();
    });
    // --------------------------------------------------------------------------------------------
    // P2P-Form saving
    // --------------------------------------------------------------------------------------------
    ipcMain.on(TO_BG.SAVE_P2P_FORM, (event, form) => {
      electronStore.set('p2pForm', form);
    });
    ipcMain.on(TO_BG.CHECK_P2P_FORM_SAVING, sendP2pForm);

    // --------------------------------------------------------------------------------------------
    // Peers saving
    // --------------------------------------------------------------------------------------------
    ipcMain.on(TO_BG.SAVE_PEERS, (event, peers) => {
      electronStore.set('peers', JSON.parse(peers));
    });
    ipcMain.on(TO_BG.CHECK_PEERS_SAVING, () => {
      const peers = electronStore.get('peers');
      if (peers) {
        mainWin.webContents.send(FROM_BG.LOAD_PEERS, peers);
      }
    });
    // --------------------------------------------------------------------------------------------
    // Main Handlers
    // --------------------------------------------------------------------------------------------
    bgHandlers.walletHandler(mainWin, electronStore);
    bgHandlers.alertsHandler(mainWin, electronStore);
    bgHandlers.p2pServerHandler(mainWin);
    bgHandlers.miningHandler(mainWin);

    // eslint-disable-next-line no-undef
    tray = new Tray(path.resolve(__static, './tray-icon.png'));

    const openFromTray = async (win) => {
      if (!win.isVisible()) {
        win.setOpacity(0);
        win.show();
        await winFade(win);
      } else if (!win.isFocused()) {
        win.focus();
      }
    };
    tray.setContextMenu(Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: async () => {
          await openFromTray(mainWin);
        },
      },
      {
        label: 'Quit',
        click: () => {
          isQuiting = true;
          mainWin.close();
        },
      },
    ]));

    tray.setToolTip('Ape-coin');
    tray.on('double-click', async () => {
      await openFromTray(mainWin);
    });
    // tray.setContextMenu(contextMenu);
  };

  app.on('activate', async () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) await createMainWin();
  });

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.

  // if (!gotTheLock) {
  //   app.quit();
  // } else {
  //   app.on('second-instance', () => {
  //     // Someone tried to run a second instance, we should focus our window.
  //     if (mainWin) {
  //       if (mainWin.isMinimized()) mainWin.restore();
  //       if (!mainWin.isVisible()) mainWin.show();
  //       mainWin.focus();
  //     }
  //   });
  //
  //   app.on('ready', async () => {
  //     if (isDevelopment && !process.env.IS_TEST) {
  //       // Install Vue Devtools
  //       try {
  //         // demo vue-devtools for vue3 in electron
  //         await installExtension({
  //           id: 'ljjemllljcmogpfapbkkighbhhppjdbg',
  //           electron: '>=1.2.1',
  //         });
  //         // await installExtension(VUEJS_DEVTOOLS);
  //       } catch (e) {
  //         console.error('Vue Devtools failed to install:', e.toString());
  //       }
  //     }
  //     await createMainWin();
  //     sendP2pForm();
  //   });
  // }

  app.on('ready', async () => {
    if (isDevelopment && !process.env.IS_TEST) {
      // Install Vue Devtools
      try {
        // demo vue-devtools for vue3 in electron
        await installExtension({
          id: 'ljjemllljcmogpfapbkkighbhhppjdbg',
          electron: '>=1.2.1',
        });
        // await installExtension(VUEJS_DEVTOOLS);
      } catch (e) {
        console.error('Vue Devtools failed to install:', e.toString());
      }
    }
    await createMainWin();
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
} catch (err) {
  console.log(err);
}
