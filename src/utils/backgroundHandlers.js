import { ipcMain } from 'electron';
import { fork } from 'child_process';
import path from 'path';
import { P2P_SERVER_TYPES, MINING_TYPES } from '@/resources/constants';

let serverProcess = null;
let miningProcess = null;

const p2pServerHandler = (win, app) => {
  const RESOURCES_PATH = process.env.NODE_ENV === 'production'
    ? path.resolve(app.getAppPath(), '../')
    : path.resolve(__dirname, '../src/resources');

  ipcMain.on('start-p2p-server', (event, serverOptions) => {
    win.webContents.send('server-info', path.join(RESOURCES_PATH, '/childProcesses/p2pProcess.js'));

    if (serverProcess !== null) {
      serverProcess.kill();
      serverProcess = null;
      win.webContents.send('p2p-alert', {
        title: 'Info',
        type: 'info',
        timestamp: Date.now(),
        message: 'Server was already running... It was stopped now. Try again.',
      });
      return;
    }

    serverProcess = fork(path.join(RESOURCES_PATH, '/childProcesses/p2pProcess.js'));
    serverProcess.on('exit', () => {
      console.log('Server Process exited!');
      serverProcess = null;
    });

    serverProcess.send({
      type: P2P_SERVER_TYPES.START_SERVER,
      data: { serverOptions },
    });
    serverProcess.on('message', ({ type, data }) => {
      switch (type) {
        case P2P_SERVER_TYPES.SERVER_STARTED:
          win.webContents.send('p2p-server-started');
          break;
        case P2P_SERVER_TYPES.ALERT:
          win.webContents.send('p2p-alert', data);
          break;
        case P2P_SERVER_TYPES.PROPERTY_CHANGED:
          win.webContents.send('p2p-property-changed', data);
          break;
        case P2P_SERVER_TYPES.TRANSACTION_POOL_CHANGED:
          win.webContents.send('transaction-pool-changed', data);
          break;
        case P2P_SERVER_TYPES.OUTBOUNDS_LIST_CHANGED:
          win.webContents.send('outbounds-list-changed', data);
          break;
        case P2P_SERVER_TYPES.INBOUNDS_LIST_CHANGED:
          win.webContents.send('inbounds-list-changed', data);
          break;
        case P2P_SERVER_TYPES.ERROR:
          console.log(data.error);
          win.webContents.send('server-info', data.error);
          break;
        default:
          break;
      }
    });

    ipcMain.on('stop-p2p-server', () => {
      if (serverProcess === null) return;

      serverProcess.send({ type: P2P_SERVER_TYPES.STOP_SERVER });
      ipcMain.removeAllListeners('stop-p2p-server');
    });
  });
};

const miningHandler = (win, app) => {
  const RESOURCES_PATH = process.env.NODE_ENV === 'production'
    ? path.resolve(app.getAppPath(), '../')
    : path.resolve(__dirname, '../src/resources');

  ipcMain.on('start-mining', (event, info) => {
    win.webContents.send('server-info', path.join(RESOURCES_PATH, '/childProcesses/miningProcess.js'));

    if (miningProcess !== null) {
      miningProcess.kill();
      miningProcess = null;
    }
    miningProcess = fork(path.join(RESOURCES_PATH, '/childProcesses/miningProcess.js'));
    miningProcess.on('exit', () => {
      console.log('Mining Process exited!');
      miningProcess = null;
    });

    miningProcess.send({
      type: MINING_TYPES.START_MINING,
      data: info,
    });

    miningProcess.on('message', ({
      type,
      data,
    }) => {
      switch (type) {
        case MINING_TYPES.BLOCK_HAS_CALCULATED:
          win.webContents.send('block-has-calculated', { block: data.block });
          miningProcess = null;

          if (serverProcess === null) return;
          serverProcess.send({
            type: P2P_SERVER_TYPES.NEW_BLOCK_ADDED,
            data: { block: data.block },
          });

          break;
        case MINING_TYPES.ERROR:
          win.webContents.send('mining-error', { error: data.error });
          break;
        default:
          break;
      }
    });

    ipcMain.on('stop-mining', () => {
      if (miningProcess === null) return;

      miningProcess.kill();
      ipcMain.removeAllListeners('stop-mining');
    });
  });
};

export default {
  p2pServerHandler,
  miningHandler,
};
