const Websocket = require('ws');
const { WSS_TYPES } = require('../constants');

let server = null;

process.on('message', ({ type, data }) => {
  switch (type) {
    case WSS_TYPES.START_SERVER: {
      server = new Websocket.Server(data.serverOpts);

      server.on('connection', (socket, req) => process.send({
        type: WSS_TYPES.CONNECTION,
        data: {
          socket,
          req,
        },
      }));
      server.on('error', error => process.send({
        type: WSS_TYPES.ERROR,
        data: { error },
      }));
      break;
    }
    default:
      break;
  }
});
