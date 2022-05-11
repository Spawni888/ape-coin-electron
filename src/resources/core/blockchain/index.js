const Block = require('./block');

class Blockchain {
  constructor() {
    this.chain = [Block.genesis()];
  }

  get lastBlock() {
    return this.chain[this.chain.length - 1];
  }

  static async addBlock(bc, data) {
    // return new Promise((resolve) => {
    //   const block = new Block();
    //
    //   block.mineBlock(bc, data);
    //   block.on('block-mined', resolve);
    // });
    return Block.mineBlock(bc, data);
  }

  isValidChain(chain) {
    if (JSON.stringify(chain[0].hash) !== JSON.stringify(Block.genesis().hash)) {
      console.log('Genesis block hash is wrong!');
      return false;
    }

    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const lastBlock = chain[i - 1];

      if (
        block.lastHash !== lastBlock.hash
        || block.hash !== Block.blockHash(block)
        || !Block.validBlock(block, this)
      ) {
        console.log('block.lastHash !== lastBlock.hash');
        console.log(block.lastHash !== lastBlock.hash);
        console.log(block.lastHash);
        console.log(lastBlock.hash);
        console.log('-'.repeat(10));

        console.log('block.hash !== Block.blockHash(block)');
        console.log(block.hash !== Block.blockHash(block));
        console.log(block.hash);
        console.log(Block.blockHash(block));
        console.log('-'.repeat(10));

        console.log('!Block.validBlock(block, this)');
        console.log(!Block.validBlock(block, this));
        console.log('-'.repeat(10));

        return false;
      }
    }
    return true;
  }

  replaceChain(newChain, tp) {
    if (newChain.length <= this.chain.length) {
      console.log('Received chain is not longer than the current chain');
      return false;
    }
    if (!this.isValidChain(newChain)) {
      console.log('The received chain is not valid');
      return false;
    }

    console.log('Replacing blockchain with the new chain');
    this.chain = newChain;

    // tp.clear();

    return true;
  }
}

module.exports = Blockchain;
