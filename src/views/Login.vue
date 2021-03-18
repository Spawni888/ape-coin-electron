<template>
  <div class="login">
    <div>{{ JSON.stringify(form, undefined, 2) }}</div>
    <form @submit.prevent="onSubmit">
      <label for="pubKey">public key</label>
      <input
        :placeholder="form.pubKey.placeholder"
        :class="{'input-error': !form.pubKey.valid && highlightErrors}"
        id="pubKey"
        type="text"
        v-model="form.pubKey.value"
      >
      <br>
      <label for="privKey">private key</label>
      <input
        :placeholder="form.pubKey.placeholder"
        :class="{'input-error': !form.privKey.valid && highlightErrors}"
        id="privKey"
        type="text"
        v-model="form.privKey.value"
      >
      <br>
      <button>Login</button>
    </form>
    <div class="create-wallet">
      <button @click="createWallet">Create Wallet</button>
    </div>
  </div>
</template>

<script>
import useForm from '@/use/form/form';
import { ref } from 'vue';
// eslint-disable-next-line
import { ipcRenderer } from 'electron';

const required = val => !!val;

export default {
  name: 'Login',
  setup() {
    const form = useForm({
      pubKey: {
        value: '',
        placeholder: 'your public key',
        validators: {
          required,
        },
      },
      privKey: {
        value: '',
        placeholder: 'your private key',
        validators: {
          required,
        },
      },
    });
    const highlightErrors = ref(false);

    const onSubmit = () => {
      if (!highlightErrors.value) {
        const validForm = !Object.values(form)
          .map(field => !field.valid)
          .filter(Boolean).length;

        if (!validForm) {
          highlightErrors.value = true;
        }
      }
    };
    const createWallet = () => {
      ipcRenderer.send('createWallet');
    };

    ipcRenderer.on('newWalletCreated', (event, keyPair) => {
      console.log(keyPair);
    });

    return {
      form,
      onSubmit,
      highlightErrors,
      createWallet,
    };
  },
};
</script>

<style scoped lang="scss">
.input-error {
  background-color: red;
}
</style>
