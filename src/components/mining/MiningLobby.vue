<template>
  <form class="mining-lobby lobby">
    <div class="lobby__title">Mining</div>
    <CoreInput
      v-for="field in form"
      :ref="field.ref"
      :placeholder="field.placeholder"
      :field-name="field.fieldName"
      :key="field.fieldName"
      :error-msg="field.errorMsg"
      :show-error="!field.valid && highlightErrors"
      v-model:value="field.value"
    />
<!--    <div-->
<!--      class="switch-box"-->
<!--      v-for="item in switches"-->
<!--      :key="item.name"-->
<!--    >-->
<!--      <p>{{ item.name }}</p>-->
<!--      <CoreSwitch-->
<!--        @click="item.onClick"-->
<!--        :ref="item.ref"-->
<!--        v-model:checked="item.value"-->
<!--        :inactive="item.inactive"-->
<!--      />-->
<!--    </div>-->
<!--    <Stopwatch-->
<!--      key="mining-stopwatch"-->
<!--      class="stopwatch"-->
<!--    />-->
    <CoreButton ref="mineBtn" @click.prevent="startMining">Start Mining</CoreButton>
  </form>
</template>

<script>
import CoreButton from '@/components/CoreButton';
// import Stopwatch from '@/components/blockchain/Stopwatch';
// import CoreSwitch from '@/components/CoreSwitch';
import CoreInput from '@/components/CoreInput';
import useTooltip from '@/use/tooltip';
import {
  ref,
  onMounted,
  computed,
} from 'vue';
import { useStore } from 'vuex';
import useForm from '@/use/form/form';

export default {
  name: 'MiningLobby',
  components: {
    CoreButton,
    CoreInput,
  },
  setup() {
    const store = useStore();
    const myBalance = computed(() => store.getters.walletBalance);

    // const switch1 = reactive({
    //   name: 'GPU',
    //   value: false,
    //   ref: 'gpuNode',
    // });
    // const switch2 = reactive({
    //   name: 'Parallel',
    //   value: false,
    //   ref: 'parallelNode',
    //   inactive: true,
    // });
    //
    // watch(switch1, (_switch) => {
    //   switch2.inactive = !_switch.value;
    // });
    //
    // const switches = computed(() => [switch1, switch2]);

    const form = useForm({
      feeThreshold: {
        value: '',
        fieldName: 'Minimum Fee',
        placeholder: '',
        ref: 'feeThresholdNode',
        validators: {
          LessThanBalance: {
            priority: 1,
            func: (val) => val <= myBalance.value,
            errorMsg: 'Invalid amount. Check your balance',
          },
        },
      },
    });

    const highlightErrors = ref(false);
    const startMining = () => {
      const formIsValid = !Object.values(form)
        .filter(field => !field.valid).length;

      if (!formIsValid) {
        highlightErrors.value = true;
        return;
      }

      store.commit('setFeeThreshold', form.feeThreshold.value || 0);
      store.dispatch('startMining');
    };

    const feeThresholdNode = ref(null);
    const gpuNode = ref(null);
    const parallelNode = ref(null);
    const mineBtn = ref(null);
    onMounted(() => {
      useTooltip({
        el: feeThresholdNode.value,
        id: 'feeThresholdNode',
        text: 'Blockchain users pay miners for including transactions to the block\n\n'
          + 'Miners can set a fee threshold.\n\n'
          + 'Threshold determines minimum transaction fee to be included to the block.\n\n'
          + 'Higher threshold you`ll set - higher mining reward you`ll get.\n'
          + 'Subject to there are enough pending transactions.',
        maxWidth: 500,
      });
      // useTooltip({
      //   el: gpuNode.value,
      //   id: 'gpuNode',
      //   text: 'Use GPU instead of CPU for hash calculation. (GPU.js)\n\n'
      //     + 'GPU.js automatically transpiles simple JavaScript functions into shader language '
      //     + 'and compiles them, so they run on your GPU.',
      //   maxWidth: 400,
      // });
      // useTooltip({
      //   el: parallelNode.value,
      //   id: 'parallelNode',
      //   text: 'Use GPU in parallel with CPU for hash calculation.',
      //   maxWidth: 400,
      // });

      useTooltip({
        el: mineBtn.value,
        id: 'mineBtn',
        text: 'Mining is the process of creating new coins by solving a computational puzzle. \n\n'
          + 'Miners includes blockchain users transactions to the block and calculate hash out of '
          + 'transactions and nonce value.\n'
          + 'Nonce value is a random number.\n'
          + 'Miners random roll nonce value until they will calculate hash starting with ZEROES.\n\n'
          + 'If zeroes subsequence at the beginning of the calculated hash is equal to current DIFFICULTY.\n'
          + 'Block will be added to the blockchain and miner will get reward.\n\n'
          + 'Just click this button to start mining ape-coins!',
        maxWidth: 500,
      });
    });

    return {
      // switch1,
      // switch2,
      // switches,
      feeThresholdNode,
      gpuNode,
      parallelNode,
      form,
      highlightErrors,
      startMining,
      mineBtn,
    };
  },
};
</script>

<style scoped lang="scss">
.lobby {
  color: $onBgColor;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  margin: auto;

  width: 50%;

  .stopwatch {
    font-size: 20px;
    margin-bottom: 20px;

    &__title {
      font-size: 10px !important;
    }
  }

  &__title {
    margin-bottom: 20px;
    padding: 20px;
    font-size: 40px;
    color: #D1D1D1;
  }

  .switch-box {
    width: 100%;
    align-self: flex-start;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: $onBgColor;
  }

  .core-input {
  }
  .core-button {
    margin-top: 30px;
  }
}
</style>
