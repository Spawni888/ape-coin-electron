<template>
  <div class="stopwatch-container">
    <div class="stopwatch" ref="stopwatch" id="stopwatch">
      <div class="stopwatch__time">
        <span class="minutes">{{miningTime.minutes}}</span>
        <span class="separator">:</span>
        <span class="seconds">{{miningTime.seconds}}</span>
      </div>
      <div class="stopwatch__title">
        Mining
      </div>
    </div>
  </div>
</template>

<script>
import { DateTime } from 'luxon';
import { useStore } from 'vuex';
import { computed, ref, onBeforeUnmount } from 'vue';

export default {
  name: 'Stopwatch',
  setup() {
    const store = useStore();
    const lastTimestamp = computed(
      () => store.getters.blockchain[store.getters.blockchain.length - 1].timestamp,
    );
    const timeNow = ref(DateTime.now());

    const interval = setInterval(() => {
      timeNow.value = DateTime.now();
    }, 1000);
    onBeforeUnmount(() => clearInterval(interval));

    const miningTime = computed(() => {
      const time = timeNow.value.minus(lastTimestamp.value);
      const [minutes, seconds] = time.toFormat('mm ss').split(' ');

      return {
        minutes,
        seconds,
      };
    });

    return {
      miningTime,
      timeNow,
    };
  },
};
</script>

<style lang="scss">
$borderColor: rgba(255, 255, 255, 0.6);
.stopwatch-container {
  position: static;
  font-size: 40px;

  $size: 7em;
  width: 280px;
  height: 320px;
  color: $onBgColor;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
.stopwatch {
  border-radius: 50%;
  border: 2px solid $borderColor;
  height: 224px;
  width: 224px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  animation: flash 1s infinite alternate ease-in-out;
  &__title {
    margin-bottom: 5px;

    color: rgb(2, 116, 2);
    font-size: 0.65em;
  }
  &__time {
    font-size: 1em;
    .minutes {
      margin-right: 0.125em;
    }
    .seconds {
      margin-left: 0.125em;
    }
  }
}

@keyframes flash {
  from {
    box-shadow: 0 0 25px 5px $borderColor;
  }
  to {
    box-shadow: 0 0 0.25em 5px $borderColor;
  }
}
</style>
