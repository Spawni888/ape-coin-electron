<template>
  <div class="blockchain">
    <div class="blockchain__title">
      Blockchain
    </div>
    <div
      class="blockchain__chain-wrapper"
      @wheel="onWheel"
      @resize="initValues"
    >
      <div
        ref="chain"
        class="blockchain__chain"
      >
        <div
          class="block"
          v-for="(block, i) in 10"
          :key="'block' + i"
        ></div>
      </div>
      <div class="progress">
        <div class="progress__percents" ref="progressPercents" />
        <div class="progress__bar">
          <div class="fill" ref="progressBar"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUpdated } from 'vue';
import gsap from 'gsap';

export default {
  name: 'Blockchain',
  setup() {
    const chain = ref(null);
    const progressPercents = ref(null);
    const progressBar = ref(null);

    const speed = 0.04;
    let diffX = 0;
    let x = 0;
    let maxX = 0;

    const initValues = () => {
      maxX = gsap.getProperty(chain.value, 'width') - gsap.getProperty(chain.value.parentNode, 'width');
      gsap.set(chain.value, { x: -maxX });
      diffX = -maxX;
      x = -maxX;
    };

    const animateScroll = () => {
      diffX += (x - diffX) * speed;

      if (x > 0) x = 0;
      if (x < -maxX) x = -maxX;
      gsap.set(chain.value, { x: diffX });

      let progress = -Math.round(((diffX / maxX) * 100));
      if (progress > 100) progress = 100;
      if (progress < 0) progress = 0;

      progressPercents.value.innerText = `${progress}%`;
      gsap.to(progressPercents.value, { left: `${progress}%`, duration: 0.15, ease: 'power2.out' });
      gsap.to(progressBar.value, { width: `${progress}%`, duration: 0.15, ease: 'power2.out' });

      requestAnimationFrame(animateScroll);
    };

    onMounted(() => {
      initValues();
      animateScroll();
    });
    onUpdated(initValues);

    const onWheel = (event) => {
      const { deltaY } = event;

      x += deltaY;
    };

    return {
      chain,
      progressPercents,
      progressBar,
      onWheel,
      initValues,
    };
  },
};
</script>

<style scoped lang="scss">
.blockchain {
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  &__title {
    padding: 20px;
    font-size: 40px;
    color: $onBgColor;
  }
  &__chain-wrapper {
    padding-bottom: 80px;

    overflow-x: hidden;
    position: relative;
    flex-grow: 1;
    width: 100%;
  }

  &__chain {
    width: fit-content;
    height: 100%;
    display: flex;
    align-items: center;

    .block {
      margin: 10px;
      width: 200px;
      height: 200px;
      background-color: #fff;
    }
  }
  .progress {
    width: 60%;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: 170px;
    &__percents {
      position: absolute;
      transform: translateX(-50%) translateY(-130%);
      left: 100%;
      font-size: 14px;
      font-weight: lighter;
      color: white !important;
    }
    &__bar {
      position: relative;
      background: rgba(255, 255, 255, 0.2);
      height: 1px;
      width: 100%;
      .fill {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        background: #fff;
      }
    }
  }
}
</style>
