<template>
  <div class="transactions">
    <transition name="fade" mode="out-in">
      <TransactionsInput
        v-if="!outputReady"
        @show-output="outputReady = true"
      />
      <TransactionsOutput
        v-else
        @hide-output="outputReady = false"
      />
    </transition>
  </div>
</template>

<script>
import TransactionsInput from '@/components/transactions/TransactionsForm';
import TransactionsOutput from '@/components/transactions/TransactionsOutput';
import { ref } from 'vue';

export default {
  name: 'Transactions',
  components: {
    TransactionsInput,
    TransactionsOutput,
  },
  setup() {
    const outputReady = ref(false);

    const showOutput = () => {
      outputReady.value = true;
    };

    return {
      outputReady,
      showOutput,
    };
  },
};
</script>

<style lang="scss" scoped>
.transactions {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
