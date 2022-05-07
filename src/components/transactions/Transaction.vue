<template>
  <div
    class="transaction"
    :class="{
      income: transaction.type === 'income',
      outcome: transaction.type === 'outcome',
      reward: transaction.type === 'reward',
      inactive: !transaction.confirmed,
    }"
  >
    <div class="transaction-inner">
      <svg
        v-if="transaction.type === 'outcome' || transaction.type === 'income'"
        xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down-circle-fill transaction__icon" viewBox="0 0 16 16">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5
         0 0 0-1 0v5.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0
          0 0-.708-.708L8.5 10.293V4.5z"/>
      </svg>

      <svg
        v-if="transaction.type === 'reward'"
        xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-heart-fill transaction__icon" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8
         15-7.534 4.736 3.562-3.248 8 1.314z"/>
      </svg>

      <div class="transaction__title">
        {{ transaction.type }}
      </div>
      <div class="transaction__content">

        <div
          class="message"
        >
          <div
            v-if="transactionMessage.title"
            class="transaction__subtitle message__title"
          >
            {{ transactionMessage.title }}
          </div>
          <div class="message__text break-all">
            {{ transactionMessage.text }}
          </div>
        </div>

      </div>
    </div>

    <div
      v-if="transaction.fee"
      class="fee"
    >
      <div class="transaction__subtitle">
        Fee:
      </div>
      <div class="fee__amount">{{ transaction.fee }}</div>
    </div>

    <div class="amount">
      <div class="transaction__subtitle">Amount:</div>
      <div class="amount__number">{{ transaction.amount }}</div>
    </div>

    <div
      class="date"
    >{{ transaction.confirmed ? date : 'Not confirmed' }}</div>
  </div>
</template>

<script>
import {
  computed,
  toRefs,
} from 'vue';
import useFormattedTimestamp from '@/use/formattedTimestamp';

export default {
  name: 'Transaction',
  props: {
    transaction: {
      type: Object,
    },
  },
  setup(props) {
    const { transaction } = toRefs(props);
    const transactionMessage = computed(() => {
      switch (transaction.value.type) {
        case 'outcome': {
          return {
            title: 'Receiver:',
            text: transaction.value.senderAddress,
          };
        }
        case 'income': {
          return {
            title: 'Sender:',
            text: transaction.value.senderAddress,
          };
        }
        default: {
          return {
            title: '',
            text: 'This is your reward for mining',
          };
        }
      }
    });

    return {
      transactionMessage,
      date: useFormattedTimestamp(transaction.value.timestamp),
    };
  },
};
</script>

<style lang="scss" scoped>
$errorBg: #ffbab2;
$errorColor: #611A15;
$errorIconCol: #F45448;
$warningBg: #ffe8aa;
$warningColor: #7D3C00;
$warningIconCol: #FFA117;
$infoBg: #E8F4FD;
$infoColor: #0D3C61;
$infoIconCol: #359FF4;
$successBg: #b3ffb3;
$successColor: #1E4640;
$successIconCol: #5CB65F;

.transaction {
  position: relative;
  width: 100%;
  top: 0;
  left: 0;
  padding: 12px 50px;
  margin-bottom: 5px;
  transition: 0.5s ease-out;
  cursor: pointer;
  user-select: none;

  &:last-child {
    margin-bottom: 0;
  }

  .transaction-inner {
    position: relative;
  }

  &__title {
    font-weight: bold;
    text-transform: capitalize;
  }

  &__subtitle {
    font-weight: bold;
    font-size: 14px;
  }

  &__icon {
    $iconSize: 26px;
    width: $iconSize;
    height: $iconSize;

    position: absolute;
    left: -36px;
    top: 0;
  }

  &__content {
    margin-top: 10px;
    padding-bottom: 20px;

    .message {
      display: flex;
      &__title {
        margin-right: 5px;
      }
      &__text {
        font-size: 14px;
      }
    }
  }

  .fee {
    position: absolute;
    left: 16px;
    bottom: 10px;
    display: flex;
    &__amount {
      margin-left: 5px;
      font-weight: bold;
      font-size: 14px;
    }
  }

  .amount {
    position: absolute;
    right: 16px;
    bottom: 10px;
    display: flex;

    &__number {
      margin-left: 5px;
      font-weight: bold;
      font-size: 14px;
    }
  }
  .date {
    font-size: 12px;
    font-weight: 500;
    position: absolute;
    right: 16px;
    top: 10px;
  }
}

.income {
  background-color: $infoBg;
  color: $infoColor;

  &:hover {
    background-color: darken($infoBg, 15%);
  }
  .transaction__icon {
    fill: $infoIconCol;
  }
}
.outcome {
  background-color: $warningBg;
  color: $warningColor;

  .transaction__icon {
    transform: rotate(180deg);
    fill: $warningIconCol;
    transition: .5s ease-in-out;
  }

  &:hover {
    background-color: darken($warningBg, 12%);

    .transaction__icon {
      fill: darken($warningIconCol, 10%);
    }
  }
}
.reward {
  background-color: $successBg;
  color: $successColor;

  .transaction__icon {
    top: 2px;
    $iconSize: 20px;
    height: $iconSize;
    width: $iconSize;
    fill: $successIconCol;
    transition: .5s ease-in-out;
  }

  &:hover {
    background-color: desaturate(darken($successBg, 20%), 45%);
    .transaction__icon {
      fill: darken($successIconCol, 10%);
    }
  }
}

.transaction.inactive {
  cursor: initial;
}
.income.inactive:hover {
  background-color: $infoBg;
  color: $infoColor;
  .transaction__icon {
    fill: $infoIconCol;
  }
}
.outcome.inactive:hover {
  background-color: $warningBg;
  color: $warningColor;
  .transaction__icon {
    fill: $warningIconCol;
  }
}
.reward.inactive:hover {
  background-color: $successBg;
  color: $successColor;
  .transaction__icon {
    fill: $successIconCol;
  }
}

.break-all {
  word-break: break-all;
}
</style>
