<template>
  <div class="mining-lobby lobby">
    <div class="lobby__title">Mining</div>
    <Stopwatch
      key="mining-stopwatch"
      class="stopwatch"
    />
    <CoreButton ref="mineBtn" @click="startMining">Start Mining</CoreButton>
  </div>
</template>

<script>
import CoreButton from '@/components/CoreButton';
import Stopwatch from '@/components/blockchain/Stopwatch';
import useTooltip from '@/use/tooltip';
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'MiningLobby',
  components: { CoreButton, Stopwatch },
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
.lobby {
  color: $onBgColor;
  height: 100%;
  width: 80%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;

  .stopwatch {
    font-size: 20px;
    margin-bottom: 20px;

    &__title {
      font-size: 10px !important;
    }
  }

  &__title {
    margin-top: 30px;
    margin-bottom: 30px;
    padding: 20px;
    font-size: 40px;
    color: #D1D1D1;
  }

  .core-button {
    //font-size: 20px;
    //padding: 16px 26px;
  }
}
</style>
