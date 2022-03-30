import { ipcMain, BrowserWindow, app } from 'electron';
import path from 'path';
import {
  TO_MINING,
  FROM_MINING,
  FROM_BG,
  TO_BG,
  TO_P2P,
  FROM_P2P,
  FROM_APP, FROM_UI,
} from '@/resources/channels';

const logToUI = (win, msg) => {
  win.webContents.send(
    FROM_BG.CONSOLE_LOG,
    msg,
  );
};

const proxyLogger = (_event, payload, win) => {
  if (win === null) return;

  const { channel, data } = JSON.parse(payload);

  console.log(`Message in channel "${channel}"`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  console.log('-'.repeat(10));

  win.webContents.send(channel, data);
};

const isProd = process.env.NODE_ENV === 'production';
const RESOURCES_PATH = isProd
  ? path.resolve(app.getAppPath(), '../')
  : path.resolve(app.getAppPath(), '../src/resources');
const WINDOWS_PATH = isProd
  ? path.resolve(app.getAppPath(), './windows')
  : path.resolve(RESOURCES_PATH, './windows');

const createWindow = async fileName => {
  const win = new BrowserWindow({
    // show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  await win.loadFile(path.resolve(WINDOWS_PATH, fileName));
  console.log(`Window ${fileName} was created`);
  return win;
};

let p2pWin = null;
let miningWin = null;

const p2pServerHandler = (mainWin) => {
  // logToUI(mainWin, `RESOURCES_PATH: ${RESOURCES_PATH}`);
  ipcMain.on(FROM_UI.TO_P2P, (...args) => proxyLogger(...args, p2pWin));

  ipcMain.on(TO_BG.START_P2P_SERVER, async (event, serverOptions) => {
    if (p2pWin !== null) {
      p2pWin.close();

      mainWin.webContents.send(FROM_APP.ALERT, {
        title: 'Info',
        type: 'info',
        timestamp: Date.now(),
        message: 'Server was already running... It was stopped now. Try again.',
      });
      return;
    }

    p2pWin = await createWindow('p2pServer.html');
    p2pWin.webContents.send(TO_P2P.START_SERVER, serverOptions);

    ipcMain.on(FROM_P2P.TO_UI, (...args) => proxyLogger(...args, mainWin));

    ipcMain.once(FROM_P2P.ERROR, (_event, error) => {
      mainWin.webContents.send(FROM_BG.CONSOLE_LOG, error);
      p2pWin.close();
    });

    p2pWin.on('close', () => {
      ipcMain.removeAllListeners(FROM_P2P.TO_UI);
      p2pWin = null;

      mainWin.webContents.send(FROM_P2P.SERVER_STOPPED);

      console.log(`%c
      --------------------------------
      --------------------------------
      --> P2P SERVER WINDOW CLOSED <--
      --------------------------------
      --------------------------------
      `, 'color: #eb4034');
    });
  });

  ipcMain.on(TO_BG.STOP_P2P_SERVER, () => {
    if (p2pWin === null) return;
    p2pWin.close();
  });
};

const miningHandler = (mainWin) => {
  ipcMain.on(TO_BG.START_MINING, async (event, info) => {
    if (miningWin !== null) {
      miningWin.close();
    }

    miningWin = await createWindow('mining.html');
    miningWin.send(TO_MINING.START_MINING, info);

    ipcMain.on(FROM_MINING.TO_UI, (...args) => proxyLogger(...args, mainWin));

    ipcMain.once(FROM_MINING.ERROR, (_event, error) => {
      mainWin.webContents.send(FROM_BG.CONSOLE_LOG, error);
      miningWin.close();
    });

    miningWin.on('close', () => {
      ipcMain.removeAllListeners(FROM_MINING.TO_UI);
      miningWin = null;

      mainWin.webContents.send(FROM_MINING.MINING_STOPPED);
      console.log(`%c
      --------------------------------
      --------------------------------
      ----> MINING WINDOW CLOSED <----
      --------------------------------
      --------------------------------
      `, 'color: #eb4034');
    });
  });

  ipcMain.on(TO_BG.STOP_MINING, () => {
    if (miningWin === null) return;
    miningWin.close();
  });
};

export default {
  p2pServerHandler,
  miningHandler,
};
