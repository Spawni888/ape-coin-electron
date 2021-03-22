<template>
  <div class="main">
    <SideBar/>
    <div class="content">
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

export default {
  components: {
    SideBar,
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
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
