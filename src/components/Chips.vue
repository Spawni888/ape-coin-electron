<template>
  <div class="chips">
    <div class="chips-inner">
      <div
        v-for="chip in chips"
        class="chip"
        :key="'chip' + chip.name"
        :class="{'inactive': !chip.active}"
        @click="onChipClick(chip)"
      >{{ chip.name }}</div>
    </div>
    <slot />
  </div>
</template>

<script>

import { toRefs } from 'vue';

export default {
  name: 'Chips',
  props: {
    chips: {
      type: Array,
    },
    existingTypes: {
      type: Array,
    },
  },
  setup(props, { emit }) {
    const { chips, existingTypes } = toRefs(props);

    const onChipClick = (chip) => {
      if (chip.active) {
        const visibleChipsNum = chips.value
          .map(_chip => _chip.active)
          .filter(Boolean).length;

        if (visibleChipsNum <= 1) return;
      } else if (!existingTypes.value.includes(chip.name)) return;

      emit('updated');
      chip.active = !chip.active;
    };

    return {
      onChipClick,
    };
  },
};
</script>

<style lang="scss" scoped>
.chips {
  width: 100%;
  min-width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 25px 20px 15px;
  z-index: 10;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  background-color: $onBgColor;

  .chips-inner {
    display: flex;

    .chip {
      margin: 0 5px 10px;
      cursor: pointer;
      padding: 4px 12px;

      background: $surfaceColor;
      user-select: none;
      color: $onSurfaceColor;
      font-weight: 400;
      border-radius: 10px;
      border: none;
      box-shadow: 0 0 6px rgba(0, 0, 0, 0.6);
      transition: .4s ease-in-out;

      &:hover {
        background: lighten($surfaceColor, 10%);
      }
    }

    .chip.inactive {
      box-shadow: none;
      background-color: lighten($surfaceColor, 40%);
    }
  }
}
</style>
