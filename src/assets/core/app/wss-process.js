const Websocket = require('ws');
const { WSS_TYPES } = require('../constants');
let server = null;

process.on('message', ({ type, data }) => {
  switch (type) {
    case WSS_TYPES.START_SERVER:
      server = new Websocket.Server(data);
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
      }))
      break;

    case WSS_TYPES.STOP_SERVER:
      server.close();
      // test
      setTimeout(() => console.log('CLOSED????'), 0);
      break;
  }
})
