const { INITIAL_BALANCE, BLOCKCHAIN_WALLET } = require('../config');
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
      publicKey: ${this.publicKey.toString()}
      balance: ${this.balance}`;
  }

  sign(dataHash) {
    return this.keyPair.sign(dataHash);
  }

  createTransaction(recipient, amount, blockchain, transactionPool, fee = 0) {
    if (recipient === this.publicKey) {
      return {
        transaction: null,
        msg: 'You can\'t transact money to yourself',
      };
    }

    amount = parseInt(amount, 10);
    fee = parseInt(fee, 10);
    this.balance = this.calculateBalance(blockchain);

    if (amount + fee > this.balance) {
      return {
        transaction: null,
        msg: `Amount + fee: ${amount + fee} exceeds the current balance: ${this.balance}`,
      };
    }

    let transaction = transactionPool.getTransactionFromAddress(this.publicKey);

    if (transaction) {
      let totalTransactionAmount = 0;

      transaction.outputs.forEach(output => {
        if (output.address === this.publicKey) return;
        totalTransactionAmount += output.amount;
      });

      if (totalTransactionAmount + amount + fee > this.balance) {
        const msg = `Amount + fee: ${
          amount + fee
        } exceeds the current balance: ${this.balance - totalTransactionAmount}`;

        return {
          transaction: null,
          msg,
        };
      }
      transaction.update(this, recipient, amount, fee);
    } else {
      transaction = Transaction.newTransaction(this, recipient, amount, fee);
      transactionPool.replaceOrAddTransaction(transaction);
    }
    // transactionPool.emit('changed', transaction);

    this.calculateBalanceWithTpIncluded(transactionPool);

    return { transaction };
  }

  calculateBalance(blockchain) {
    let balance = INITIAL_BALANCE;
    const transactions = [];

    blockchain.chain.forEach(block => block.data.forEach(transaction => {
      transactions.push(transaction);
    }));

    const walletInputTs = transactions
      .filter(transaction => transaction.input.address === this.publicKey);

    let startTime = 0;

    if (walletInputTs.length > 0) {
      const recentInputT = walletInputTs.reduce(
        (prev, current) => (prev.input.timestamp > current.input.timestamp
          ? prev
          : current),
      );

      balance = recentInputT.outputs.find(output => output.address === this.publicKey).amount;
      startTime = recentInputT.input.timestamp;
    }

    transactions.forEach(transaction => {
      if (transaction.input.timestamp <= startTime) return;
      if (transaction.input.address === this.publicKey) return;

      transaction.outputs.find(output => {
        if (output.address !== this.publicKey) return;
        balance += output.amount;
      });
    });

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
          });
          return;
        }
        transaction.outputs.forEach(output => {
          if (output.address === this.publicKey) {
            this.balanceWithTpIncluded += output.amount;
          }
        });
      });
  }

  getNewWalletRelatedTransactions(oldRelatedTransactions, bc, tp = []) {
    const relatedTransactionIDsMap = {};
    const newRelatedTransactions = [];

    oldRelatedTransactions.forEach(transaction => {
      relatedTransactionIDsMap[transaction.id] = transaction;
    });

    const pushIfRelated = (transaction) => {
      for (const output of transaction.outputs) {
        if (output.address === this.publicKey) {
          if (!relatedTransactionIDsMap[transaction.id]) {
            newRelatedTransactions.push(transaction);
          }
          break;
        }
      }
    };

    bc.forEach(block => {
      block.data.forEach(pushIfRelated);
    });
    tp.forEach(pushIfRelated);

    console.log('-'.repeat(10));
    console.log('walletRelatedTransactions');
    console.log(newRelatedTransactions);
    console.log('-'.repeat(10));
    return newRelatedTransactions;
  }

  static blockchainWallet() {
    const blockchainWallet = new this();
    blockchainWallet.address = this.getBlockchainAddress();
    return blockchainWallet;
  }

  static getBlockchainAddress() {
    return BLOCKCHAIN_WALLET;
  }
}

module.exports = Wallet;
