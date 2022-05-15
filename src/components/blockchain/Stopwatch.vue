<template>
  <div class="stopwatch-container">
    <div class="stopwatch" ref="stopwatch" id="stopwatch">
      <transition name="fade" mode="out-in">
        <div class="stopwatch__time" :key="'sw'+lastTimestamp">
          <span class="minutes">{{miningTime.minutes}}</span>
          <span class="separator">:</span>
          <span class="seconds">{{miningTime.seconds}}</span>
        </div>
      </transition>
      <div
        class="stopwatch__title"
        :class="{ active: minersNum }"
      >
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
    const lastTimestamp = computed(() => store.getters.lastBlock.timestamp);
    const timeNow = ref(DateTime.now());
    const minersNum = computed(() => store.getters.minersNum);

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
      lastTimestamp,
      miningTime,
      timeNow,
      minersNum,
    };
  },
};
</script>

<style lang="scss">
$borderColor: rgba(255, 255, 255, 0.6);
.stopwatch-container {
  position: static;
  font-size: 40px;

  width: 8em;
  height: 8em;
  color: $onBgColor;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  user-select: none;
}
.stopwatch {
  border-radius: 50%;
  border: 0.05em solid $borderColor;
  height: 5.6em;
  width: 5.6em;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  animation: flash 1s infinite alternate ease-in-out;
  &__title {
    transition: .4s ease-out;
    margin-bottom: 0.125em;

    color: rgba(233, 26, 26, 0.4);
    font-size: 0.65em;
  }
  &__title.active {
    color: rgb(2, 116, 2);
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
    box-shadow: 0 0 0.625em 0.125em $borderColor;
  }
  to {
    box-shadow: 0 0 0.25em 0.125em $borderColor;
  }
}
</style>
