<template>
  <div class="wallet-auth">
    <div class="auth-title">
      Authentication
    </div>
    <form class="wallet-form">
      <CoreInput
        v-for="field in form"
        :key="field.fieldName"
        :field-name="field.fieldName"
        :placeholder="field.placeholder"
        :show-error="highlightErrors && !field.valid"
        :error-msg="field.errorMsg"
        v-model:value="field.value"
      />
      <div
        class="switch-box"
      >
        <p>Stay Logged In</p>
        <CoreSwitch
          v-model:checked="keepLoggedIn"
        />
      </div>
      <CoreButton @click.prevent="signIn">Sign In</CoreButton>
    </form>
    <div class="create-wallet">
      <CoreButton @click="createWallet">Create Wallet</CoreButton>
    </div>
    <transition name="fade" mode="out-in">
      <Modal
        v-if="modalIsShowing"
        :modal-info="modalInfo"
        @answer="onAnswer"
      />
    </transition>
  </div>
</template>

<script>
import CoreButton from '@/components/CoreButton';
import CoreInput from '@/components/CoreInput';
import Modal from '@/components/Modal';
import useForm from '@/use/form/form';
import { ref, reactive } from 'vue';
import { useStore } from 'vuex';
import { ipcRenderer } from 'electron';
import CoreSwitch from '@/components/CoreSwitch';
import { FROM_BG, TO_BG } from '@/resources/channels';

const required = (val) => !!val;

export default {
  name: 'WalletAuth',
  components: {
    CoreSwitch,
    CoreInput,
    CoreButton,
    Modal,
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
    const store = useStore();
    const highlightErrors = ref(false);
    const keepLoggedIn = ref(true);
    const signInWallet = (pubKey, privKey) => store.dispatch('signInWallet', {
      pubKey,
      privKey,
    });

    const signIn = () => {
      const formIsValid = !Object.values(form)
        .filter(field => !field.valid).length;

      if (!formIsValid) {
        highlightErrors.value = true;
        return;
      }
      if (keepLoggedIn.value) {
        ipcRenderer.send(TO_BG.SAVE_WALLET_AUTH, {
          privKey: form.privKey.value,
          pubKey: form.pubKey.value,
        });
      }

      signInWallet(form.pubKey.value, form.privKey.value);
    };

    const modalIsShowing = ref(false);
    const modalInfo = reactive({
      title: 'Your wallet was created successfully!',
      paragraphs: [],
      buttons: [
        {
          name: 'Disagree',
          answer: false,
        },
        {
          name: 'Agree',
          answer: true,
        },
      ],
    });

    const newKeyPair = reactive({});
    const createWallet = () => {
      ipcRenderer.send(TO_BG.CREATE_WALLET);
    };

    ipcRenderer.on(FROM_BG.WALLET_CREATED, (event, keyPair) => {
      [newKeyPair.pub, newKeyPair.priv] = [keyPair.pub, keyPair.priv];

      modalInfo.paragraphs = [
        '<span style="font-weight: 500">PublicKey (your address) is:</span>',
        `<span style="word-break: break-all">${keyPair.pub}</span> `,
        '<span style="font-weight: 500">PrivateKey (don`t share it) is:</span>',
        `<span style="word-break: break-all">${keyPair.priv}</span> `,
        '<span style="font-weight: 500">Do you want to save it at your PC, so you won\'t forget it?</span>',
      ];

      modalIsShowing.value = true;
    });

    const onAnswer = (answer) => {
      if (answer) {
        ipcRenderer.send(TO_BG.SAVE_WALLET_CREDITS, {
          priv: newKeyPair.priv,
          pub: newKeyPair.pub,
        });
      }
      modalIsShowing.value = false;
    };

    ipcRenderer.on(FROM_BG.NEW_WALLET_SAVED, (event, filePath) => {
      store.commit('showAlert', {
        type: 'success',
        title: 'Success',
        message: `You have saved your keyPair at ${filePath} successfully.`,
      });
    });
    ipcRenderer.on(FROM_BG.NEW_WALLET_SAVE_ERROR, () => {
      store.commit('showAlert', {
        type: 'error',
        title: 'Error',
        message: 'An Error occurred during saving...',
      });
    });

    return {
      form,
      highlightErrors,
      keepLoggedIn,
      signIn,
      modalIsShowing,
      modalInfo,
      createWallet,
      onAnswer,
    };
  },
};
</script>

<style scoped lang="scss">
.wallet-auth {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .auth-title {
    margin-bottom: 30px;

    font-size: 50px;
    color: $onBgColor;
    text-align: center;
  }

  .wallet-form {
    width: 40%;
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

  .create-wallet {
    position: absolute;
    bottom: 20px;
    right: 20px;
  }
}
.switch-box {
  width: 100%;
  align-self: flex-start;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: $onBgColor;
}
</style>
