<template>
  <div
    class="checkbox"
    v-bind="$attrs"
    :class="{ inactive }"
  >
    <input
      ref="input"
      @click.stop="$event.target.value = !$event.target.value"
      type="checkbox"
      name="set-name"
      class="switch-input"
      :checked="checked"
      @change="$emit('update:checked', $event.target.checked)"
    >
    <label @click="input.click()" class="switch-label"></label>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'CoreSwitch',
  props: {
    checked: {
      type: Boolean,
    },
    inactive: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:checked'],
  setup() {
    const input = ref(null);

    return {
      input,
    };
  },
};
</script>

<style scoped lang="scss">
$knobColor: $onBgColor;
$bgKnobColor: lighten($surfaceColor, 20%);
$knobColorActive: $secondaryColor;
$bgKnobColorActive: lighten($secondaryColor, 16%);

.checkbox {
  transform: translateX(-34px) translateY(-7px);
  transition: opacity .4s ease-in-out;
}
.switch-input {
  display: none;
}

.switch-label {
  position: relative;
  display: inline-block;
  //min-width: 112px;
  cursor: pointer;
  font-weight: 500;
  text-align: left;
  //margin: 16px;
  //padding: 16px 0 16px 44px;
}

.switch-label:before, .switch-label:after {
  content: "";
  position: absolute;
  margin: 0;
  outline: 0;
  top: 50%;
  -ms-transform: translate(0, -50%);
  -webkit-transform: translate(0, -50%);
  transform: translate(0, -50%);
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
}

.switch-label:before {
  left: 1px;
  width: 34px;
  height: 14px;
  background-color: $bgKnobColor;
  border-radius: 8px;
}

.switch-label:after {
  left: 0;
  width: 20px;
  height: 20px;
  background-color: $knobColor;
  border-radius: 50%;
  box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.8),
  0 2px 2px 0 rgba(0, 0, 0, 0.498),
  0 1px 5px 0 rgba(0, 0, 0, 0.484);
}

.switch-label .toggle--on {
  display: none;
}

.switch-label .toggle--off {
  display: inline-block;
}

.switch-input:checked + .switch-label:before {
  background-color: $bgKnobColorActive;
}

.switch-input:checked + .switch-label:after {
  background-color: $knobColorActive;
  -ms-transform: translate(80%, -50%);
  -webkit-transform: translate(80%, -50%);
  transform: translate(80%, -50%);
}

.switch-input:checked + .switch-label .toggle--on {
  display: inline-block;
}

.switch-input:checked + .switch-label .toggle--off {
  display: none;
}

.inactive {
  cursor: default;
  pointer-events: none;
  opacity: 0.2;
}
</style>
