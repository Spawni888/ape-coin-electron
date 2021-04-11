const ChainUtil = require('../chain-util');
const Transaction = require('../wallet/transaction');
const { DIFFICULTY, MINE_RATE } = require('../config');
const { MINING_MODES } = require('../constants');

class Block {
  constructor(timestamp, lastHash, hash, data, nonce, difficulty) {
    this.timestamp = timestamp;
    this.lastHash = lastHash;
    this.hash = hash;
    this.data = data;
    this.nonce = nonce;
    this.difficulty = difficulty || DIFFICULTY;
  }

  toString() {
    return `Block —
      Timestamp : ${ this.timestamp }
      Last Hash : ${ this.lastHash.substring(0, 10) }
      Hash      : ${ this.hash.substring(0, 10) }
      Nonce     : ${ this.nonce }
      Difficulty: ${ this.difficulty }
      Data      : ${ this.data }`;
  }

  static genesis() {
    return new this(Date.now(), '------', 'f1r57-h45h', [], 0, DIFFICULTY);
  }

  static async mineBlock(bc, data, tp) {
    const lastBlock = bc.chain[bc.chain.length - 1];

    const lastHash = lastBlock.hash;
    const dataSizeInMb = ChainUtil.sizeOfObjectInMb(data);
    let timestamp = 0;
    let hash = '';
    let { difficulty } = lastBlock;
    let nonce = 0;
    let tpChanged = false;
    let stopMining = false;
    tp.on('changed', () => tpChanged = true);
    bc.on('stop-mining', () => stopMining = true);

    do {
      if (stopMining) {
        return {
          block: null,
          mode: MINING_MODES.STOP_MINING,
        };
      }
      if (tpChanged && dataSizeInMb < 1) {
        return {
          block: null,
          mode: MINING_MODES.REPEAT_MINING,
        };
      }

      await new Promise(((resolve) => {
        setImmediate(() => {
          nonce++;
          timestamp = Date.now();
          difficulty = Block.adjustDifficulty(lastBlock, timestamp);
          hash = this.createHash(timestamp, lastHash, data, nonce, difficulty);
          resolve()
        });
      }));

    } while (hash.substring(0, difficulty) !== '0'.repeat(difficulty))

    return {
      block: new this(timestamp, lastHash, hash, data, nonce, difficulty),
      mode: MINING_MODES.ADD_BLOCK,
    }
  }

  static createHash(timestamp, lastHash, data, nonce, difficulty) {
    return ChainUtil
      .createHash(`${ timestamp }${ lastHash }${ data }${ nonce }${ difficulty }`);
  }

  static blockHash(block) {
    const { timestamp, lastHash, data, nonce, difficulty } = block;
    return this.createHash(timestamp, lastHash, data, nonce, difficulty);
  }

  static adjustDifficulty(lastBlock, currentTime) {
    let { difficulty } = lastBlock;

    difficulty = lastBlock.timestamp + MINE_RATE > currentTime
      ? difficulty + 1
      : difficulty - 1;

    return Math.max(difficulty, 1);
  }

  static validBlock(block, bc) {
    let rewardTransaction;

    if (!Array.isArray(block.data)) {
      return false;
    }

    const usersTransactions = block.data.filter(transaction => {
      if (transaction.input.signature) {
        return Transaction.verifyTransaction(transaction);
      } else {
        rewardTransaction = transaction;
        return false;
      }
    });

    if (usersTransactions.length + 1 !== block.data.length) {
      console.log('There are should be only one Reward Transaction!')
      return false;
    }
    if (rewardTransaction && Transaction.verifyRewardTransaction(rewardTransaction, usersTransactions, bc)) {
      return true;
    }
    console.log('Wrong reward transaction. Block is corrupted!');
    return false;
  }
}

module.exports = Block;
