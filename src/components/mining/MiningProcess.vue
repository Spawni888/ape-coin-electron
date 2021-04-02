<template>
  <div class="mining-process">
    <CoreButton @click="stopMining">Stop Mining</CoreButton>
  </div>
</template>

<script>
import CoreButton from '@/components/CoreButton';
import { useStore } from 'vuex';

export default {
  name: 'MiningProcess',
  components: { CoreButton },
  setup() {
    const store = useStore();

    return {
      stopMining: () => store.dispatch('stopMining'),
    };
  },
};
</script>

<style scoped lang="scss">
.mining-process {

}
</style>
