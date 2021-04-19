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
      const blockIsLast = block.classList.contains('block-is-last');

      gsap.set(blocksConnection, { width: 0 });
      gsap.set(block, {
        width: 0,
      });
      gsap.set(blockInfo, { height: 0 });

      if (blockIsLast) {
        gsap.set(el, { width: 0, padding: 0 });
      }
    };
    const blockEnter = (el, done) => {
      const blocksConnection = el.querySelector('.block-connection');
      const block = el.querySelector('.block');
      const blockInfo = el.querySelectorAll('.block__info');
      const blockIsLast = block.classList.contains('block-is-last');

      const tl = gsap.timeline({
        defaults: {
          duration: 1,
          ease: 'elastic.out(1, 0.5)',
        },
        onComplete: done,
      });

      if (blockIsLast) {
        tl.to(el, {
          width: 340,
          padding: 20,
          ease: 'power2.out',
        });
      }

      tl
        .to(block, {
          width: 300,
          opacity: 1,
          delay: blockIsLast ? 0 : 0.5,
          scale: 1,
          ease: 'power2.out',
        }, '-=0.5')
        .to(blocksConnection, {
          ease: 'expo.out',
          width: 40,
        }, '-=0.5')
        .to(blockInfo, {
          stagger: 0.2,
          height: 'auto',
          ease: 'elastic.out(1, 0.5)',
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
