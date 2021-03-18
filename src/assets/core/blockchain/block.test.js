const Block = require('./block');
const Wallet = require('../wallet');
const TransitionPool = require('../wallet/transactionPool');
const Transaction = require('../wallet/transaction');
const Blockchain = require('./index');
const { MINE_RATE } = require('../config');

describe('Block', () => {
  let lastBlock, block, wallet, tp, bc;

  beforeEach(async () => {
    wallet = new Wallet();
    bc = new Blockchain();
    tp = new TransitionPool();
    lastBlock = Block.genesis();
    wallet.createTransaction('test', 4, bc, tp);
    tp.transactions.push(Transaction.rewardTransaction(wallet, tp.transactions, bc));
    block = await Block.mineBlock(lastBlock, tp.transactions, tp);
  });

  it('sets the `data` to match the input', () => {
    expect(block.data)
      .toEqual(tp.transactions);
  });

  it('sets the `lastHash` to match the hash of the last block', () => {
    expect(block.lastHash)
      .toEqual(lastBlock.hash)
  });

  it('generates a hash that matches the difficulty', () => {
    expect(block.hash.substring(0, block.difficulty)).toEqual('0'.repeat(block.difficulty));
  });

  it('lowers the difficulty for slowly mined blocks', () => {
    expect(Block.adjustDifficulty(block, block.timestamp + (MINE_RATE + 1)))
      .toEqual(Math.max(block.difficulty - 1, 1));
  });

  it('raises the difficulty for quickly mined blocks', () => {
    expect(Block.adjustDifficulty(block, block.timestamp + (MINE_RATE - 1)))
      .toEqual(block.difficulty + 1);
  });
});
