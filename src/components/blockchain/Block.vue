<template>
  <div class="block-container">
    <div :class="{'compressed-connection': isFirst}" class="block-connection" />
    <div
      class="block"
      :class="{'block-is-last': (blockPosition === chainLength - 1)}"
    >
      <div class="block__position">{{blockPosition + 1}}</div>
      <div class="block__hash block__info">
        <span class="title">Hash:</span>
        {{formattedBlockHash}}
      </div>
      <div class="block__date block__info">
        <span class="title">Date:</span>
        {{date}}
      </div>
      <div class="block__difficulty block__info">
        <span class="title">Difficulty:</span>
        {{block.difficulty}}
      </div>
      <div class="block__nonce block__info">
        <span class="title">Nonce:</span>
        {{block.nonce}}
      </div>
      <div class="block__transactions block__info">
        <span class="title">Transactions:</span>
        {{blockTransactionsLength}}
      </div>
    </div>
  </div>
</template>

<script>
import { toRefs, computed } from 'vue';
import useFormattedTimestamp from '@/use/formattedTimestamp';
import { BLOCKCHAIN_WALLET, MINER_WALLET } from '@/assets/core/config';

export default {
  name: 'Block',
  props: {
    block: {
      type: Object,
      required: true,
    },
    blockPosition: {
      type: Number,
      required: true,
    },
    chainLength: {
      type: Number,
      required: true,
    },
    isFirst: {
      type: Boolean,
    },
  },
  setup(props) {
    const { block } = toRefs(props);
    const blockTransactionsLength = computed(() => {
      try {
        const transactions = block.value.data.filter(
          transaction => transaction.input.address !== BLOCKCHAIN_WALLET,
        );
        return transactions.reduce((length, transaction) => {
          transaction.outputs.forEach(output => {
            if (output.address === transaction.input.address) return;
            if (output.address === MINER_WALLET) return;

            length += 1;
          });
          return length;
        }, 0);
      } catch (err) {
        return 0;
      }
    });

    return {
      formattedBlockHash: computed(() => `${block.value.hash.slice(0, 10)}...`),
      date: useFormattedTimestamp(block.value.timestamp),
      blockTransactionsLength,
    };
  },
};
</script>

<style scoped lang="scss">
$blockBgColor: rgba(255, 255, 255, 0.8);
$blockConnectionColor: rgba(255, 255, 255, 0.6);
.block-container {
  padding: 20px;
  width: 340px;

  position: relative;
  .block-connection {
    position: absolute;
    height: 40px;
    width: 40px;
    left: -20px;
    top: 50%;
    transform: translateY(-50%);
    background-color: $blockConnectionColor;
    z-index: -1;
  }
  .compressed-connection {
    width: 0 !important;
  }
  .block {
    $blockSize: 300px;

    z-index: 20;
    overflow: hidden;
    cursor: pointer;
    color: $bgColor;
    height: $blockSize;
    width: $blockSize;
    border-radius: 10px;
    $stripeColor: rgba(255, 255, 255, 0.5);

    background-color: $blockBgColor;
    box-shadow: 0 0 16px rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: background-color .4s ease-out;

    &:hover {
      background-color: darken($blockBgColor, 20%);
    }

    &__position {
      font-size: 50px;
      font-weight: 500;
    }

    &__info {
      margin: 5px;
      font-size: 20px;
      overflow: hidden;

      .title {
        font-weight: 500;
      }
    }

    &__hash {
      margin-top: 20px !important;
      margin-bottom: 5px;
    }

    &__difficulty {
    }

    &__nonce {
    }
  }
}
</style>
