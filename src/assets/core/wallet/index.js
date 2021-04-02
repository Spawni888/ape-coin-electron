const { INITIAL_BALANCE } = require('../config');
const Transaction = require('./transaction');
const ChainUtil = require('../chain-util');

class Wallet {
  constructor(privKey = null, pubKey = null) {
    this.balance = INITIAL_BALANCE;
    this.keyPair = ChainUtil.genKeyPair(privKey, pubKey);
    this.publicKey = this.keyPair.getPublic().encode('hex');

    // balance calculated with transactions from transaction pool;
    this.balanceWithTpIncluded = this.balance;
  }

  toString() {
    return `Wallet —
      publicKey: ${ this.publicKey.toString() }
      balance: ${ this.balance }`;
  }

  sign(dataHash) {
    return this.keyPair.sign(dataHash);
  }

  createTransaction(recipient, amount, blockchain, transactionPool, fee = 0) {
    if (recipient === this.publicKey) {
      return {
        res: null,
        msg: `You can't transact money to yourself`,
      };
    }

    amount = parseInt(amount);
    fee = parseInt(fee);
    this.balance = this.calculateBalance(blockchain);

    if (amount + fee > this.balance) {
      return {
        res: null,
        msg: `Amount + fee: ${ amount + fee } exceeds the current balance: ${ this.balance }`,
      };
    }

    let transaction = transactionPool.existingTransaction(this.publicKey);

    if (transaction) {
      let totalTransactionAmount = 0;

      transaction.outputs.forEach(output => {
        if (output.address !== this.publicKey) {
          totalTransactionAmount += output.amount;
        }
      })

      if (totalTransactionAmount + amount + fee > this.balance) {
        const msg = `Amount + fee: ${
          amount + fee
        } exceeds the current balance: ${this.balance - totalTransactionAmount}`;

        return {
          res: null,
          msg,
        };
      }
      transaction.update(this, recipient, amount, fee);
    } else {
      transaction = Transaction.newTransaction(this, recipient, amount, fee);
      transactionPool.updateOrAddTransaction(transaction);
    }
    transactionPool.emit('changed', transaction);

    this.calculateBalanceWithTpIncluded(transactionPool);

    return { res: transaction };
  }

  calculateBalance(blockchain) {
    let balance = this.balance;
    const transactions = [];

    blockchain.chain.forEach(block => block.data.forEach(transaction => {
      transactions.push(transaction);
    }))

    const walletInputTs = transactions
      .filter(transaction => transaction.input.address === this.publicKey)

    let startTime = 0;

    if (walletInputTs.length > 0) {
      const recentInputT = walletInputTs.reduce(
        (prev, current) => prev.input.timestamp > current.input.timestamp
          ? prev
          : current
      );

      balance = recentInputT.outputs.find(output => output.address === this.publicKey).amount;
      startTime = recentInputT.input.timestamp;
    }

    transactions.forEach(transaction => {
      if (transaction.input.timestamp > startTime) {
        transaction.outputs.find(output => {
          if (output.address === this.publicKey) {
            balance += output.amount;
          }
        })
      }
    })

    return balance;
  }

  calculateBalanceWithTpIncluded(transactionPool) {
    this.balanceWithTpIncluded = this.balance;

    transactionPool.transactions
      .forEach(transaction => {
        if (transaction.input.address === this.publicKey) {
          transaction.outputs.forEach(output => {
            if (output.address !== this.publicKey) {
              this.balanceWithTpIncluded -= output.amount;
            }
          })
        }
      });
  }

  static blockchainWallet() {
    const blockchainWallet = new this();
    blockchainWallet.address = 'blockchain-wallet';
    return blockchainWallet;
  }
}

module.exports = Wallet;
