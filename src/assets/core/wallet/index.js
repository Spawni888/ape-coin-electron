const { INITIAL_BALANCE } = require('../config');
const Transaction = require('./transaction');
const ChainUtil = require('../chain-util');

class Wallet {
  constructor(privKey = null, pubKey = null) {
    this.balance = INITIAL_BALANCE;
    this.keyPair = ChainUtil.genKeyPair(privKey, pubKey);
    this.publicKey = this.keyPair.getPublic().encode('hex');
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
      console.log(`You can't transact money to yourself`)
      return null;
    }

    amount = parseInt(amount);
    fee = parseInt(fee);
    this.balance = this.calculateBalance(blockchain);

    if (amount + fee > this.balance) {
      console.log(`Amount + fee: ${ amount + fee } exceeds the current balance: ${ this.balance }`);
      return null;
    }

    let transaction = transactionPool.existingTransaction(this.publicKey);

    if (transaction) {
      let totalTransactionAmount = 0;
      transactionPool.transactions.forEach(transaction => {
        if (transaction.input.address === this.publicKey) {
          transaction.outputs.forEach(output => {
            if (output.address !== this.publicKey) {
              totalTransactionAmount += output.amount;
            }
          })
        }
      })

      if (totalTransactionAmount + amount + fee > this.balance) {
        console.log(
          `Amount + fee: ${
            amount + fee 
          } exceeds the current balance: ${ this.balance - totalTransactionAmount }`
        );
        return null;
      }
      transaction.update(this, recipient, amount, fee);
    } else {
      transaction = Transaction.newTransaction(this, recipient, amount, fee);
      transactionPool.updateOrAddTransaction(transaction);
    }
    transactionPool.emit('changed', transaction);

    return transaction;
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

  static blockchainWallet() {
    const blockchainWallet = new this();
    blockchainWallet.address = 'blockchain-wallet';
    return blockchainWallet;
  }
}

module.exports = Wallet;
