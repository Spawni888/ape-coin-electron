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
            :key="block.hash.slice(10, 20) +
              chain.length +
              block.nonce +
              block.lastHash.slice(10, 20)"
            @click="showBlockInfo(block, getBlockPosition(index, chainSlice.length, chain.length))"
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
    <transition name="fade" mode="out-in">
      <BlockInfo
        v-if="blockInfo.show"
        :block="blockInfo.block"
        :block-position="blockInfo.blockPosition"
        @close="blockInfo.show = false"
      />
    </transition>
  </div>
</template>

<script>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  nextTick, reactive, computed, watch,
} from 'vue';
import gsap from 'gsap';
import Block from '@/components/blockchain/Block';
import BlockchainTransition from '@/components/blockchain/BlockchainTransition';
import Stopwatch from '@/components/blockchain/Stopwatch';
import BlockInfo from '@/components/blockchain/BlockInfo';
import { useStore } from 'vuex';

export default {
  name: 'Blockchain',
  components: {
    Block,
    BlockchainTransition,
    Stopwatch,
    BlockInfo,
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

    const store = useStore();
    const chain = computed(() => store.getters.blockchain);
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

    const increaseChainSlice = () => {
      if (chain.value.length < chainSliceLength) return;
      if (diffX < -(2 * blockWidth)) return;
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

    let animationRequest;
    const animateScroll = () => {
      increaseChainSlice();

      x = gsap.utils.clamp(-maxX, 0, x);
      gsap.set(chainNode.value, { x: diffX });

      // this is for situation when chain width less than content width
      if (x > 0) x = -maxX / 2;

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

    const onWheel = (event) => {
      const { deltaY } = event;
      x += deltaY;
    };

    const getBlockPosition = (positionInSlice, sliceLength, blockchainLength) => (
      blockchainLength - sliceLength
    ) + positionInSlice;

    const blockInfo = reactive({
      show: false,
      block: null,
      blockPosition: null,
    });
    const showBlockInfo = (block, blockPosition) => {
      blockInfo.block = block;
      blockInfo.blockPosition = blockPosition;
      blockInfo.show = true;

      console.log(block);
    };

    const addBlock = (block) => {
      chainSlice.value.push(block);

      nextTick(() => {
        maxX += blockWidth;
        x = -maxX;
      });
    };

    watch(chain.value, (bc) => {
      addBlock(bc[bc.length - 1]);
    });

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
      blockInfo,
      showBlockInfo,
    };
  },
};
</script>

<style scoped lang="scss">
.blockchain {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  align-items: center;

  &__title {
    margin-top: 30px;
    margin-bottom: 30px;

    padding: 20px;
    font-size: 40px;
    color: $onBgColor;
  }

  &__chain-wrapper {
    padding-top: 10px;
    //padding-bottom: 80px;
    overflow-x: hidden;
    flex-basis: 60%;
    width: 100%;
  }

  &__chain {
    width: fit-content;
    height: 80%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .progress {
    user-select: none;
    margin: 50px auto 0;

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
.add-block {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}
</style>
