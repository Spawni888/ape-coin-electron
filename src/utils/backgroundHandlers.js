import { ipcMain } from 'electron';
import { fork } from 'child_process';
import path from 'path';
import { WSS_TYPES, MINING_TYPES } from '@/resources/constants';

// TODO: fix this path in production
const RESOURCES_PATH = process.env.NODE_ENV === 'production'
  ? path.resolve(__dirname, '../../../')
  : path.resolve(__dirname, '../src/resources');

const p2pServerHandler = (win) => {
  ipcMain.on('start-p2p-server', (event, serverOpts) => {
    const serverProcess = fork(path.join(RESOURCES_PATH, '/childProcesses/wssProcess.js'));

    serverProcess.send({
      type: WSS_TYPES.START_SERVER,
      data: { serverOpts },
    });

    serverProcess.on('message', ({ type, data }) => {
      console.log(data);
      switch (type) {
        case WSS_TYPES.CONNECTION:
          win.webContents.send('p2p-connection', { socket: data.socket, req: data.req });
          break;

        case WSS_TYPES.ERROR:
          win.webContents.send('p2p-error', { error: data.error });
          break;

        default:
          break;
      }
    });

    ipcMain.on('close-p2p-server', () => {
      serverProcess.kill();
    });
  });
};

const miningHandler = (win) => {
  let miningProcess = null;
  ipcMain.on('start-mining', (event, info) => {
    if (miningProcess === null) {
      miningProcess = fork(path.join(RESOURCES_PATH, '/childProcesses/miningProcess.js'));
    }

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
          break;
        case MINING_TYPES.ERROR:
          win.webContents.send('mining-error', { error: data.error });
          break;
        default:
          break;
      }
    });

    ipcMain.on('stop-mining', () => {
      miningProcess.kill();
    });
  });
};

export default {
  p2pServerHandler,
  miningHandler,
};
