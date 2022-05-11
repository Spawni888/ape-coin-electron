<template>
  <div class="mining-process">
    <div class="online">
      {{ minersNum }}
    </div>
    <CoreButton @click="stopMining">Stop Mining</CoreButton>
  </div>
</template>

<script>
import CoreButton from '@/components/CoreButton';
import { useStore } from 'vuex';
import { computed } from 'vue';

export default {
  name: 'MiningProcess',
  components: { CoreButton },
  setup() {
    const store = useStore();
    const minersNum = computed(() => store.getters.minersNum);

    return {
      stopMining: () => store.dispatch('stopMining'),
      minersNum,
    };
  },
};
</script>

<style scoped lang="scss">
.mining-process {
  .online {
    font-size: 30px;
    font-weight: bold;
    color: #0D3C61FF;
  }
}
</style>
