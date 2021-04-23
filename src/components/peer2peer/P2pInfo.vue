<template>
  <div class="p2p-info-container">
    <div class="p2p-info">
      <div class="p2p-status">Connected</div>
      <div class="p2p-connections">
        <div class="inbounds connection">
          <div class="title">Inbounds</div>
          <transition name="fade" mode="out-in">
            <div
              class="count"
              :key="'inbounds-quantity' + p2pInboundsQuantity"
            >
              {{ p2pInboundsQuantity }}
            </div>
          </transition>
        </div>
        <div class="outbounds connection">
          <div class="title">Outbounds</div>
          <transition name="fade" mode="out-in">
            <div
              class="count"
              :key="'outbounds-quantity' + p2pOutboundsQuantity"
            >
              {{ p2pOutboundsQuantity }}
            </div>
          </transition>
        </div>
      </div>
      <div class="p2p-btn-container">
        <CoreButton @click="disconnect">Disconnect</CoreButton>
      </div>

      <transition name="fade" mode="out-in">
        <div v-if="myPeerLink" class="p2p-link">
          <div class="title">Your peer link </div>
          <div class="link">{{ myPeerLink }}</div>
        </div>
      </transition>

      <transition name="fade" mode="out-in">
        <div
          v-if="p2pConnectionsExistence"
          class="peers-list"
        >
          <CoreButton @click="modalIsShowing = true">Peers list</CoreButton>
        </div>
      </transition>

    </div>
    <transition name="fade" mode="out-in">
      <Modal
        v-if="modalIsShowing"
        :modal-info="modalInfo"
        @answer="modalIsShowing = false"
      />
    </transition>
  </div>
</template>

<script>
import { useStore } from 'vuex';
import { computed, reactive, ref } from 'vue';
import CoreButton from '@/components/CoreButton';
import Modal from '@/components/Modal';

export default {
  name: 'P2pInfo',
  components: {
    CoreButton,
    Modal,
  },
  setup() {
    const store = useStore();

    const p2pInboundsList = computed(() => store.getters.p2pInboundsList);
    const p2pOutboundsList = computed(() => store.getters.p2pOutboundsList);
    const p2pConnectionsExistence = computed(() => p2pOutboundsList.value.length
      || p2pInboundsList.value.length);

    const modalParagraphs = computed(() => {
      const paragraphs = [];
      if (p2pInboundsList.value.length) {
        paragraphs.push(
          '<span style="font-weight: 500">Inbounds:</span>',
          ...p2pInboundsList.value,
        );
      }
      if (p2pOutboundsList.value.length) {
        paragraphs.push(
          '<span style="font-weight: 500">Outbounds:</span>',
          ...p2pOutboundsList.value,
        );
      }
      return paragraphs;
    });

    const modalIsShowing = ref(false);
    const modalInfo = reactive({
      title: 'Your peers list:',
      paragraphs: modalParagraphs,
      buttons: [
        {
          name: 'Ok',
          answer: true,
        },
      ],
    });

    return {
      p2pInboundsQuantity: computed(() => store.getters.p2pInboundsQuantity),
      p2pOutboundsQuantity: computed(() => store.getters.p2pOutboundsQuantity),
      myPeerLink: computed(() => store.getters.myPeerLink),
      disconnect: () => store.dispatch('closeServer'),
      p2pConnectionsExistence,
      modalIsShowing,
      modalInfo,
    };
  },
};
</script>

<style scoped lang="scss">
.p2p-info-container {
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

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
    text-align: center;
    max-width: 800px;
    word-break: break-word;

    .title {
      margin-bottom: 10px;

      font-size: 30px;
    }

    .link {
      text-align: center;
      font-size: 20px;
    }
  }

  .peers-list {
    position: absolute;
    left: 20px;
    bottom: 20px;
  }
}
</style>
