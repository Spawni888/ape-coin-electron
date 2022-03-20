import { ipcMain, BrowserWindow } from 'electron';
import { fork } from 'child_process';
import path from 'path';
import {
  TO_MINING,
  FROM_MINING,
  FROM_BG,
  TO_BG,
  TO_P2P,
  FROM_P2P,
  FROM_APP,
} from '@/resources/events';

const logToUI = (win, msg) => {
  win.webContents.send(
    FROM_BG.CONSOLE_LOG,
    msg,
  );
};

let p2pWin = null;
let miningWin = null;

const p2pServerHandler = (mainWin, app) => {
  const RESOURCES_PATH = process.env.NODE_ENV === 'production'
    ? path.resolve(app.getAppPath(), '../')
    : path.resolve(__dirname, '../src/resources');

  logToUI(mainWin, `RESOURCES_PATH: ${RESOURCES_PATH}`);

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

    p2pWin = new BrowserWindow({
      // show: false,
      webPreferences: { nodeIntegration: true },
    });
    await p2pWin.loadFile(path.resolve(RESOURCES_PATH, './windows/p2pServer.html'));

    p2pWin.webContents.send(TO_P2P.START_SERVER, serverOptions);

    ipcMain.on(FROM_P2P.TO_UI, (_event, payload) => {
      const { channel, data } = JSON.parse(payload);

      console.log(`Message to UI in channel "${channel}"`);
      if (data) {
        console.log(JSON.stringify(data));
      }
      console.log('-'.repeat(10));

      mainWin.webContents.send(channel, data);
    });

    ipcMain.on(FROM_P2P.ERROR, (_event, error) => {
      mainWin.webContents.send(FROM_BG.CONSOLE_LOG, error);
    });

    p2pWin.on('close', () => {
      ipcMain.removeAllListeners(FROM_P2P.TO_UI);
      // ipcMain.removeAllListeners(FROM_P2P.ERROR);
      // ipcMain.removeAllListeners(TO_BG.STOP_P2P_SERVER);

      p2pWin = null;

      mainWin.webContents.send(FROM_P2P.SERVER_STOPPED);

      mainWin.webContents.send(FROM_APP.ALERT, {
        type: 'info',
        title: 'Info',
        message: 'Server Process exited!',
      });
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

const miningHandler = (mainWin, app) => {
  const RESOURCES_PATH = process.env.NODE_ENV === 'production'
    ? path.resolve(app.getAppPath(), '../')
    : path.resolve(__dirname, '../src/resources');

  ipcMain.on('start-mining', (event, info) => {
    mainWin.webContents.send('server-info', path.join(RESOURCES_PATH, '/childProcesses/miningWin.js'));

    if (miningWin !== null) {
      miningWin.kill();
      miningWin = null;
    }
    miningWin = fork(path.join(RESOURCES_PATH, '/childProcesses/miningWin.js'));
    miningWin.on('exit', () => {
      console.log('Mining Process exited!');
      miningWin = null;
    });

    miningWin.send({
      type: TO_MINING.START_MINING,
      data: info,
    });

    miningWin.on('message', ({
      type,
      data,
    }) => {
      switch (type) {
        case FROM_MINING.BLOCK_HAS_CALCULATED:
          mainWin.webContents.send('block-has-calculated', { block: data.block });
          miningWin = null;

          if (p2pWin === null) return;
          p2pWin.send({
            type: FROM_MINING.NEW_BLOCK_ADDED,
            data: { block: data.block },
          });
          break;
        case FROM_MINING.ERROR:
          mainWin.webContents.send('mining-error', { error: data.error });
          break;
        default:
          break;
      }
    });

    ipcMain.on('stop-mining', () => {
      if (miningWin === null) return;

      miningWin.kill();
      ipcMain.removeAllListeners('stop-mining');
    });
  });
};

export default {
  p2pServerHandler,
  miningHandler,
};
