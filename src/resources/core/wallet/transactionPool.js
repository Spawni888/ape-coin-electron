const { EventEmitter } = require('events');
const cloneDeep = require('lodash/cloneDeep');
const Transaction = require('./transaction');
const { MINER_WALLET } = require('../config');
const ChainUtil = require('../chain-util');

class TransactionPool extends EventEmitter {
  constructor() {
    super();
    this.transactions = [];
  }

  updateOrAddTransaction(transaction) {
    const sameTransactionIdx = this.transactions.findIndex(t => t.id === transaction.id);

    if (~sameTransactionIdx) {
      this.transactions[sameTransactionIdx] = transaction;
    } else {
      this.transactions.push(transaction);
    }
  }

  getTransactionFromAddress(address) {
    return this.transactions.find(t => t.input.address === address);
  }

  validTransactions() {
    return this.transactions.filter(transaction => {
      const outputTotal = transaction.outputs.reduce(
        (total, output) => total + parseInt(output.amount, 10),
        0,
      );
      if (transaction.input.amount !== outputTotal) {
        console.log(`Invalid transaction from ${transaction.input.address}`);
        return false;
      }

      if (!Transaction.verifyTransaction(transaction)) {
        console.log(`Invalid signature from ${transaction.input.address}`);
        return false;
      }

      return true;
    });
  }

  sortAndFilter() {
    const sortedTransactions = this.transactions.sort((a, b) => {
      let aFee = 0;
      let bFee = 0;

      a.outputs.forEach(output => {
        if (output.address === MINER_WALLET) {
          aFee = output.amount;
        }
      });
      b.outputs.forEach(output => {
        if (output.address === MINER_WALLET) {
          bFee = output.amount;
        }
      });

      return aFee - bFee;
    });

    this.transactions = cloneDeep(sortedTransactions);
    const filteredTransactions = [];

    while (
      ChainUtil.sizeOfObjectInMb(filteredTransactions) < 1
      && sortedTransactions.length > 0
    ) {
      filteredTransactions.push(sortedTransactions.pop());
    }

    return filteredTransactions;
  }

  pickTransactions() {
    this.transactions = this.validTransactions();

    return this.sortAndFilter();
  }

  clear() {
    this.transactions = [];
    this.emit('clear');
  }
}

module.exports = TransactionPool;
