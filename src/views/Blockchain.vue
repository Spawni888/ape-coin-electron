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
        ref="chainNode"
        class="blockchain__chain"
      >
        <BlockchainTransition>
          <Block
            v-for="(block, index) in chainSlice"
            :block="block"
            :block-position="blockPosition(index, chainSlice.length, chain.length)"
            :isFirst="index === 0"
            :key="block.hash.slice(0, 10) + 'hash'"
          />
          <div class="timer-block" key="time-block">
            <div class="timer">
              <div class="time"></div>
            </div>
          </div>
        </BlockchainTransition>
      </div>
      <div class="progress" @click="scrollToClicked">
        <div class="progress__percents" ref="progressPercents"/>
        <div class="progress__bar" ref="progressBar">
          <div class="fill" ref="progressBarFill"/>
        </div>
      </div>
    </div>
    <CoreButton @click="addBlock">Add block</CoreButton>
  </div>
</template>

<script>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from 'vue';
import gsap from 'gsap';
import Block from '@/components/blockchain/Block';
import CoreButton from '@/components/CoreButton';
import BlockchainTransition from '@/components/blockchain/BlockchainTransition';
import testBlocks from '@/assets/testBlocks';

export default {
  name: 'Blockchain',
  components: {
    BlockchainTransition,
    CoreButton,
    Block,
  },
  setup() {
    const chainNode = ref(null);
    const progressPercents = ref(null);
    const progressBarFill = ref(null);
    const progressBar = ref(null);

    const speed = 0.04;
    const blockWidth = 340;
    const chainSliceLength = 10;
    let diffX = 0;
    let x = 0;
    let maxX = 0;

    const chain = ref(testBlocks);
    const chainSlice = ref(chain.value.slice(-chainSliceLength));

    const initValues = () => {
      maxX = gsap.getProperty(chainNode.value, 'width') - gsap.getProperty(chainNode.value.parentNode, 'width');
      gsap.set(chainNode.value, { x: -maxX });
      diffX = -maxX;
      x = -maxX;
    };

    const increaseChainSlice = () => {
      if (diffX < -(blockWidth)) return;
      if (chainSlice.value.length === chain.value.length) return;

      let start = chainSlice.value.length + chainSliceLength;
      const end = -(chainSlice.value.length);
      start = start < 0 ? 0 : -start;

      chainSlice.value.unshift(...chain.value.slice(start, end));

      maxX += blockWidth * (end - start);
      diffX -= blockWidth * (end - start);
      x -= blockWidth * (end - start);
    };

    let animationRequest;
    const animateScroll = () => {
      increaseChainSlice();

      diffX += (x - diffX) * speed;

      if (x > 0) x = 0;
      if (x < -maxX) x = -maxX;
      gsap.set(chainNode.value, { x: diffX });

      let progress = -Math.round(((diffX / maxX) * 100));
      if (progress > 100) progress = 100;
      if (progress < 0) progress = 0;

      progressPercents.value.innerText = `${progress}%`;
      gsap.to(progressPercents.value, {
        left: `${progress}%`,
        duration: 0.15,
        ease: 'power2.out',
      });
      gsap.to(progressBarFill.value, {
        width: `${progress}%`,
        duration: 0.15,
        ease: 'power2.out',
      });

      animationRequest = requestAnimationFrame(animateScroll);
    };

    onMounted(() => {
      initValues();
      animateScroll();
    });
    onBeforeUnmount(() => cancelAnimationFrame(animationRequest));

    const onWheel = (event) => {
      const { deltaY } = event;
      x += deltaY;
    };

    const blockPosition = (positionInSlice, sliceLength, blockchainLength) => (
      blockchainLength - sliceLength
    ) + positionInSlice;

    const addBlock = () => {
      chainSlice.value.push({
        timestamp: Date.now(),
        hash: '30basdfdsfs9f9ghhtq304gnwufoghsidufhg899',
        nonce: '30asdfasd4',
        difficulty: '7',
        data: [
          { transaction: 1 },
          { transaction: 2 },
          { transaction: 3 },
        ],
      });

      nextTick(() => {
        maxX += blockWidth;
        x = -maxX;
      });
    };

    const scrollToClicked = (e) => {
      const progressClickedX = Math.round(
        e.clientX - progressBar.value.getBoundingClientRect().left,
      );
      const progressBarWidth = parseInt(gsap.getProperty(progressBar.value, 'width', 'px'), 10);
      const progressRate = progressClickedX / progressBarWidth;

      x = -maxX * progressRate;
    };

    return {
      chainNode,
      progressPercents,
      progressBar,
      progressBarFill,
      onWheel,
      initValues,
      chain,
      chainSlice,
      blockPosition,
      addBlock,
      scrollToClicked,
    };
  },
};
</script>

<style scoped lang="scss">
.blockchain {
  position: relative;
  display: flex;
  width: 100%;
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

    .timer-block {
      border-radius: 50%;

      .timer {
        .time {
        }
      }
    }
  }

  .progress {
    margin: 25px auto 0;

    cursor: pointer;
    padding: 5px 0;
    width: 60%;
    position: relative;

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
