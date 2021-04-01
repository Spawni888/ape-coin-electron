<template>
  <div class="modal">
    <div class="modal-inner">
      <div class="modal__title">
        {{ modalInfo.title }}
      </div>
      <div class="modal__text">
        <p
          v-for="paragraph in modalInfo.paragraphs"
          v-html="paragraph"
          :key="paragraph"
        >
        </p>
      </div>
      <div class="modal__buttons">
        <CoreButton
          v-for="btn in modalInfo.buttons"
          :key="btn.name"
          @click="answerModal(btn.answer)"
        >
          {{ btn.name }}
        </CoreButton>
      </div>
    </div>
  </div>
</template>

<script>
import CoreButton from '@/components/CoreButton';

export default {
  name: 'Modal',
  components: { CoreButton },
  props: {
    modalInfo: {
      type: Object,
    },
  },
  setup(props, { emit }) {
    const answerModal = (answer) => {
      if (answer !== undefined) {
        emit('answer', answer);
      }
    };

    return {
      answerModal,
    };
  },
};
</script>

<style scoped lang="scss">
.modal {
  position: absolute;
  height: 100%;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 6;
  .modal-inner {
    padding: 16px 24px;
    position: absolute;
    box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2),
    0 2px 2px 0 rgba(0, 0, 0, 0.14),
    0 1px 5px 0 rgba(0, 0, 0, 0.12);
    top: 50%;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
    max-width: 80%;
    border-radius: 3px;
    color: $bgColor;
    z-index: 6;
    background-color: rgba(255, 255, 255, 0.9);
  }
  &__title {
    font-weight: 500;
    font-size: 24px;
    margin-bottom: 10px;
  }
  &__text {
    margin-bottom: 20px;
    font-size: 16px;
    line-height: 1.6em;
    white-space: initial;

    p {
      padding: 5px;
    }
  }
  &__buttons {
    display: flex;
    justify-content: flex-end;
    .core-button {
      margin-left: 20px;
    }
  }
}
p {
  margin: 0;
  padding: 0;
}
</style>
