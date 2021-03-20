<template>
  <div class="peer-to-peer">
    <div class="status">Status: {{ connected }}</div>
    <form class="p2p-form">
      <CoreInput
        v-for="input in form"
        :placeholder="input.placeholder"
        :field-name="input.fieldName"
        :key="input.fieldName"
        :error-msg="input.errorMsg"
        :show-error="!input.valid && highlightErrors"
        v-model:value="input.value"
      />

      <div
        class="switch-box"
        v-for="item in switches"
        :key="item.name"
      >
        <p>{{ item.name }}</p>
        <CoreSwitch
          v-model:checked="item.value"
        />
      </div>
      <CoreButton class="p2p-button" @click.prevent="onConnect">Connect</CoreButton>
    </form>
  </div>
</template>

<script>
import { ref, computed, reactive } from 'vue';
import CoreInput from '@/components/CoreInput';
import CoreButton from '@/components/CoreButton';
import CoreSwitch from '@/components/CoreSwitch';
import useForm from '@/use/form/form';

const required = (val) => !!val;
const validUrl = (val) => /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi.test(val);
const hasPort = (val) => /.+:\d+$/gi.test(val);

export default {
  name: 'PeerToPeer',
  components: {
    CoreInput,
    CoreButton,
    CoreSwitch,
  },
  setup() {
    const status = ref(false);
    const connected = computed(() => (status.value ? 'Connected' : 'Disconnected'));

    const form = useForm({
      peers: {
        value: '',
        fieldName: 'Enter peers',
        placeholder: 'http://yourlink.com:3001',
        validators: {
          required: {
            func: required,
            errorMsg: 'Please, fill the field',
            priority: 1,
          },
          validUrl: {
            func: validUrl,
            errorMsg: 'Invalid URL',
            priority: 2,
          },
          hasPort: {
            func: hasPort,
            errorMsg: 'Please add port',
            priority: 3,
          },
        },
      },
      serverHost: {
        value: '127.0.0.1',
        fieldName: 'Host address',
        placeholder: '127.0.0.1',
        validators: {
          required: {
            func: required,
            errorMsg: 'Please, fill the field',
            priority: 1,
          },
        },
      },
      serverPort: {
        value: 'auto',
        fieldName: 'Server Port',
        placeholder: '3000',
        validators: {
          required: {
            func: required,
            errorMsg: 'Please, fill the field',
            priority: 1,
          },
        },
      },
      ngrokApi: {
        value: 'Paste your key if ngrok active',
        fieldName: 'Ngrok API Key',
        placeholder: 'Paste your key if ngrok active',
        validators: {
          required: {
            func: required,
            errorMsg: 'Please, fill the field',
            priority: 1,
          },
        },
      },
    });

    const switches = reactive({
      API: {
        value: true,
        name: 'API',
      },
      ngrok: {
        value: false,
        name: 'ngrok',
      },
    });

    const highlightErrors = ref(false);

    const onConnect = () => {
      const formIsValid = !Object.values(form)
        .map(field => !field.valid)
        .filter(Boolean).length;

      if (!formIsValid) {
        highlightErrors.value = true;
      }
    };

    return {
      connected,
      form,
      onConnect,
      switches,
      highlightErrors,
    };
  },
};
</script>

<style scoped lang="scss">
.peer-to-peer {
  width: 100%;

  .p2p-form {
    margin: auto;

    width: 40%;
    display: flex;
    flex-direction: column;
    align-items: center;

    .core-input {
      margin-top: 20px;
    }

    .switch-box {
      width: 100%;
      align-self: flex-start;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: $onBgColor;
    }

    .p2p-button {
      margin-top: 10px;
    }
  }
}
</style>
