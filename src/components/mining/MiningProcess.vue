<template>
  <div class="mining-process">
    <div class="timers sub-node">
      <div class="my-timer">
        <div class="my-timer__title mining-title">Mining</div>
        <transition name="fade" mode="out-in">
          <div class="my-timer__time mining-value" :key="'mining-time'+miningHoursShow">
            <span
              v-if="miningHoursShow"
              key="miningTimeH"
              class="hours"
            >{{ miningTime.hours }}:</span>
            <span key="miningTimeM" class="minutes">{{ miningTime.minutes }}:</span>
            <span key="miningTimeS" class="seconds">{{ miningTime.seconds }}</span>
          </div>
        </transition>
      </div>

      <div class="average-block-time">
        <div class="average-block-time__title mining-title">Average Block Time</div>
        <div class="average-block-time__time mining-value">
          <span class="minutes">{{ avgBlockTime.minutes }}:</span>
          <span class="seconds">{{ avgBlockTime.seconds }}</span>
        </div>
      </div>

      <div class="mining-timer">
        <div class="mining-timer__title mining-title">Block Mining</div>
        <transition mode="out-in" name="fade">
          <div class="mining-timer__time mining-value" :key="'mining' + lastBlockTime">
            <span key="blockMiningTimeM" class="minutes">{{ blockMiningTime.minutes }}:</span>
            <span key="blockMiningTimeS" class="seconds">{{ blockMiningTime.seconds }}</span>
          </div>
        </transition>
      </div>
    </div>

    <div class="hash-rate">
      <div class="hash-rate__title">Hash Rate</div>
      <AnimatedNumber
        class="hash-rate__num"
        :number="hashRate"
      />
    </div>

    <div class="mining-info sub-node">
      <div class="difficulty">
        <div class="difficulty__title mining-title">Difficulty</div>
        <div class="value-container">
          <AnimatedNumber
            class="difficulty__value mining-value"
            :number="difficulty"
          />
        </div>
      </div>
      <div class="reward">
        <div class="reward__title mining-title">Reward</div>
        <transition name="fade" mode="out-in">
          <div class="value-container" :key="'reward' +miningRewardInt + miningRewardDecimal">
            <AnimatedNumber
              class="reward__value mining-value"
              :number="miningRewardInt"
              :key="miningRewardInt"
            />
            <div
              class="dot"
              v-if="miningRewardDecimal > 0"
              :key="'dot'+miningRewardDecimal"
            >
              .
            </div>
            <AnimatedNumber
              v-if="miningRewardDecimal > 0"
              class="reward__value mining-value"
              :number="miningRewardDecimal"
              :key="'num'+ miningRewardDecimal"
            />
          </div>
        </transition>
      </div>
      <div class="online">
        <div class="online__title mining-title">Miners Online</div>
        <div class="value-container">
          <AnimatedNumber
            class="online__value mining-value"
            :number="minersNum"
          />
        </div>
      </div>
    </div>
    <CoreButton class="mining-process__btn" @click="stopMining">Stop Mining</CoreButton>
  </div>
</template>

<script>
import CoreButton from '@/components/main/CoreButton';
import AnimatedNumber from '@/components/AnimatedNumber';
import { MINE_RATE } from '@/resources/core/config';
import { throttle } from 'lodash';
import { useStore } from 'vuex';
import {
  computed,
  ref,
  onBeforeUnmount,
  watch,
} from 'vue';
import { DateTime } from 'luxon';

export default {
  name: 'MiningProcess',
  components: { CoreButton, AnimatedNumber },
  setup() {
    const miningHoursShow = ref(false);

    const store = useStore();
    const minersNum = computed(() => store.getters.minersNum);
    const difficulty = computed(() => store.getters.miningDifficulty);
    const reward = ref(0);
    const realHashRate = computed(() => store.getters.hashRate);
    const hashRate = ref(0);

    watch(realHashRate, throttle((value) => {
      hashRate.value = value;
    }, 5000));

    const lastBlockTime = computed(() => store.getters.lastBlock.timestamp);
    const timeNow = ref(DateTime.now());

    const blockMiningTime = computed(() => {
      const [minutes, seconds] = timeNow.value
        .diff(DateTime.fromMillis(lastBlockTime.value), ['minutes', 'seconds'])
        .toFormat('mm ss').split(' ');

      return {
        minutes,
        seconds,
      };
    });

    const miningStartTime = computed(() => store.getters.miningStartTime);
    const miningTime = computed(() => {
      const [hours, minutes, seconds] = timeNow.value
        .diff(DateTime.fromMillis(miningStartTime.value), ['hours', 'minutes', 'seconds'])
        .toFormat('hh mm ss').split(' ');

      return {
        hours,
        minutes,
        seconds,
      };
    });

    const avgBlockTime = (() => {
      const [minutes, seconds] = DateTime.fromMillis(MINE_RATE).toFormat('mm ss').split(' ');
      return {
        minutes,
        seconds,
      };
    })();

    const interval = setInterval(() => {
      timeNow.value = DateTime.now();
      store.commit('adjustDifficulty');

      if (miningHoursShow.value) return;
      if (miningTime.value.hours !== '00') {
        miningHoursShow.value = true;
      }
    }, 1000);

    onBeforeUnmount(() => clearInterval(interval));

    const miningReward = computed(() => store.getters.miningReward);
    const miningRewardInt = computed(() => Math.floor(miningReward.value));
    const miningRewardDecimal = computed(() => (miningReward.value % 1).toFixed(2) * 100);

    return {
      stopMining: () => store.dispatch('stopMining'),
      miningHoursShow,
      minersNum,
      difficulty,
      reward,
      hashRate,
      lastBlockTime,
      blockMiningTime,
      miningTime,
      avgBlockTime,
      miningReward,
      miningRewardInt,
      miningRewardDecimal,
    };
  },
};
</script>

<style scoped lang="scss">
.mining-process {
  padding: 40px 0  90px;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;
  color: $onSurfaceColor;

  .sub-node {
    width: 100%;
    display: flex;
    align-items: flex-end;
    text-align: center;
    user-select: none;
    >* {
      width: 33.3%;
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
    }
  }
  .mining-title {
    font-size: 20px;
    font-weight: bold;
  }
  .mining-value {
    margin-top: 5px;
    font-size: 20px;
    width: 100%;
  }
  .value-container {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .timers {
    .average-block-time {
      &__title {
        width: 160px;
        font-size: 26px;
      }
      &__time {
        font-size: 26px;
        font-weight: bold;
        opacity: 0.7;
      }
    }
  }

  .mining-info {
    .reward {
      &__title {
        width: 160px;
        font-size: 26px;
      }
      &__value {
        font-size: 26px;
        font-weight: bold;
        opacity: 0.7;
      }
      .dot {
        font-size: 26px;
        font-weight: bold;
        opacity: 0.7;
      }
    }
    .online {
      &__value {
        width: 100%;
      }
    }
  }

  .hash-rate {
    user-select: none;
    width: 100%;
    background-color: #3b3a3a;
    background-color: rgba(59, 58, 58, 0.2);
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.4);

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 33.3%;
    &__title {
      font-size: 40px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    &__num {
      >* {

      }
    }
  }
  &__btn {
    position: absolute;
    bottom: 20px;
    height: 40px;
  }
}
</style>
