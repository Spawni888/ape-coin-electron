const P2pServer = require('../core/app/p2p-server');
const Blockchain = require('../core/blockchain');
const TransactionPool = require('../core/wallet/transactionPool');
const Block = require('../core/blockchain/block');
const { P2P_SERVER_TYPES } = require('../constants');

let server = null;

try {
  process.on('message', ({ type, data }) => {
    switch (type) {
      case P2P_SERVER_TYPES.START_SERVER: {
        server = new P2pServer(new Blockchain(), new TransactionPool());

        server = new Proxy(server, {
          set(target, prop, value, receiver) {
            process.send({
              type: P2P_SERVER_TYPES.PROPERTY_CHANGED,
              data: {
                prop,
                value,
              },
            });
            return Reflect.set(target, prop, value, receiver);
          },
        });

        server.inbounds = new Proxy(server.inbounds, {
          set(target, prop, value, receiver) {
            process.send({
              type: P2P_SERVER_TYPES.INBOUNDS_LIST_CHANGED,
              data: {
                inboundsList: Object.keys(target),
              },
            });
            return Reflect.set(target, prop, value, receiver);
          },
        });
        server.outbounds = new Proxy(server.outbounds, {
          set(target, prop, value, receiver) {
            process.send({
              type: P2P_SERVER_TYPES.OUTBOUNDS_LIST_CHANGED,
              data: {
                outboundsList: Object.keys(target),
              },
            });
            return Reflect.set(target, prop, value, receiver);
          },
        });

        // alerts
        server.on('info', (msg) => process.send({
          type: P2P_SERVER_TYPES.ALERT,
          data: {
            type: 'info',
            title: 'Info',
            message: msg,
          },
        }));
        server.on('error', (msg) => process.send({
          type: P2P_SERVER_TYPES.ALERT,
          data: {
            type: 'error',
            title: 'Error',
            message: msg,
          },
        }));
        server.on('warning', (msg) => process.send({
          type: P2P_SERVER_TYPES.ALERT,
          data: {
            type: 'warning',
            title: 'Warning',
            message: msg,
          },
        }));
        server.on('success', (msg) => process.send({
          type: P2P_SERVER_TYPES.ALERT,
          data: {
            type: 'success',
            title: 'Success',
            message: msg,
          },
        }));

        // props change
        server.on('property-changed', (propInfo) => process.send({
          type: P2P_SERVER_TYPES.PROPERTY_CHANGED,
          data: propInfo,
        }));

        // eslint-disable-next-line no-shadow
        server.on('transaction-pool-changed', (data) => process.send({
          type: P2P_SERVER_TYPES.TRANSACTION_POOL_CHANGED,
          data,
        }));

        // start server
        server.listen(data.serverOptions, () => process.send({
          type: P2P_SERVER_TYPES.SERVER_STARTED,
        }));
        break;
      }
      case P2P_SERVER_TYPES.NEW_BLOCK_ADDED: {
        if (server === null) return;

        server.blockchain.chain.push(new Block(...Object.values(data.block)));
        server.syncChains();
        break;
      }
      case P2P_SERVER_TYPES.STOP_SERVER: {
        if (server === null) return;

        server.close();
        process.exit(0);
        break;
      }
      default:
        break;
    }
  });
} catch (error) {
  process.send({
    type: 'ERROR',
    data: { error },
  });
}
