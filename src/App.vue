<template>
  <div class="main">
    <SideBar/>
    <div id="content" class="content">

      <transition name="fade"  mode="out-in">
        <div
          v-if="walletAuthed"
          class="balance"
        >
          <div class="balance__title">Balance:</div>
          <div class="balance__number">{{ myBalance }}</div>
        </div>
      </transition>

      <transition name="scale-fade" mode="out-in">
        <Alert
          v-if="alertIsShowing"
        />
      </transition>

      <router-view v-slot="{Component}">
        <transition name="fade" mode="out-in">
          <component :is="Component"/>
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script>
import SideBar from '@/components/SideBar';
import Alert from '@/components/Alert';
import { useStore } from 'vuex';
import { computed } from 'vue';

export default {
  components: {
    SideBar,
    Alert,
  },
  setup() {
    const store = useStore();

    return {
      alertIsShowing: computed(() => store.getters.alertIsShowing),
      myBalance: computed(() => store.getters.walletBalance),
      walletAuthed: computed(() => store.getters.walletAuthed),
    };
  },
};
</script>

<style lang="scss">
.main {
  display: flex;
  height: 100%;
  background-color: $bgColor;

  > * {
    width: 100%;
  }

  .content {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;

    .balance {
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
