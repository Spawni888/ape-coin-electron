<template>
  <div class="wallet-auth">
    <div class="auth-title">
      Authentication
    </div>
    <div class="wallet-form">
      <CoreInput
        v-for="field in form"
        :key="field.fieldName"
        :field-name="field.fieldName"
        :placeholder="field.placeholder"
        :show-error="highlightErrors"
        :error-msg="field.errorMsg"
        v-model:value="field.value"
      />
      <CoreButton @click="signIn">Sign In</CoreButton>
    </div>
  </div>
</template>

<script>
import CoreButton from '@/components/CoreButton';
import CoreInput from '@/components/CoreInput';
import useForm from '@/use/form/form';
import { ref } from 'vue';

const required = (val) => !!val;

export default {
  name: 'WalletAuth',
  components: {
    CoreInput,
    CoreButton,
  },
  setup() {
    const form = useForm({
      pubKey: {
        value: '',
        fieldName: 'Public Key',
        placeholder: 'Paste your public key here',
        validators: {
          required: {
            func: required,
            errorMsg: 'Please, fill the field',
          },
        },
      },
      privKey: {
        value: '',
        fieldName: 'Private Key',
        placeholder: 'Paste your private key here',
        validators: {
          required: {
            func: required,
            errorMsg: 'Please, fill the field',
          },
        },
      },
    });
    const highlightErrors = ref(false);

    const signIn = () => {
      const formIsValid = !Object.values(form)
        .filter(field => !field.valid).length;

      console.log(formIsValid);
      if (!formIsValid) {
        highlightErrors.value = true;
      }
    };
    return {
      form,
      highlightErrors,
      signIn,
    };
  },
};
</script>

<style scoped lang="scss">
.wallet-auth {
  width: 40%;
  display: flex;
  flex-direction: column;
  align-items: center;
  .auth-title {
    margin-bottom: 30px;

    font-size: 50px;
    color: $onBgColor;
    text-align: center;
  }
  .wallet-form {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;

    .core-input {
      margin-top: 20px;
    }
    .core-button {
      margin-top: 30px;
    }
  }
}

</style>
