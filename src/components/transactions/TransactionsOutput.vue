<template>
  <div class="transactions__output">
    <Chips
      :chips="chips"
      :existingTypes="existingTypes"
      @updated="updateList"
    >
      <div class="wallet-balance">
        <div class="title">Wallet Balance:</div>
        <div class="content">
          {{ balance }}
        </div>
      </div>
    </Chips>
    <InfinityScroll
      :listKey="listKey"
      :allItemsLoaded="allItemsLoaded"
      @request-items="addMoreTransactions"
    >
      <Transaction
        v-for="transaction in filterTransactions(formattedTransactions)"
        :transaction="transaction"
        :key="transaction.id"
      />
    </InfinityScroll>
  </div>
</template>

<script>
import {
  ref,
  computed,
} from 'vue';
import { useStore } from 'vuex';

import Chips from '@/components/Chips';
import InfinityScroll from '@/components/InfinityScroll';
import Transaction from '@/components/transactions/Transaction';
import { MINER_WALLET } from '@/resources/core/config';
import { cloneDeep } from 'lodash';

export default {
  name: 'TransactionsOutput',
  components: { Chips, InfinityScroll, Transaction },
  setup() {
    const store = useStore();
    const transactions = computed(() => store.getters.walletRelatedTransactions);
    const transactionsSlice = ref([...store.getters.walletRelatedTransactions?.slice(0, 19)]);
    const selectedAddress = computed(() => store.getters.selectedWalletAddress);
    const balance = computed(() => store.getters.selectedWalletBalance);

    const existingTypes = computed(
      () => transactions.value
        .filter((transaction, index, self) => self.indexOf(transaction) === index)
        .map(transaction => transaction.type),
    );

    const chips = ref([
      {
        name: 'income',
        active: existingTypes.value.includes('income'),
      },
      {
        name: 'outcome',
        active: existingTypes.value.includes('outcome'),
      },
      {
        name: 'reward',
        active: existingTypes.value.includes('reward'),
      },
    ]);

    const formattedTransactions = computed(() => {
      const result = [];

      const addMoreInfo = (output, _transaction, _index) => {
        output.id = `${_transaction.id}-${_index}`;
        output.type = _transaction.type;
        output.senderAddress = _transaction.input.address;
        output.timestamp = _transaction.input.timestamp;

        output.blockHash = _transaction.blockHash;
        output.blockIndex = _transaction.blockIndex;
        output.confirmed = !!_transaction.confirmed;
      };

      return transactionsSlice.value.map(_transaction => {
        switch (_transaction.type) {
          case 'outcome': {
            _transaction.outputs
              .forEach((_output, _index, _outputs) => {
                const output = cloneDeep(_output);

                if (_output.address === MINER_WALLET) return;
                if (_outputs[_index + 1].address === MINER_WALLET) {
                  output.fee = _outputs[_index + 1].amount;
                }

                addMoreInfo(output, _transaction, _index);
                result.push(output);
              });
            break;
          }
          case 'income': {
            _transaction.outputs
              .forEach((_output, _index) => {
                const output = cloneDeep(_output);

                if (_output.address !== selectedAddress.value) return;
                addMoreInfo(output, _transaction, _index);

                result.push(output);
              });
            break;
          }
          case 'reward': {
            _transaction.outputs
              .forEach((_output, _index) => {
                const output = cloneDeep(_output);

                addMoreInfo(output, _transaction, _index);
                result.push(output);
              });
            break;
          }
          default:
            break;
        }

        return result;
      });
    });

    const filterTransactions = (_transactions) => {
      const chosenTypes = chips.value
        .filter(chip => chip.active)
        .map(chip => chip.name);

      return _transactions[0]?.filter(transaction => {
        return chosenTypes.includes(transaction.type)
          && existingTypes.value.includes(transaction.type);
      });
    };

    const listKey = ref('list-key:true');
    const updateList = () => {
      const keyValue = listKey.value.split(':')[1] === 'true';
      listKey.value = `list-key:${!keyValue}`;
    };

    const allItemsLoaded = ref(false);
    const addMoreTransactions = () => {
      const curSliceLength = transactionsSlice.value.length;

      transactionsSlice.value.push(
        ...transactions.value.slice(curSliceLength, curSliceLength + 20),
      );

      if (transactionsSlice.value.length === transactions.value.length) {
        allItemsLoaded.value = true;
      }
    };

    // onMounted(() => {
    //   watch(transactions.value, (value) => {
    //     // initial load
    //     if (!transactionsSlice.value.length && value.length) {
    //       transactionsSlice.value.push(...value?.slice(0, 20));
    //       return;
    //     }
    //     transactionsSlice.value.unshift(value[0]);
    //   });
    // });

    return {
      transactionsSlice,
      selectedAddress,
      balance,
      existingTypes,
      chips,
      formattedTransactions,
      filterTransactions,
      listKey,
      updateList,
      allItemsLoaded,
      addMoreTransactions,
    };
  },
};
</script>

<style lang="scss" scoped>
.transactions__output {
  background-color: #0d0d0d;
  z-index: 9;
  width: 100%;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;

  .wallet-balance {
    font-weight: bold;
    display: flex;

    user-select: none;
    z-index: 10;
    background-color: lighten($surfaceColor, 40%);
    color: $onSurfaceColor;
    font-size: 16px;

    //box-shadow: 0 0 6px rgba(0, 0, 0, 0.6);

    overflow: hidden;
    border: none;
    border-radius: 5px;
    padding: 8px 14px;

    .title {
      font-size: 14px;
      margin-right: 5px;
    }
    .content {
      font-size: 14px;
    }
  }
}
</style>
