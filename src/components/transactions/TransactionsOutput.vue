<template>
  <div class="transactions__output">
    <div class="chips-container">
      <div
        v-for="chip in chips"
        class="chip"
        :key="'chip' + chip.name"
        :class="{'inactive': chip.hidden}"
        @click="onChipClick(chip)"
      >{{ chip.name }}</div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import gsap from 'gsap';
import { useStore } from 'vuex';

export default {
  name: 'TransactionsOutput',
  setup(props, { emit }) {
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

    const onChipClick = (chip) => {
      if (!chip.hidden) {
        const visibleChipsNum = chips.value
          .map(_chip => !_chip.hidden)
          .filter(Boolean).length;

        if (visibleChipsNum <= 1) return;
      } else if (!existingTypes.value.includes(chip.name)) return;

      chip.hidden = !chip.hidden;
    };

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
      onChipClick,
      // onBeforeLeave,
    };
  },
};
</script>

<style lang="scss" scoped>

</style>
