<template>
  <div class="main">
    <Header />

    <SideBar/>

    <div id="content" class="content">
      <AppUpdating />

      <transition name="scale-fade"  mode="out-in">
        <div
          v-if="walletAuthed"
          :key="'balance: ' + myBalance"
          class="balance"
        >
          <div class="balance__title">Balance:</div>
          <div class="balance__number">{{ myBalance }}</div>
        </div>
      </transition>

      <transition name="scale-fade" mode="out-in">
        <Alert
          v-if="alertIsShowing"
          style="position: absolute"
        />
      </transition>

      <router-view v-slot="{Component}">
        <transition name="fade" mode="out-in">
          <component :is="Component"/>
        </transition>
      </router-view>

      <Modal
        v-if="updateModalIsUp"
        :modal-info="modalInfo"
        @answer="onAnswer"
      />
    </div>
  </div>
</template>

<script>
import SideBar from '@/components/SideBar';
import Alert from '@/components/Alert';
import { useStore } from 'vuex';
import { computed, onMounted, reactive } from 'vue';
import Header from '@/components/Header';
import AppUpdating from '@/components/AppUpdating';
import Modal from '@/components/Modal';
import { ipcRenderer } from 'electron';
import { TO_BG } from '@/resources/channels';

export default {
  components: {
    AppUpdating,
    Header,
    SideBar,
    Alert,
    Modal,
  },
  setup() {
    const store = useStore();
    const updateModalIsUp = computed(() => store.getters.updateModalIsUp);
    const updateReleaseName = computed(() => store.getters.updateReleaseName);

    const modalInfo = reactive({
      title: 'Update downloaded',
      paragraphs: [
        `
          <div style="font-weight:bold;font-size:12px;line-height:1.8em;">Release Name:</div>
          <div style="font-weight: bold;color: #579bde">${updateReleaseName.value}</div>
        `,
        '<span>Install now?</span>',
      ],
      buttons: [
        {
          name: 'Disagree',
          answer: false,
        },
        {
          name: 'Agree',
          answer: true,
        },
      ],
    });
    const onAnswer = (answer) => {
      ipcRenderer.send(TO_BG.UPDATE_APP, answer);
      store.commit('finishAppUpdate');
    };

    onMounted(() => {
      store.dispatch('initStore');
    });

    return {
      alertIsShowing: computed(() => store.getters.alertIsShowing),
      myBalance: computed(() => Math.floor(store.getters.walletBalance * 100) / 100),
      walletAuthed: computed(() => store.getters.walletAuthed),
      updateModalIsUp,
      updateReleaseName,
      modalInfo,
      onAnswer,
    };
  },
};
</script>

<style lang="scss">
.main {
  display: flex;
  height: 100%;
  background-color: $bgColor;
  flex-wrap: wrap;
  overflow: hidden;

  .header {
    flex: 1 1 100%;
  }
  .sidebar {
    height: calc(100% - 30px);
    width: 260px;
  }
  .content {
    width: calc(100% - 260px);
    height: calc(100% - 30px);
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-grow: 1;

    .balance {
      user-select: none;
      z-index: 10;
      color: $bgColor;
      background-color: $onBgColor;
      opacity: 0.9;

      overflow: hidden;
      border: none;
      border-radius: 5px;
      padding: 10px 18px;
      box-shadow: 0 0 6px rgba(0, 0, 0, 0.6);
      font-size: 16px;

      position: absolute;
      bottom: 20px;
      right: 20px;
      display: flex;
      font-weight: 500;

      &__title {
        margin-right: 10px;
      }

      &__number {
      }
    }
  }
}
</style>
