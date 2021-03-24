<template>
  <div class="main">
    <SideBar/>
    <div id="content" class="content">
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
  }
}
</style>
