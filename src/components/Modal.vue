<template>
  <div class="modal">
    <div class="modal-buttons" v-if="question">
      <button>Да</button>
      <button>Нет</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Modal',
  props: {
    title: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    question: {
      type: Boolean,
    },
  },
  setup() {

  },
};
</script>

<style scoped>

</style>
