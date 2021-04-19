<template>
  <div class="peer-to-peer">
    <transition name="fade" mode="out-in">
      <P2pForm
        key="p2pForm"
        v-if="!serverIsUp"
      />
      <P2pInfo
        key="p2pInfo"
        v-else
      />
    </transition>
  </div>
</template>

<script>
import P2pInfo from '@/components/peer2peer/P2pInfo';
import P2pForm from '@/components/peer2peer/P2pForm';
import { useStore } from 'vuex';
import { computed } from 'vue';

export default {
  name: 'PeerToPeer',
  components: {
    P2pForm,
    P2pInfo,
  },
  setup() {
    const store = useStore();
    return {
      serverIsUp: computed(() => store.getters.serverIsUp),
    };
  },
};
</script>

<style scoped lang="scss">
.peer-to-peer {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
