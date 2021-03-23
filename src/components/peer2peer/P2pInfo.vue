<template>
  <div class="p2p-info">
    <div class="p2p-status">Connected</div>
    <div class="p2p-connections">
      <div class="inbounds connection">
        <div class="title">Inbounds</div>
        <transition name="fade" mode="out-in">
          <div class="count" :key="p2pInbounds">{{p2pInbounds}}</div>
        </transition>
      </div>
      <div class="outbounds connection">
        <div class="title">Outbounds</div>
        <transition name="fade" mode="out-in">
          <div class="count" :key="p2pOutbounds">{{p2pOutbounds}}</div>
        </transition>
      </div>
    </div>
    <div class="p2p-btn-container">
      <CoreButton @click="disconnect">Disconnect</CoreButton>
    </div>
    <transition name="fade" mode="out-in">
      <div v-if="myPeerLink" class="p2p-link">
        <div class="title">Your peer link</div>
        <div class="link">{{myPeerLink}}</div>
      </div>
    </transition>
  </div>
</template>

<script>
import { useStore } from 'vuex';
import { computed } from 'vue';
import CoreButton from '@/components/CoreButton';

export default {
  name: 'P2pInfo',
  components: {
    CoreButton,
  },
  setup() {
    const store = useStore();
    return {
      p2pInbounds: computed(() => store.getters.p2pInbounds),
      p2pOutbounds: computed(() => store.getters.p2pOutbounds),
      myPeerLink: computed(() => store.getters.myPeerLink),
      disconnect: () => store.commit('closeServer'),
    };
  },
};
</script>

<style scoped lang="scss">
.p2p-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: $onBgColor;

  .p2p-status {
    margin-bottom: 30px;

    font-size: 50px;
  }
  .p2p-connections {
    margin-bottom: 30px;

    display: flex;

    .inbounds {
      margin-right: 40px;
    }
    .connection {
      width: 50%;
      .title {
        font-size: 30px;
      }
      .count {
        text-align: center;
        font-size: 24px;
      }
    }
  }
  .p2p-btn-container {
    display: flex;
    justify-content: center;
  }
  .p2p-link {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    .title {
      margin-bottom: 10px;

      font-size: 30px;
    }
    .link {
      text-align: center;
      font-size: 20px;
    }
  }
}
</style>
