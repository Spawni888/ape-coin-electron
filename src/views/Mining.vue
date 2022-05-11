<template>
  <div class="mining">
    <transition name="fade" mode="out-in">
      <MiningLobby
        v-if="!miningIsUp"
      />
      <MiningProcess
        v-else
      />
    </transition>
  </div>
</template>

<script>
import MiningLobby from '@/components/mining/MiningLobby';
import MiningProcess from '@/components/mining/MiningProcess';
import { useStore } from 'vuex';
import { computed, onBeforeUnmount } from 'vue';

export default {
  name: 'Mining',
  components: {
    MiningProcess,
    MiningLobby,
  },
  setup() {
    const store = useStore();

    const interval = setInterval(() => {
      store.commit('adjustDifficulty');
    }, 4000);

    onBeforeUnmount(() => {
      clearInterval(interval);
    });

    return {
      miningIsUp: computed(() => store.getters.miningIsUp),
    };
  },
};
</script>

<style scoped lang="scss">
.mining {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}
</style>
