<template>
  <div class="transactions__output">
    <Chips
      :chips="chips"
      :existingTypes="existingTypes"
    />
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

import Chips from '@/components/Chips';

export default {
  name: 'TransactionsOutput',
  components: { Chips },
  setup() {
    const store = useStore();
    const transactions = computed(() => store.getters.walletRelatedTransactions);
    const sortTransactions = (transaction) => transaction.sort((a, b) => b.timestamp - a.timestamp);

    const existingTypes = computed(
      () => transactions.value
        .filter((transaction, index, self) => self.indexOf(transaction) === index)
        .map(transaction => transaction.type),
    );

    const chips = ref([
      {
        name: 'income',
        hidden: !existingTypes.value.includes('error'),
      },
      {
        name: 'outcome',
        hidden: !existingTypes.value.includes('info'),
      },
      {
        name: 'reward',
        hidden: !existingTypes.value.includes('warning'),
      },
    ]);

    const filteredTransactions = computed(() => {
      const chosenTypes = chips.value
        .filter(chip => !chip.hidden)
        .map(chip => chip.name);

      // eslint-disable-next-line arrow-body-style
      return transactions.value.filter(transaction => {
        return chosenTypes.includes(transaction.type)
          && existingTypes.value.includes(transaction.type);
      });
    });

    // const onBeforeLeave = (el) => {
    //   // it's just for nice animation
    //   gsap.set(el, { top: el.offsetTop });
    // };

    return {
      chips,
      transactions,
      existingTypes,
      filteredTransactions,
      sortTransactions,
      // onBeforeLeave,
    };
  },
};
</script>

<style lang="scss" scoped>
.transactions__output {
  width: 100%;
  height: 100%;
}
</style>
