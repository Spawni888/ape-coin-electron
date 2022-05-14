<template>
  <div
    v-bind="$attrs"
    class="core-input"
    :class="{
      'compressed': compressedPlaceholder,
      'show-error': showError,
    }"
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
    <span class="border"/>
    <transition name="fade" mode="out-in">
      <div v-show="showError" :key="errorMsg" class="input-error">
        {{ errorMsg }}
      </div>
    </transition>
  </div>
</template>

<script>
import {
  ref, onMounted, watch, toRefs,
} from 'vue';

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
    errorMsg: {
      type: String,
      required: true,
    },
    showError: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['update:value'],
  setup(props) {
    const { value } = toRefs(props);
    const compressedPlaceholder = ref(true);
    const input = ref(null);

    const onPlaceholderClick = () => {
      input.value.focus();
      compressedPlaceholder.value = true;
    };
    const onInputBlur = () => {
      if (!input?.value?.value) {
        compressedPlaceholder.value = false;
      }
    };

    onMounted(() => {
      compressedPlaceholder.value = true;
      onInputBlur();
    });

    watch(value, () => {
      if (value || !compressedPlaceholder.value) {
        compressedPlaceholder.value = true;
      }
    });
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
  margin-bottom: 20px;
  margin-top: 10px;

  width: 100%;
  position: relative;
  display: inline-block;

  .placeholder {
    user-select: none;
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

  .input-error {
    opacity: 1;
    color: $errorColor;
    position: absolute;
    font-size: 12px;
    width: 100%;
    height: 15px;
    bottom: -4px;
    transform: translateY(100%);
    //transition: 0.2s ease-in-out;
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

.show-error.compressed {
  .placeholder {
    color: $errorColor;
  }
}

.show-error {
  .border {
    background-color: $errorColor;
  }

  .input-error {
    opacity: 1;
  }
}

</style>
