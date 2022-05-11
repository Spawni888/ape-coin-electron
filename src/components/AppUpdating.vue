<template>
  <transition name="slide">
    <div
      v-if="isUpdating"
      class="updating-container"
    >
      <div class="updating">
        <div class="updating__fill" ref="progressNode"></div>
        <div
          class="updating__text"
        >
          Downloading update...
        </div>
        <div class="updating__speed">
          ({{ updateSpeed }} kb/s)
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { useStore } from 'vuex';
import {
  computed,
  ref,
  onBeforeUnmount,
  onMounted,
  watch,
} from 'vue';
import gsap from 'gsap';
import { throttle } from 'lodash';

export default {
  name: 'AppUpdating',
  setup() {
    const store = useStore();
    const isUpdating = computed(() => store.getters.appIsUpdating);

    const realProgress = computed(() => store.getters.updatingProgress);
    const realUpdateSpeed = computed(() => store.getters.updateSpeed);
    const updateSpeed = ref(0);
    const progressNode = ref(null);

    watch(realUpdateSpeed, throttle((value) => {
      updateSpeed.value = Math.round(value);
    }, 2000));

    let progress = 0;
    const speed = 0.05;

    let animationRequest;
    const animate = () => {
      progress += (realProgress.value - progress) * speed;
      gsap.to(progressNode.value, {
        width: `${progress}%`,
        duration: 0.3,
        ease: 'power1',
      });
      animationRequest = requestAnimationFrame(animate);
    };

    onMounted(() => {
      watch(isUpdating, (value) => {
        if (value) animate();
      });
    });
    onBeforeUnmount(() => cancelAnimationFrame(animationRequest));

    return {
      isUpdating,
      progress,
      progressNode,
      updateSpeed,
    };
  },
};
</script>

<style scoped lang="scss">
.updating-container {
  position: absolute;
  bottom: 0;
  height: 16px;
  border-top: 1px solid $surfaceColor;
  background-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 8px rgba(0, 0, 0, 1);
  color: $onSurfaceColor;
  z-index: 0;
  width: 100%;
  font-size: 10px;
  overflow: hidden;
  user-select: none;
  font-style: italic;
  .updating {
    height: 100%;
    width: 100%;
    position: relative;
    &__fill {
      position: absolute;
      height: 100%;
      width: 0;
      background-color: #39ce48;
      opacity: 0.9;
    }
    &__text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translateX(-50%) translateY(-50%);
    }
    &__speed {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
    }
  }
}

.slide-enter-from,
.slide-leave-to {
  transform: translateY(100%);
}
.slide-enter-active,
.slide-leave-active {
  transition: .4s ease-in-out;
}
.slide-enter-to,
.slide-leave-from {
  transform: translateY(0);
}
</style>
