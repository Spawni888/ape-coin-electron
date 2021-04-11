<template>
  <div
    class="blockchain"
    @mousemove="onProgressMove"
    @mouseup="progressMouseDown = false"
    @mouseleave="progressMouseDown = false"
  >
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
            :block-position="getBlockPosition(index, chainSlice.length, chain.length)"
            :chain-length="chain.length"
            :is-first="index === 0"
            :key="block.hash.slice(0, 10) + 'hash'"
          />
        </BlockchainTransition>
        <Stopwatch
          ref="stopwatch"
          key="bc-stopwatch"
        />
      </div>
      <div class="progress" @mousedown="scrollToClicked">
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
import Stopwatch from '@/components/blockchain/Stopwatch';

export default {
  name: 'Blockchain',
  components: {
    Stopwatch,
    BlockchainTransition,
    CoreButton,
    Block,
  },
  setup() {
    const chainNode = ref(null);
    const progressPercents = ref(null);
    const progressBar = ref(null);
    const progressBarFill = ref(null);
    const stopwatch = ref(null);

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

    const progressMouseDown = ref(false);
    const scrollToClicked = (e) => {
      progressMouseDown.value = true;
      const progressClickedX = Math.round(
        e.clientX - progressBar.value.getBoundingClientRect().left,
      );
      const progressBarWidth = parseInt(gsap.getProperty(progressBar.value, 'width', 'px'), 10);
      const progressRate = progressClickedX / progressBarWidth;

      x = -maxX * progressRate;
    };

    const onProgressMove = (e) => {
      if (!progressMouseDown.value) return;
      scrollToClicked(e);
    };

    let animationRequest;
    const animateScroll = () => {
      x = gsap.utils.clamp(-maxX, 0, x);
      gsap.set(chainNode.value, { x: diffX });

      diffX += (x - diffX) * speed;

      let progress = -Math.round(((diffX / maxX) * 100));
      progress = gsap.utils.clamp(0, 100, progress);

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

    const increaseChainSlice = () => {
      if (diffX < -(blockWidth)) return;
      if (chainSlice.value.length === chain.value.length) return;

      let start = chainSlice.value.length + chainSliceLength;
      const end = -(chainSlice.value.length);

      start = chain.value.length < start
        ? -(chain.value.length)
        : -start;

      chainSlice.value.unshift(...chain.value.slice(start, end));

      maxX += blockWidth * (end - start);
      diffX -= blockWidth * (end - start);
      x -= blockWidth * (end - start);
    };

    const onWheel = (event) => {
      const { deltaY } = event;
      x += deltaY;

      increaseChainSlice();
    };

    const getBlockPosition = (positionInSlice, sliceLength, blockchainLength) => (
      blockchainLength - sliceLength
    ) + positionInSlice;

    const addBlock = () => {
      const block = {
        timestamp: Date.now(),
        hash: gsap.utils.random(0, 6000)
          .toString(),
        nonce: '30asdfasd4',
        difficulty: '7',
        data: [
          { transaction: 1 },
          { transaction: 2 },
          { transaction: 3 },
        ],
      };

      chainSlice.value.push(block);
      chain.value.push(block);

      nextTick(() => {
        maxX += blockWidth;
        x = -maxX;
      });
    };

    onMounted(() => {
      initValues();
      animateScroll();
    });
    onBeforeUnmount(() => cancelAnimationFrame(animationRequest));

    return {
      chainNode,
      progressPercents,
      progressBar,
      progressBarFill,
      stopwatch,
      chain,
      chainSlice,
      onWheel,
      initValues,
      progressMouseDown,
      scrollToClicked,
      onProgressMove,
      getBlockPosition,
      addBlock,
    };
  },
};
</script>

<style scoped lang="scss">
.blockchain {
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
    flex-grow: 1;
    width: 100%;
  }

  &__chain {
    width: fit-content;
    height: 100%;
    display: flex;
    align-items: center;
  }

  .progress {
    user-select: none;
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
