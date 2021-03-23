<template>
  <button class="core-button" @click="useRipple">
    <slot />
  </button>
</template>

<script>
import useRipple from '@/use/button/ripple';

export default {
  name: 'CoreButton',
  setup() {
    // TODO: fix ripple effect. Now it doesn't work
    return {
      useRipple,
    };
  },
};
</script>

<style scoped lang="scss">
.core-button {
  overflow: hidden;
  position: relative;
  cursor: pointer;
  border: none;
  border-radius: 5px;
  padding: 10px 18px;
  outline: none;
  background: $surfaceColor;
  color: $onSurfaceColor;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.6);
  font-size: 16px;

  transition: .2s ease-in-out;
  &:hover {
    background-color: lighten($surfaceColor, 6%);
  }
}
</style>
