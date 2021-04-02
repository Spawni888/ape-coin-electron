<template>
  <div class="mining-lobby">
    <CoreButton ref="mineBtn" @click="startMining">Start Mining</CoreButton>
  </div>
</template>

<script>
import CoreButton from '@/components/CoreButton';
import useTooltip from '@/use/tooltip';
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'MiningLobby',
  components: { CoreButton },
  setup() {
    const store = useStore();
    const mineBtn = ref(null);

    onMounted(() => {
      useTooltip({
        el: mineBtn.value,
        id: 'mineBtn',
        text: 'Mining is the process of creating new coins by solving a computational puzzle. \n\n'
          + 'Just click this button to start earning ape-coins!',
        maxWidth: 500,
      });
    });

    return {
      mineBtn,
      startMining: () => store.dispatch('startMining'),
    };
  },
};
</script>

<style scoped lang="scss">
.mining-lobby {
  color: $onBgColor;
  height: 100%;
  width: 80%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;

  .core-button {
    font-size: 60px;
    padding: 16px 40px;
  }
}
</style>
