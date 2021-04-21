const Block = require('./block');

class Blockchain {
  constructor() {
    this.chain = [Block.genesis()];
  }

  static addBlock(bc, data) {
    return Block.mineBlock(bc, data);
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
    }
    if (!this.isValidChain(newChain)) {
      console.log('The received chain is not valid');
      return;
    }

    console.log('Replacing blockchain with the new chain');
    this.chain = newChain;
    tp.clear();
  }
}

module.exports = Blockchain;
