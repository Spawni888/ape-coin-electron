const Wallet = require('./index');
const TransactionPool = require('./transactionPool');
const Blockchain = require('../blockchain');
const { INITIAL_BALANCE } = require('../config');

describe('Wallet', () => {
  let wallet, tp, bc;

  beforeEach(() => {
    wallet = new Wallet();
    tp = new TransactionPool();
    bc = new Blockchain();
  });

  describe('creating a transaction', () => {
    let transaction, sendAmount, recipient;

    beforeEach(() => {
      sendAmount = 50;
      recipient = 'r4d0m-4dd7md';
      transaction = wallet.createTransaction(recipient, sendAmount, bc, tp);
    });

    describe('and doing the same transaction', () => {
      beforeEach(() => {
        wallet.createTransaction(recipient, sendAmount, bc, tp);
      });

      it('doubles the `sendAmount` subtracted from the wallet balance', () => {
        expect(transaction.outputs.find(output => output.address === wallet.publicKey).amount)
          .toEqual(wallet.balance - sendAmount * 2);
      });

      it('clones the `sendAmount` output for the recipient', () => {
        expect(transaction.outputs.filter(output => output.address === recipient)
          .map(output => output.amount))
          .toEqual([sendAmount, sendAmount]);
      });
    });
  });
  describe('calculating a balance', () => {
    let addBalance, repeatAdd, senderWallet;

    beforeEach(async () => {
      senderWallet = new Wallet();
      addBalance = 1;
      repeatAdd = 3;

      for (let i = 0; i < repeatAdd; i++) {
        senderWallet.createTransaction(wallet.publicKey, addBalance, bc, tp);
      }
      await bc.addBlock(tp.transactions, tp);
    });

    it('calculates the balance for blockchain matching the recipient', () => {
      expect(wallet.calculateBalance(bc)).toEqual(INITIAL_BALANCE + (addBalance * repeatAdd));
    });

    it('calculates the balance for blockchain transactions matching the sender', () => {
      expect(senderWallet.calculateBalance(bc)).toEqual(INITIAL_BALANCE - (addBalance * repeatAdd));
    })

    describe('and the recipient conducts a transaction', () => {
      let subtractBalance, recipientBalance;

      beforeEach(async () => {
        tp.clear();
        subtractBalance = 60;
        recipientBalance = wallet.calculateBalance(bc);
        wallet.createTransaction(senderWallet.publicKey, subtractBalance, bc, tp);
        await bc.addBlock(tp.transactions, tp);
      });

      describe('and the sender sends another transaction to the recipient', () => {
        beforeEach(async () => {
          tp.clear();
          senderWallet.createTransaction(wallet.publicKey, addBalance, bc, tp);
          await bc.addBlock(tp.transactions, tp);
        });

        it('calculates the recipient balance only using transactions since its most recent one', () => {
          expect(wallet.calculateBalance(bc))
            .toEqual(recipientBalance - subtractBalance + addBalance);
        });
      });
    });
  });
});
