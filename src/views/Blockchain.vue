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
       <BlockchainTransition>
         <Block
           v-for="(block, index) in blocks"
           :block="block"
           :block-position="blockPosition(index, blocks.length, 100)"
           :isFirst="index === 0"
           :key="block.hash.slice(0, 10) + index"
         />
         <div class="timer-block" key="time-block">
           <div class="timer">
             <div class="time"></div>
           </div>
         </div>
       </BlockchainTransition>
      </div>
      <div class="progress">
        <div class="progress__percents" ref="progressPercents"/>
        <div class="progress__bar">
          <div class="fill" ref="progressBar"/>
        </div>
      </div>
    </div>
    <CoreButton @click="addBlock">Add block</CoreButton>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue';
import gsap from 'gsap';
import Block from '@/components/blockchain/Block';
import CoreButton from '@/components/CoreButton';
import BlockchainTransition from '@/components/blockchain/BlockchainTransition';

export default {
  name: 'Blockchain',
  components: { BlockchainTransition, CoreButton, Block },
  setup() {
    const chain = ref(null);
    const progressPercents = ref(null);
    const progressBar = ref(null);

    const speed = 0.04;
    const blockWidth = 340;
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
      gsap.to(progressPercents.value, {
        left: `${progress}%`,
        duration: 0.15,
        ease: 'power2.out',
      });
      gsap.to(progressBar.value, {
        width: `${progress}%`,
        duration: 0.15,
        ease: 'power2.out',
      });

      requestAnimationFrame(animateScroll);
    };

    onMounted(() => {
      initValues();
      animateScroll();
    });

    const onWheel = (event) => {
      const { deltaY } = event;
      x += deltaY;
    };

    const blocks = ref([
      {
        timestamp: Date.now(),
        hash: '3032fjfdg8s9f9ghhtq304gnwufoghsidufhg899',
        nonce: '3004',
        difficulty: '5',
        data: [
          { transaction: 1 },
          { transaction: 2 },
        ],
      },
      {
        timestamp: Date.now(),
        hash: '3032fjfdg8s9f9ghhtq304gnwufoghsidufhg899',
        nonce: '3004',
        difficulty: '5',
        data: [
          { transaction: 1 },
          { transaction: 2 },
        ],
      },
      {
        timestamp: Date.now(),
        hash: '3032fjfdg8s9f9ghhtq304gnwufoghsidufhg899',
        nonce: '3004',
        difficulty: '5',
        data: [
          { transaction: 1 },
          { transaction: 2 },
        ],
      },
      {
        timestamp: Date.now(),
        hash: '3032fjfdg8s9f9ghhtq304gnwufoghsidufhg899',
        nonce: '3004',
        difficulty: '5',
        data: [
          { transaction: 1 },
          { transaction: 2 },
        ],
      },
      {
        timestamp: Date.now(),
        hash: '3032fjfdg8s9f9ghhtq304gnwufoghsidufhg899',
        nonce: '3004',
        difficulty: '5',
        data: [
          { transaction: 1 },
          { transaction: 2 },
        ],
      },
      {
        timestamp: Date.now(),
        hash: '3032fjfdg8s9f9ghhtq304gnwufoghsidufhg899',
        nonce: '3004',
        difficulty: '5',
        data: [
          { transaction: 1 },
          { transaction: 2 },
        ],
      },
      {
        timestamp: Date.now(),
        hash: '3032fjfdg8s9f9ghhtq304gnwufoghsidufhg899',
        nonce: '3004',
        difficulty: '5',
        data: [
          { transaction: 1 },
          { transaction: 2 },
        ],
      },
      {
        timestamp: Date.now(),
        hash: '3032fjfdg8s9f9ghhtq304gnwufoghsidufhg899',
        nonce: '3004',
        difficulty: '5',
        data: [
          { transaction: 1 },
          { transaction: 2 },
        ],
      },
      {
        timestamp: Date.now(),
        hash: '3032fjfdg8s9f9ghhtq304gnwufoghsidufhg899',
        nonce: '3004',
        difficulty: '5',
        data: [
          { transaction: 1 },
          { transaction: 2 },
        ],
      },
    ]);

    const blockPosition = (positionInSlice, sliceLength, blockchainLength) => (
      blockchainLength - sliceLength
    ) + positionInSlice;

    const addBlock = () => {
      blocks.value.push({
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

    return {
      chain,
      progressPercents,
      progressBar,
      onWheel,
      initValues,
      blocks,
      blockPosition,
      addBlock,
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
    width: 60%;
    margin: 30px auto 0;
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
