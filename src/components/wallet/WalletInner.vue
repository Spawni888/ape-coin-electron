<template>
  <div class="wallet-inner">

    <form class="transaction-form">
      <div class="form-title">Create Transaction</div>
      <CoreInput
        v-for="field in form"
        :placeholder="field.placeholder"
        :field-name="field.fieldName"
        :key="field.fieldName"
        :error-msg="field.errorMsg"
        :show-error="!field.valid && highlightErrors"
        v-model:value="field.value"
      />
      <CoreInput
        v-for="field in formFee"
        ref="feeNode"
        :placeholder="field.placeholder"
        :field-name="field.fieldName"
        :key="field.fieldName"
        :error-msg="field.errorMsg"
        :show-error="!field.valid && highlightErrors"
        v-model:value="field.value"
      />
      <CoreButton @click.prevent="createTransaction">
        Send
      </CoreButton>
    </form>
    <div class="address">
      <CoreButton @click="modalIsShowing = true">My Address</CoreButton>
    </div>
    <Modal
      v-if="modalIsShowing"
      :modal-info="modalInfo"
      @answer="modalIsShowing = false"
    />
  </div>
</template>

<script>
import { useStore } from 'vuex';
import {
  computed, onMounted, reactive, ref,
} from 'vue';
import CoreInput from '@/components/main/CoreInput';
import useForm from '@/use/form/form';
import CoreButton from '@/components/main/CoreButton';
import Modal from '@/components/Modal';
import useTooltip from '@/use/tooltip';
import { debounce } from 'lodash';

const required = (val) => !!val;
const shouldBeLength = (length) => (val) => val.length === length;

export default {
  name: 'WalletInner',
  components: { CoreButton, CoreInput, Modal },
  setup() {
    const store = useStore();
    const myBalance = computed(() => store.getters.walletBalance);
    const myAddress = computed(() => store.getters.walletPublicKey);

    const form = useForm({
      recipient: {
        value: '',
        fieldName: 'Recipient address',
        placeholder: 'Recipient public key',
        validators: {
          required: {
            priority: 1,
            func: required,
            errorMsg: 'Please, fill the field',
          },
          shouldBeLength: {
            priority: 2,
            func: shouldBeLength(130),
            errorMsg: 'Address should be 130 symbols length',
          },
          notMyAddress: {
            priority: 3,
            func: (val) => val !== myAddress.value,
            errorMsg: 'You can\'t transact money to yourself',
          },
        },
      },
      amount: {
        value: '',
        fieldName: 'Amount',
        placeholder: 'Amount of transaction',
        validators: {
          required: {
            priority: 1,
            func: required,
            errorMsg: 'Please, fill the field',
          },
          shouldBeNumber: {
            priority: 2,
            func: (val) => /[\d.]+/gi.test(val),
            errorMsg: 'Amount should be a number',
          },
          moreThanZeroLessThanBalance: {
            priority: 3,
            func: (val) => val > 0 && val <= myBalance.value,
            errorMsg: 'Invalid amount. Check your balance',
          },
        },
      },
    });
    const formFee = useForm({
      fee: {
        value: '',
        fieldName: 'Fee',
        placeholder: 'Transaction fee',
        validators: {
          noValOrIsNumeric: {
            priority: 1,
            func: (val) => !val || /[\d.]+/gi.test(val),
            errorMsg: 'Amount should be a number',
          },
          validValue: {
            priority: 2,
            func(val) {
              const restBalance = myBalance.value
                - (form.amount.value.length ? form.amount.value : 0);

              return val >= 0 && val <= restBalance;
            },
            errorMsg: 'Invalid amount. Check your balance',
          },
        },
      },
    });

    const modalIsShowing = ref(false);
    const modalInfo = reactive({
      title: 'Here is your crypto wallet!',
      paragraphs: [
        '<span style="font-weight: 500">Your public key:</span>',
        `<span style="word-break: break-all">${myAddress.value}</span> `,
        '<span style="font-weight: 500">Public key of your wallet plays role of address. If you want someone to send money to you, share this address.</span>',
      ],
      buttons: [
        {
          name: 'Ok',
          answer: false,
        },
      ],
    });

    const highlightErrors = ref(false);
    const createTransaction = debounce(() => {
      const formIsValid = !Object.values(form)
        .filter(field => !field.valid).length;

      if (!formIsValid) {
        highlightErrors.value = true;
        return;
      }

      store.dispatch('createTransaction', {
        recipient: form.recipient.value,
        amount: form.amount.value,
        fee: formFee.fee.value.length !== 0 ? formFee.fee.value : 0,
      });
    }, 200);

    const feeNode = ref(null);
    onMounted(() => {
      useTooltip({
        el: feeNode.value,
        id: 'feeNode',
        maxWidth: 500,
        text: 'Transaction fee is a reward for miners. \n\n'
          + 'Miners prioritize transactions with higher fee. \n'
          + 'So, if you want to transact coins faster add some fee.',
      });
    });

    return {
      myBalance,
      form,
      formFee,
      modalIsShowing,
      modalInfo,
      highlightErrors,
      createTransaction,
      feeNode,
    };
  },
};
</script>

<style scoped lang="scss">
.wallet-inner {
  padding: 20px;

  color: $onBgColor;
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  .transaction-form {
    display: flex;
    width: 50%;
    flex-direction: column;
    align-items: center;
    .form-title {
      margin-bottom: 40px;

      font-size: 40px;
    }
    .core-input {
      margin-top: 20px;
    }
    .core-button {
      margin-top: 20px;
    }
  }
  .address {
    position: absolute;
    bottom: 20px;
    left: 20px;
  }
}
</style>
