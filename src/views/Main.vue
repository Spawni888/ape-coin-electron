<template>
  <div class="main">
    <SideBar />
    <div class="content">
      <router-view />
    </div>
  </div>
</template>

<script>
import SideBar from '@/components/SideBar';

export default {
  name: 'Main',
  components: {
    SideBar,
  },
};
</script>

<style scoped lang="scss">
.main {
  display: flex;
  height: 100%;
  background-color: $bgColor;
  > * {
    width: 100%;
  }
}
</style>
