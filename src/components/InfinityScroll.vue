<template>
  <transition name="fade" mode="out-in">
    <div
      class="scroll-container"
      :key="listKey"
      @wheel="onWheel"
      ref="scrollContainer"
    >
      <div
        class="scroll-content"
        ref="scrollContent"
      >
        <transition-group name="list" @before-leave="onBeforeLeave">
          <slot />
        </transition-group>
      </div>
      <div
        class="progress"
        v-if="progressShown"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
      >
        <div
          class="progress__bar"
          ref="progressBar"
        />
      </div>
    </div>
  </transition>
</template>

<script>
import gsap from 'gsap';
import { onMounted, onBeforeUnmount, ref } from 'vue';

export default {
  name: 'InfinityScroll',
  props: {
    listKey: {
      type: String,
      default: 'temp-list-key',
    },
  },
  setup() {
    const onBeforeLeave = (el) => {
      // it's just for nice animation
      gsap.set(el, { top: el.offsetTop });
    };

    const scrollContainer = ref(null);
    const scrollContent = ref(null);
    const progressBar = ref(null);
    const progressShown = ref(false);

    const speed = 0.04;
    let diffY = 0;
    let y = 0;
    let maxY = 0;
    let containerHeight = 0;
    let contentHeight = 0;
    let scrollBarHeight = 10;

    const onWheel = (event) => {
      const { deltaY } = event;
      diffY += deltaY;
    };

    let animationRequest;
    const animateScroll = () => {
      containerHeight = gsap.getProperty(scrollContainer.value, 'height');
      contentHeight = gsap.getProperty(scrollContent.value, 'height');
      maxY = Math.max(contentHeight - containerHeight, 0);

      scrollBarHeight = gsap.utils.mapRange(
        0, maxY,
        0, containerHeight,
        contentHeight - (contentHeight - containerHeight),
      );

      progressShown.value = contentHeight > containerHeight;

      if (progressBar.value) {
        gsap.to(progressBar.value, {
          height: scrollBarHeight,
          duration: 0.15,
          ease: 'power2.out',
        });
      }

      if (scrollContent.value) {
        diffY = gsap.utils.clamp(0, maxY, diffY);
        gsap.set(scrollContent.value, { y: -y });

        y -= (y - diffY) * speed;
      }

      if (progressBar.value) {
        const progressBarY = gsap.utils.mapRange(
          0, maxY,
          0, containerHeight - scrollBarHeight,
          y,
        );
        gsap.set(progressBar.value, { y: progressBarY });
      }

      animationRequest = requestAnimationFrame(animateScroll);
    };

    const progressPointerDown = ref(false);
    const onMouseDown = () => {
      progressPointerDown.value = true;
    };
    const onMouseMove = () => {
    };
    const onMouseUp = () => {
      progressPointerDown.value = false;
    };

    onMounted(() => {
      animateScroll();
    });
    onBeforeUnmount(() => cancelAnimationFrame(animationRequest));

    return {
      onBeforeLeave,
      onWheel,
      scrollContainer,
      scrollContent,
      progressBar,
      scrollBarHeight,
      progressShown,
      onMouseDown,
      onMouseMove,
      onMouseUp,
    };
  },
};
</script>

<style scoped lang="scss">
.scroll-container {
  max-width: 100%;
  overflow: hidden;
  margin-top: 10px;
  margin-bottom: 5px;

  flex-grow: 1;
  position: relative;
  display: flex;
  .scroll-content {
    flex-grow: 1;
    height: max-content;
  }

  .progress {
    user-select: none;

    width: 10px;
    height: 100%;
    position: relative;
    display: flex;
    justify-content: center;

    &__bar {
      position: relative;
      //background: lighten($surfaceColor, 30%);
      background: $onBgColor;
      opacity: 0.9;
      width: 50%;
      height: 20%;
      border-radius: 20px;
      transition: opacity .15s ease-in;
      &:hover {
        opacity: 0.6;
      }
    }
  }
}
</style>
