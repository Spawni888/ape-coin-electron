<template>
  <nav class="sidebar">
    <div class="logo">
      <div class="logo__container">
        <img :src="require('@/assets/images/sidebar/gorilla1.png')" alt="logotype">
      </div>
      <div class="logo__name">
        Ape-coin
      </div>
    </div>
    <div class="features">
      <router-link
        v-for="feature in features"
        custom
        v-slot="{navigate, isActive}"
        :key="feature.name"
        :to="{name: feature.route}"
      >
        <div
          class="feature"
          :class="[
            {'active': isActive, 'deactive': feature.deactiveCondition},
            feature.className
          ]"
          @click="navigate"
        >
          <div class="feature__icon">
            <div
              class="img"
              :style="{'maskImage': `url(${feature.imgSrc})`}"
            />
            <div
              v-if="feature.indicator"
              class="feature__indicator"
              :class="{'serverIsUp': feature.serverIsUp}"
            />
          </div>
          <div class="feature__name">
            {{ feature.name }}
          </div>
        </div>
      </router-link>
    </div>
  </nav>
</template>

<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import p2pImg from '@/assets/images/sidebar/electricity.svg';
import walletImg from '@/assets/images/sidebar/wallet2.svg';
import miningImg from '@/assets/images/sidebar/pick.svg';

export default {
  name: 'SideBar',
  setup() {
    const store = useStore();
    const walletAuthed = computed(() => store.getters.walletAuthed);
    const serverIsUp = computed(() => store.getters.serverIsUp);
    const features = ref([
      {
        name: 'Peer-to-peer',
        className: 'p2p',
        imgSrc: p2pImg,
        route: 'p2p',
        indicator: true,
        serverIsUp,
      },
      {
        name: 'Wallet',
        className: 'wallet',
        imgSrc: walletImg,
        route: 'wallet',
        deactiveCondition: computed(() => !serverIsUp.value),
      },
      {
        name: 'Mining',
        className: 'mining',
        imgSrc: miningImg,
        route: 'mining',
        deactiveCondition: computed(() => !serverIsUp.value || !walletAuthed.value),
      },
    ]);

    return {
      features,
    };
  },
};
</script>

<style scoped lang="scss">
.sidebar {
  padding: 20px 0;

  flex: 1 0 260px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  background-color: $surfaceColor;

  .logo {
    display: flex;
    flex-direction: column;
    align-items: center;

    &__container {
      display: flex;
      justify-content: center;

      img {
        display: block;
        width: 100%;
        height: auto;
        max-width: 50%;
      }
    }

    &__name {
      margin-top: 5px;

      font-weight: 500;
      font-size: 20px;
      color: $onSurfaceColor;
    }
  }

  .features {
    margin-top: 40px;

    .feature {
      padding: 20px 20px;

      overflow: hidden;
      position: relative;

      width: 100%;
      transition: .4s ease;
      cursor: pointer;
      display: flex;
      justify-content: left;
      align-items: center;

      &:hover {
        background-color: lighten($surfaceColor, 20%);
      }

      &__icon {
        margin-right: 20px;
        position: relative;
        .img {
          background-color: $onSurfaceColor;
          mask-repeat: no-repeat;
          mask-size: contain;
          display: block;
          width: 32px;
          height: 32px;
          transition: .4s ease-in-out;
        }
      }

      &__name {
        font-size: 16px;
        transition: .4s ease-in-out;
        color: $onSurfaceColor;
      }

      &__indicator {
        position: absolute;
        border: 1px solid $bgColor;
        right: -3px;
        bottom: 0;
        border-radius: 50%;
        width: 9px;
        height: 9px;
        background-color: $errorColor;
        transition: .4s ease-in-out;
      }

      .serverIsUp {
        background-color: $successColor;
      }
    }

    .feature.active {
      width: calc(100% + 5px);
      background-color: $primaryColor;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.8);

      .feature__icon {
        .img {
          background-color: $onPrimaryColor;
        }
      }

      .feature__name {
        color: $onPrimaryColor;
      }
    }
  }
  .feature.deactive {
    pointer-events: none;
    &:hover {
      cursor: default;
    }
    .feature__name {
      color: darken($onSurfaceColor, 60%);
    }
    .feature__icon {
      .img {
        background-color: darken($onSurfaceColor, 60%);
      }
    }
  }
}

</style>
