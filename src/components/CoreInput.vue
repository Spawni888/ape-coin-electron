<template>
  <div
    class="core-input"
    :class="{'compressed': compressedPlaceholder}"
  >
    <div
      class="placeholder"
      @click="onPlaceholderClick"
    >
      {{ fieldName }}
    </div>
    <input
      ref="input"
      type="text"
      :value="value"
      @input="$emit('update:value', $event.target.value)"
      :placeholder="placeholder"
      @blur="onInputBlur"
    >
    <span class="border" />
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'CoreInput',
  props: {
    placeholder: {
      type: String,
      required: true,
    },
    value: {
      type: String,
    },
    fieldName: {
      type: String,
      required: true,
    },
  },
  emits: ['update:value'],
  setup() {
    const compressedPlaceholder = ref(false);
    const input = ref(null);

    const onPlaceholderClick = () => {
      input.value.focus();
      compressedPlaceholder.value = true;
    };
    const onInputBlur = (e) => {
      if (!e.target.value) {
        compressedPlaceholder.value = false;
      }
    };

    return {
      input,
      onPlaceholderClick,
      compressedPlaceholder,
      onInputBlur,
    };
  },
};
</script>

<style scoped lang="scss">
$fontSize: 18px;
.core-input {
  position: relative;
  display: inline-block;

  .placeholder {
    cursor: pointer;
    height: 100%;
    width: 100%;
    position: absolute;
    font-size: $fontSize;
    color: darken($onBgColor, 20%);
    padding: 5px 0;
    top: 0;
    left: 0;
    transition: .2s;
  }

  input {
    width: 100%;
    outline: none;
    border: none;
    background-color: transparent;
    padding: 5px 0;
    font-size: $fontSize;
    border-bottom: 1px solid $onBgColor;
    color: $onBgColor;
    font-weight: 500;
  }
  input::-webkit-input-placeholder {
    transition: .3s;
    opacity: 0;
  }

  .border {
    transition: .6s ease-in-out;
    background-color: darken($secondaryColor, 20%);
    position: absolute;
    width: 0;
    height: 1px;
    left: 0;
    bottom: 0;
    z-index: 1;
  }
}
.compressed {
  .placeholder {
    cursor: default;

    font-size: 12px;
    top: -16px;
    color: $secondaryColor;
  }
  input::-webkit-input-placeholder {
    opacity: .4;
  }
  .border {
    width: 100%;
  }
}
</style>
