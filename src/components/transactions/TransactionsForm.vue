<template>
  <form class="transactions__form">
    <div class="transactions-title">
      Transactions
    </div>
    <CoreInput
      ref="pubKeyNode"
      v-for="field in form"
      :placeholder="field.placeholder"
      :field-name="field.fieldName"
      :key="field.fieldName"
      :error-msg="field.errorMsg"
      :show-error="!field.valid && highlightErrors"
      v-model:value="field.value"
    />
    <CoreButton class="p2p-button" @click.prevent="searchTransactions">Search</CoreButton>
  </form>
</template>

<script>
import CoreInput from '@/components/CoreInput';
import CoreButton from '@/components/CoreButton';

import { onMounted, ref, computed } from 'vue';
import useForm from '@/use/form/form';
import useTooltip from '@/use/tooltip';
import { useStore } from 'vuex';

const shouldBeLength = (length) => (val) => val.length === length;

export default {
  name: 'TransactionsForm',
  components: {
    CoreInput,
    CoreButton,
  },
  setup(props, { emit }) {
    const store = useStore();
    const myPubKey = computed(() => store.getters.walletPubKey);
    const selectedAddress = computed(() => store.getters.selectedWalletAddress);

    const form = useForm({
      address: {
        value: selectedAddress.value ? selectedAddress.value : myPubKey.value,
        fieldName: 'Enter user address',
        placeholder: 'Paste user public key',
        validators: {
          required: {
            func: (val) => !!val,
            errorMsg: 'Please, fill the field',
            priority: 1,
          },
          shouldBeLength: {
            priority: 2,
            func: shouldBeLength(130),
            errorMsg: 'Address should be 130 symbols length',
          },
        },
      },
    });

    const highlightErrors = ref(false);
    const searchTransactions = () => {
      const formIsValid = !Object.values(form)
        .filter(field => !field.valid).length;

      if (!formIsValid) {
        highlightErrors.value = true;
        return;
      }

      store.commit('findWalletRelatedTransactions', {
        pubKey: form.address.value,
      });
      store.commit('getBalanceTPIncludedOf', form.address.value);

      emit('show-output');
    };

    const pubKeyNode = ref(null);

    onMounted(() => {
      useTooltip({
        el: pubKeyNode.value,
        id: 'pubKeyNode',
        maxWidth: 500,
        text: 'At this page you can explore transactions of any user. \n\n'
          + 'Copy and paste here user address (public key). \n'
          + 'This field has your wallet address by default.',
      });
    });

    return {
      form,
      highlightErrors,
      myPubKey,
      pubKeyNode,
      searchTransactions,
    };
  },
};
</script>

<style lang="scss">
.transactions__form {
  margin: auto;

  width: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;

  .transactions-title {
    margin-bottom: 10px;

    font-size: 40px;
    color: $onBgColor;
    text-align: center;
  }
  .core-input {
    margin-top: 20px;
  }
  .core-button {
    margin-top: 20px;
  }
}
.tooltip {
  background-color: rgba(255, 255, 255, 0.87) !important;
}
</style>
