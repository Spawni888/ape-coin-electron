<template>
  <div
    class="alert"
    :key="alertInfo.message"
    :class="{
      info: alertInfo.type === 'info',
      warning: alertInfo.type === 'warning',
      success: alertInfo.type === 'success',
    }"
  >
    <div class="alert-inner">
      <svg
        v-if="alertInfo.type === 'error'"
        class="alert__icon"
        focusable="false"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99
           10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42
            0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path>
      </svg>
      <svg
        v-if="alertInfo.type === 'warning'"
        class="alert__icon"
        focusable="false"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z">
        </path>
      </svg>
      <svg
        v-if="alertInfo.type === 'info'"
        class="alert__icon"
        focusable="false"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,
           12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0
            22,12A10, 10 0 0,0 12,2M11,17H13V11H11V17Z">
        </path>
      </svg>
      <svg
        v-if="alertInfo.type === 'success'"
        class="alert__icon"
        focusable="false"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4C12.76,4 13.5,4.11 14.2,
           4.31L15.77,2.74C14.61,2.26 13.34,2 12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0
            0, 0 22,12M7.91,10.08L6.5,11.5L11,16L21,6L19.59,4.58L11,13.17L7.91,10.08Z">
        </path>
      </svg>
      <div class="alert__title">
        {{ alertInfo.title }}
      </div>
      <div class="alert__message">
        {{ alertInfo.message }}
      </div>
      <div class="alert__cross" @click="closeAlert">
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
  </div>
</template>

<script>
import { useStore } from 'vuex';
import { computed } from 'vue';

export default {
  name: 'Alert',

  setup() {
    const store = useStore();
    return {
      closeAlert: () => store.dispatch('closeAlert'),
      alertInfo: computed(() => store.getters.alertInfo),
    };
  },
};
</script>

<style scoped lang="scss">
$errorBg: #ffbab2;
$errorColor: #611A15;
$errorIconCol: #F45448;
$warningBg: #ffe8aa;
$warningColor: #7D3C00;
$warningIconCol: #FFA117;
$infoBg: #E8F4FD;
$infoColor: #0D3C61;
$infoIconCol: #359FF4;
$successBg: #b3ffb3;
$successColor: #1E4640;
$successIconCol: #5CB65F;

.alert {
  background-color: $errorBg;
  color: $errorColor;

  position: absolute;
  width: 100%;
  top: 0;
  left: 0;
  padding: 12px 50px;

  .alert-inner {
    position: relative;
  }

  &__icon {
    position: absolute;
    width: 20px;
    fill: $errorIconCol;
    left: -28px;
    top: -3px;
  }

  &__title {
    font-weight: bold;
  }

  &__message {
    margin-top: 10px;
  }

  &__cross {
    position: absolute;
    transition: .2s ease-in-out;
    cursor: pointer;
    top: 0;
    right: -28px;
    border-radius: 50%;
    height: 22px;
    width: 22px;
    display: flex;
    justify-content: center;
    align-items: center;
    &:hover {
      background-color: darken($errorBg, 5%);
    }
    .cross {
      margin: auto;
      width: 20px;
      fill: $errorColor;
    }
  }
}

.warning {
  background-color: $warningBg;
  color: $warningColor;

  .alert__icon {
    fill: $warningIconCol;
  }

  .alert__cross:hover {
    background-color: darken($warningBg, 5%);
  }
  .cross {
    margin: auto;
    width: 20px;
    fill: $warningColor;
  }
}

.info {
  background-color: $infoBg;
  color: $infoColor;

  .alert__icon {
    fill: $infoIconCol;
  }
  .alert__cross:hover {
    background-color: darken($infoBg, 5%);
  }
  .cross {
    margin: auto;
    width: 20px;
    fill: $infoColor;
  }
}

.success {
  background-color: $successBg;
  color: $successColor;

  .alert__icon {
    fill: $successIconCol;
  }

  .alert__cross:hover {
    background-color: darken($successBg, 5%);
  }
  .cross {
    margin: auto;
    width: 20px;
    fill: $successColor;
  }
}
</style>
