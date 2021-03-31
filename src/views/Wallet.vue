<template>
  <div class="wallet">
    <transition name="fade" mode="out-in">
      <WalletAuth
        v-if="!walletAuthed"
      />
      <WalletInner
        v-else
      />
    </transition>
  </div>
</template>

<script>
import WalletAuth from '@/components/wallet/WalletAuth';
import WalletInner from '@/components/wallet/WalletInner';
import { useStore } from 'vuex';
import { computed } from 'vue';

export default {
  name: 'Wallet',
  components: {
    WalletInner,
    WalletAuth,
  },
  setup() {
    const store = useStore();

    return {
      walletAuthed: computed(() => store.getters.walletAuthed),
    };
  },
};
</script>

<style scoped lang="scss">
  .wallet {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }
</style>
