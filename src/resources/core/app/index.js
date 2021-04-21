const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const Blockchain = require('../blockchain');
const P2pServer = require('./p2p-server');
const Wallet = require('../wallet');
const TransactionPool = require('../wallet/transactionPool');
const Miner = require('./miner');

const HTTP_PORT = process.env.HTTP_PORT || 3001;
// const P2P_PORT = process.env.P2P_PORT || 5001;

const app = new Koa();
app.keys = ['--> stop looking here <--'];
const router = new Router();
const bc = new Blockchain();
const wallet = new Wallet();
const tp = new TransactionPool();
const p2pServer = new P2pServer(bc, tp);
const miner = new Miner(bc, tp, wallet, p2pServer);

router
  .get('/blocks', async ctx => {
    ctx.body = bc.chain;
  })
  .post('/mine', async ctx => {
    const block = await bc.addBlock(ctx.request.body.data);
    console.log(`New block added: ${block.toString()}`);

    p2pServer.syncChains();

    ctx.redirect('/blocks');
  })
  .get('/transactions', async ctx => {
    ctx.body = tp.transactions;
  })
  .get('/balance', async ctx => {
    ctx.body = {
      balance: wallet.calculateBalance(bc),
    };
  })
  .post('/transact', async ctx => {
    const { recipient, amount, fee } = ctx.request.body;
    const transaction = wallet.createTransaction(recipient, amount, bc, tp, fee);
    if (transaction) {
      p2pServer.broadcastTransaction(transaction);
      ctx.redirect('/transactions');
    }
    ctx.body = 'Fail';
  })
  .get('/public-key', async ctx => {
    ctx.body = {
      publicKey: wallet.publicKey,
    };
  })
  .get('/mine-transactions', async ctx => {
    const block = await miner.mine();
    console.log(`New block added: ${block.toString()}`);
    ctx.redirect('/blocks');
  });

app
  .use(bodyParser())
  .use(router.routes()).use(router.allowedMethods());

const server = app.listen(HTTP_PORT, '127.0.0.1', () => console.log(`API running on port ${HTTP_PORT}`));
p2pServer.listen({
  httpServer: server, host: '127.0.0.1', port: HTTP_PORT, ngrokApiKey: '1prGw9xTICzXdUtgFPNYd1k5GPa_2xsehKK86f7qvSnDSJU1W',
}, () => console.log(`Listening for peer-to-peer connections on: ${HTTP_PORT}`));
