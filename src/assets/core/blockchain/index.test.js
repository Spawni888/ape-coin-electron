const Blockchain = require('./index');
const Block = require('./block');
const TransitionPool = require('../wallet/transactionPool');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');

describe('Blockchain', () => {
  let bc, bc2, tp, wallet;

  beforeEach(() => {
    bc = new Blockchain();
    bc2 = new Blockchain();
    tp = new TransitionPool();
    wallet = new Wallet();
    wallet.createTransaction('test', 2, bc2, tp);
    tp.transactions.push(Transaction.rewardTransaction(wallet, tp.transactions, bc2));
  })

  it('starts with the genesis block', () => {
    expect(bc.chain[0])
      .toEqual(Block.genesis());
  });

  it('adds a new block', async () => {
    await bc.addBlock(tp.transactions, tp);

    expect(bc.chain[bc.chain.length - 1].data)
      .toEqual(tp.transactions);
  })

  it('validates a valid chain', async () => {
    await bc2.addBlock(tp.transactions, tp);

    expect(bc.isValidChain(bc2.chain)).toBe(true);
  })

  it('invalidates a chain with a corrupt genesis block', () => {
    bc2.chain[0].data = 'Bad data';

    expect(bc.isValidChain(bc2.chain)).toBe(false);
  })

  it('invalidates a corrupt chain', async () => {
    await bc2.addBlock(tp.transactions, tp);
    bc2.chain[1].data = 'Not foo';

    expect(bc.isValidChain(bc2.chain)).toBe(false);
  })

  it('replaces the chain with a valid chain', async () => {
    await bc2.addBlock(tp.transactions, tp);
    bc.replaceChain(bc2.chain);

    expect(bc.chain).toEqual(bc2.chain);
  })

  it('does not replace the chain with one of less length', async () => {
    await bc.addBlock('foo', tp);
    bc.replaceChain(bc2.chain);

    expect(bc.chain).not.toEqual(bc2.chain);
  })

  it('does not replace the chain with one of equal length', async () => {
    await bc.addBlock('foo', tp);
    await bc2.addBlock('tes', tp);
    bc.replaceChain(bc2.chain);

    expect(bc.chain).not.toEqual(bc2.chain);
  })
});
