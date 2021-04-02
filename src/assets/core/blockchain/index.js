const Block = require('./block');
const { EventEmitter } = require('events');

class Blockchain extends EventEmitter {
  constructor() {
    super();
    this.chain = [Block.genesis()];
  }

  async addBlock(data, tp) {
    const miningInfo = await Block.mineBlock(this, data, tp);

    if (miningInfo.block !== null) {
      this.chain.push(miningInfo.block);
    }

    return miningInfo;
  }

  isValidChain(chain) {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;

    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const lastBlock = chain[i - 1];

      if (
        block.lastHash !== lastBlock.hash
        || block.hash !== Block.blockHash(block)
        || !Block.validBlock(block, this)
      ) {
        return false;
      }
    }
    return true;
  }

  replaceChain(newChain, tp) {
    if (newChain.length <= this.chain.length) {
      console.log('Received chain is not longer than the current chain');
      return;
    } else if (!this.isValidChain(newChain)) {
      console.log('The received chain is not valid');
      return;
    }

    console.log('Replacing blockchain with the new chain');
    this.chain = newChain;
    tp.clear();
  }
}

module.exports = Blockchain;
