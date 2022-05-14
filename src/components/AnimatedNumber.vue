<template>
  <div class="animated-num" ref="animNumNode">
    <transition-group
      name="fade"
      :css="false"
      @before-enter="onBeforeEnter"
      @enter="onEnter"
      @leave="onLeave"
      @after-enter="onAfterEnter"
      @after-leave="onAfterLeave"
    >
      <div
        v-for="(num, index) in numsArray"
        ref="numContainerNode"
        class="num-container"
        :key="'container' + index"
        :data-index="index"
      >
        <div
          v-for="n in 10"
          class="num"
          :key="'num' + index + n"
        >
          {{ 10 - n }}
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>
import gsap from 'gsap';
import {
  onMounted,
  toRefs,
  ref,
  watch,
  computed,
} from 'vue';

export default {
  name: 'AnimatedNumber',
  props: {
    number: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  setup(props) {
    const { number } = toRefs(props);
    const numsArray = ref([0]);
    const numNodeW = ref(20);
    const animNumNodeW = computed(() => numNodeW.value * numsArray.value.length);
    let prevNumLength = 1;

    const animNumNode = ref(null);
    const numContainerNode = ref(null);

    const animateNums = () => {
      if (!animNumNode.value) return;

      [].forEach.call(animNumNode.value?.children, (child, index) => {
        if (!child) return;
        const num = numsArray.value[index];

        gsap.to(child, {
          duration: 2,
          transform: `translateY(-${(9 - num)}em)`,
        });
      });
    };

    const updateNumsArray = (val) => {
      const nums = String(val).split('');
      prevNumLength = numsArray.value.length;

      while (numsArray.value.length !== nums.length) {
        if (nums.length > numsArray.value.length) {
          numsArray.value.push(0);
        } else {
          numsArray.value.pop();
        }
      }
      nums.forEach((num, i) => {
        numsArray.value[i] = parseInt(num, 10);
      });
      if (prevNumLength !== numsArray.value.length) return;

      animateNums();
    };
    watch(number, updateNumsArray);

    const onBeforeEnter = (el) => {
      gsap.set(el, { opacity: 0, display: 'none' });
    };
    const onEnter = (el, done) => {
      const tl = gsap.timeline({ duration: 0.4 });
      const elIndex = parseInt(el.dataset.index, 10);

      tl
        .to(animNumNode.value, {
          delay: (elIndex - prevNumLength) * 0.2,
          width: Number(animNumNodeW.value),
        })
        .set(el, {
          display: 'initial',
        })
        .to(el, {
          opacity: 1,
          ease: 'power1.in',
          duration: 1,
          onComplete: done,
        });
    };

    const onAfterEnter = (el) => {
      const numLength = numsArray.value.length;
      const elIndex = parseInt(el.dataset.index, 10);
      if (numLength === elIndex) return;

      animateNums();
    };

    const onLeave = (el, done) => {
      const tl = gsap.timeline({ duration: 0.4 });
      const numLength = numsArray.value.length;
      const elIndex = parseInt(el.dataset.index, 10);

      let lastAnim = {
        duration: 0,
        onComplete: done,
      };

      const isLast = parseInt(el.dataset.index, 10) === (prevNumLength - 1);
      if (isLast) {
        lastAnim = {
          width: animNumNodeW.value,
          onComplete: done,
          delay: (prevNumLength - numLength) * 0.2,
        };
      }

      tl
        .to(el, {
          delay: Math.abs((prevNumLength - numLength) - elIndex) * 0.2,
          duration: 0.4,
          opacity: 0,
        })
        .set(el, {
          display: 'none',
        })
        .to(animNumNode.value, lastAnim);
    };
    const onAfterLeave = (el) => {
      const numLength = numsArray.value.length;
      const elIndex = parseInt(el.dataset.index, 10);
      if (numLength !== elIndex) return;

      animateNums();
    };

    onMounted(() => {
      numNodeW.value = gsap.getProperty(numContainerNode.value[0], 'width');
      gsap.set(animNumNode.value, { width: String(animNumNodeW.value) });
      prevNumLength = numsArray.value.length;
      setTimeout(() => updateNumsArray(number.value), 1000);
    });

    return {
      numsArray,
      animNumNode,
      numContainerNode,
      onBeforeEnter,
      onEnter,
      onAfterEnter,
      onLeave,
      onAfterLeave,
    };
  },
};
</script>

<style scoped lang="scss">
.animated-num {
  overflow: hidden;
  color: $onSurfaceColor;
  font-size: 50px;
  line-height: 1em;
  display: flex;
  .num-container {
    height: 1em;
    transform: translateY(-(1em * 9));
  }
}
</style>
