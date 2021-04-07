<template>
  <transition-group
    :css="false"
    @before-enter="blockBeforeEnter"
    @enter="blockEnter"
    @leave="blockLeave"
  >
    <slot />
  </transition-group>
</template>

<script>
import gsap from 'gsap';

export default {
  name: 'BlockchainTransition',
  setup() {
    const blockBeforeEnter = (el) => {
      const blocksConnection = el.querySelector('.block-connection');
      const block = el.querySelector('.block');
      const blockInfo = el.querySelectorAll('.block__info');

      gsap.set(blocksConnection, { width: 0 });
      gsap.set(block, {
        width: 0,
      });
      gsap.set(blockInfo, { height: 0 });
    };
    const blockEnter = (el, done) => {
      const blocksConnection = el.querySelector('.block-connection');
      const block = el.querySelector('.block');
      const blockInfo = el.querySelectorAll('.block__info');

      const tl = gsap.timeline({
        defaults: {
          duration: 1,
          ease: 'elastic.out(1, 0.5)',
        },
        onComplete: done,
      });

      tl
        .to(block, {
          width: 300,
          delay: 0.5,
          opacity: 1,
          scale: 1,
        })
        .to(blocksConnection, {
          ease: 'expo.out',
          width: 40,
        }, '-=0.5')
        .to(blockInfo, {
          stagger: 0.2,
          height: 'auto',
        }, '-=0.8');
    };
    const blockLeave = () => {
    };

    return {
      blockBeforeEnter,
      blockEnter,
      blockLeave,
    };
  },
};
</script>

<style scoped>

</style>
