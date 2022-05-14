<template>
  <header class="header">
    <div class="header__logo">
      <div class="img"
           :style="{'maskImage': `url(${require('@/assets/icon.png')})`}"
      />
      <div class="title">Ape-coin</div>
    </div>
    <div class="header__buttons clickable">
      <transition name="fade" mode="out-in">
        <router-link
          :to="{name: 'alertJournal'}"
          tag="div"
          class="header__button exclamation"
        >
          <svg class="exclamation-svg" viewBox="0 0 41.49 24">
            <path
              d="M 16 1 L 21 1 L 21 16 L 16 16 L 16 1 M 16 20 L 21 20 M 21 20 L 21 24
            L 16 24 L 16 20"
            />
          </svg>
        </router-link>
      </transition>
      <div
        class="header__button hide"
        @click="hideWindow"
      >
        <svg
          class="line"
          focusable="false"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M 4,12 L 20,12
                   L 20,14 L 4,14
                   L 4,12"
          ></path>
        </svg>
      </div>

      <div
        class="header__button close"
        @click="closeWindow"
      >
        <svg
          class="cross"
          focusable="false"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41
           17.59 19 19 17.59 13.41 12z">
          </path>
        </svg>
      </div>
    </div>
  </header>
</template>

<script>
import { ipcRenderer } from 'electron';
import { useStore } from 'vuex';
import { computed } from 'vue';
import { TO_BG } from '@/resources/channels';

export default {
  name: 'Header',
  setup() {
    const store = useStore();
    const { alertsJournal } = store.getters;

    const closeWindow = () => {
      ipcRenderer.send(TO_BG.CLOSE_MAIN_WINDOW);
    };
    const hideWindow = () => {
      ipcRenderer.send(TO_BG.HIDE_MAIN_WINDOW);
    };
    return {
      closeWindow,
      hideWindow,
      alertsJournal,
      serverIsUp: computed(() => store.getters.serverIsUp),
    };
  },
};
</script>

<style scoped lang="scss">
$headerBgColor: lighten($bgColor, 15%);
.header {
  -webkit-app-region: drag;
  display: flex;
  //background-color: darken($surfaceColor, 4%);
  background-color: $headerBgColor;
  z-index: 99;
  justify-content: space-between;
  height: 30px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 1);

  &__logo {
    margin-left: 20px;

    display: flex;
    align-items: center;

    .img {
      margin-right: 5px;

      background-color: $onSurfaceColor;
      mask-repeat: no-repeat;
      mask-size: contain;
      width: 16px;
      height: 16px;
    }

    .title {
      font-size: 12px;
      color: $onSurfaceColor;
      font-weight: 500;
      line-height: 28px;
      align-self: flex-end;
    }
  }

  &__buttons {
    $iconSize: 20px;
    display: flex;

    .hide {
      .line {
        width: $iconSize;
        height: $iconSize;
        fill: darken($onSurfaceColor, 20%);
      }
    }

    .close {
      .cross {
        width: $iconSize;
        height: $iconSize;
        fill: darken($onSurfaceColor, 20%);
      }
    }

    .exclamation {
      padding: 0 5px;

      .exclamation-svg {
        width: 22px;
        height: 20px;
        fill: darken($onSurfaceColor, 22%);
      }
    }
  }

  &__button {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: 0 6px;
    transition: .2s ease-in-out;

    &:hover {
      background-color: lighten($headerBgColor, 10%);
    }
  }
}

.clickable {
  -webkit-app-region: no-drag;
}
</style>
