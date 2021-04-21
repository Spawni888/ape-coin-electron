<template>
  <div class="transaction">
    <div class="title">#{{ index + 1 }}:</div>
    <div class="transaction-inner">
      <div class="from">
        <div class="subtitle">From:</div>
        <div class="address break-all">
          {{transaction.input.address}}
        </div>
      </div>
      <div class="recipients">
        <div
          v-for="(recipient) in recipients"
          :key="'recipient' + recipient.address.slice(0, 10)"
          class="recipient"
        >
          <div class="subtitle-small">To:</div>
          <div class="address break-all">
            {{recipient.address}}
          </div>
          <div class="amount subfield">
            <span class="subtitle-small">Amount: </span>
            <span class="amount">{{recipient.amount}}</span>
          </div>
        </div>
        <div v-if="fee > 0" class="fee subfield">
          <span class="subtitle-small">Fee: </span>
          <span class="amount">{{fee}}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, toRefs } from 'vue';
import { MINER_WALLET } from '@/resources/core/config';

export default {
  name: 'Transaction',
  props: {
    transaction: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const { transaction } = toRefs(props);
    const fee = ref(0);
    const recipients = computed(() => {
      try {
        return transaction.value.outputs
          .filter(output => {
            if (output.address === MINER_WALLET) {
              fee.value = output.amount;
              return false;
            }
            return output.address !== transaction.value.input.address;
          });
      } catch (err) {
        return 'I Don`t know';
      }
    });

    return {
      recipients,
      fee,
    };
  },
};
</script>

<style scoped lang="scss">
.transaction {
  margin-bottom: 10px;

  .transaction-inner {
    padding-left: 10px;
    border-left: 1px solid $bgColor;
  }
  .title {
    font-weight: 500;
  }
  .subtitle {
    margin-top: 5px;
    margin-bottom: 5px;

    font-weight: 500;
    font-size: 16px;
  }
  .subtitle-small {
    margin-top: 5px;
    margin-bottom: 5px;
    font-weight: 500;
  }
  .subfield {
    margin-top: 3px;
  }
  .from {
  }
  .recipients {
    padding-left: 10px;
    margin-left: 10px;
    border-left: 1px solid $bgColor;
    .recipient {
      border-bottom: 1px solid $bgColor;
      margin-bottom: 10px;
      padding-bottom: 10px;
    }
  }
}
.break-all {
  word-break: break-all;
}
</style>
