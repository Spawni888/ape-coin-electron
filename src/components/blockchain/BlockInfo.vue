<template>
  <div class="block-info" @click.self="$emit('close')">
    <div class="info-inner">
      <div class="title">Block #{{blockPosition + 1}}</div>
      <div class="hash field">
        <div class="subtitle">Hash:</div>
        <div class="hash-inner break-all">
          {{block.hash}}
        </div>
      </div>
      <div class="date field">
        <span class="subtitle">Date: </span>
        <span>{{date}}</span>
      </div>
      <div class="difficulty field">
        <span class="subtitle">Difficulty: </span>
        <span>{{block.difficulty}}</span>
      </div>
      <div class="nonce field">
        <div class="subtitle">Nonce:</div>
        <div class="nonce-inner break-all">
          {{block.nonce}}
        </div>
      </div>
      <div class="miner field" v-if="miner.address">
        <div class="subtitle">Miner:</div>
        <div class="miner-info subfield">
          <div class="address subtitle-small">Address:</div>
          <div class="break-all field-small">
            {{miner.address}}
          </div>
          <span class="reward subtitle-small">Reward: </span>
          <span>
            {{miner.amount}}
          </span>
        </div>
      </div>
      <div class="transactions field" v-if="transactions.length">
        <div class="subtitle">Transactions:</div>
        <Transaction
          v-for="(transaction, index) in transactions"
          :transaction="transaction"
          :index="index"
          :key="transaction.id"
        ></Transaction>
      </div>
      <div class="btn-container">
        <CoreButton @click="$emit('close')">Close</CoreButton>
      </div>
    </div>
  </div>
</template>

<script>
import useFormattedTimestamp from '@/use/formattedTimestamp';
import { toRefs, computed } from 'vue';
import { BLOCKCHAIN_WALLET } from '@/resources/core/config';
import Transaction from '@/components/blockchain/Transaction';
import CoreButton from '@/components/CoreButton';

export default {
  name: 'BlockInfo',
  components: { CoreButton, Transaction },
  props: {
    block: {
      type: Object,
      required: true,
    },
    blockPosition: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const { block } = toRefs(props);
    const miner = computed(() => {
      try {
        const rewardTransaction = block.value.data.find(
          transaction => transaction.input.address === BLOCKCHAIN_WALLET,
        );
        return rewardTransaction.outputs.find(
          output => output.address !== BLOCKCHAIN_WALLET,
        );
      } catch (err) {
        return 'Nobody...';
      }
    });
    const transactions = computed(() => {
      try {
        return block.value.data.filter(
          transaction => transaction.input.address !== BLOCKCHAIN_WALLET,
        );
      } catch (err) {
        return [];
      }
    });

    return {
      date: useFormattedTimestamp(block.value.timestamp),
      miner,
      transactions,
    };
  },
};
</script>

<style scoped lang="scss">
.block-info {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 11;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  .info-inner {
    padding: 16px 24px;
    box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2),
    0 2px 2px 0 rgba(0, 0, 0, 0.14),
    0 1px 5px 0 rgba(0, 0, 0, 0.12);
    width: 80%;
    border-radius: 3px;
    color: $bgColor;
    z-index: 6;
    background-color: rgba(255, 255, 255, 0.9);
    overflow-y: auto;
    max-height: 80%;

    .title {
      margin-bottom: 20px;

      font-weight: 500;
      font-size: 30px;
    }
    .field {
      margin-bottom: 14px;
    }
    .subfield {
      padding-left: 10px;
      border-left: 1px solid $bgColor;
    }
    .subtitle {
      margin-bottom: 5px;

      font-weight: 500;
      font-size: 20px;
    }
    .subtitle-small {
      margin-bottom: 5px;
      font-weight: 500;
    }
    .field-small {
      margin-bottom: 5px;
    }
    .btn-container {
      display: flex;
      justify-content: flex-end;
    }
  }
}
.break-all {
  word-break: break-all;
}
</style>
