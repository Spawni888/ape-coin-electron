<template>
  <div
    class="transaction"
    :class="{
      income: transaction.type === 'income',
      outcome: transaction.type === 'outcome',
      reward: transaction.type === 'reward',
    }"
  >
  </div>
</template>

<script>
import { computed, toRefs } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'Transaction',
  props: {
    transaction: {
      type: Object,
    },
  },
  setup(props) {
    const { transaction } = toRefs(props);
    const store = useStore();
    const myAddress = computed(() => store.getters.walletPubKey);
    console.log(transaction.value);
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
  height: 200px;

  position: relative;
  width: 100%;
  top: 0;
  left: 0;
  padding: 12px 50px;
  margin-bottom: 5px;
}

.income {
  background-color: $infoBg;
  color: $infoColor;
}
.outcome {
  background-color: $warningBg;
  color: $warningColor;
}
.reward {
  background-color: $successBg;
  color: $successColor;
}
</style>
