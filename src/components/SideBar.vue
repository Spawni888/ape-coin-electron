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
          :class="[{'active': isActive}, feature.className]"
          @click="navigate"
        >
          <div class="feature__icon">
            <img :src="feature.imgSrc" :alt="feature.className">
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
import { ref } from 'vue';
import p2pImg from '@/assets/images/sidebar/electricity.png';
import walletImg from '@/assets/images/sidebar/purse.png';
import miningImg from '@/assets/images/sidebar/pick.png';

export default {
  name: 'SideBar',
  setup() {
    const features = ref([
      {
        name: 'Peer-to-peer',
        className: 'p2p',
        imgSrc: p2pImg,
        route: 'p2p',
      },
      {
        name: 'Wallet',
        className: 'wallet',
        imgSrc: walletImg,
        route: 'wallet',
      },
      {
        name: 'Mining',
        className: 'mining',
        imgSrc: miningImg,
        route: 'mining',
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

        img {
          display: block;
          width: 100%;
          height: auto;
          max-width: 30px;
          transition: .4s;
        }
      }

      &__name {
        font-size: 16px;
        color: $onSurfaceColor;
      }
    }

    .feature.active {
      width: calc(100% + 5px);
      background-color: $primaryColor;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.8);

      .feature__icon {
        img {
          filter: invert(1);
        }
      }
      .feature__name {
        color: $onPrimaryColor;
      }
    }
  }
}

</style>
