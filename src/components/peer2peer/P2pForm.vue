<template>
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
        @click="item.onClick"
        :ref="item.name"
        v-model:checked="item.value"
      />
    </div>
    <CoreButton class="p2p-button" @click.prevent="onConnect">Connect</CoreButton>
  </form>
</template>

<script>
import {
  ref, onMounted, reactive,
} from 'vue';
import { useStore } from 'vuex';
import CoreInput from '@/components/CoreInput';
import CoreButton from '@/components/CoreButton';
import CoreSwitch from '@/components/CoreSwitch';
import useForm from '@/use/form/form';
import useTooltip from '@/use/tooltip';

const required = (val) => !!val;
const isNumeric = (val) => /^\d+$/.test(val);
const parseUrlsAndTestRegExp = (val, regExp) => {
  const urls = val.trim().replace(/[,\s;]+/gi, ',')
    .split(',');

  for (const url of urls) {
    const isValid = regExp.test(url);

    if (!isValid) {
      return false;
    }
  }
  return true;
};
const validUrl = (val) => parseUrlsAndTestRegExp(
  val,
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/i,
);
const hasPort = (val) => parseUrlsAndTestRegExp(val, /.+:\d+/i);

export default {
  name: 'P2pForm',
  components: {
    CoreInput,
    CoreButton,
    CoreSwitch,
  },
  setup() {
    const form = useForm({
      peers: {
        value: '',
        fieldName: 'Enter peers',
        placeholder: 'http://yourlink.com:3001',
        validators: {
          noValOrValidUrl: {
            func: (val) => !val || validUrl(val),
            errorMsg: 'Invalid URL',
            priority: 1,
          },
          noValueOrHasPort: {
            func: (val) => !val || hasPort(val),
            errorMsg: 'Please add port',
            priority: 2,
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
        value: '',
        fieldName: 'Server Port',
        placeholder: 'auto',
        validators: {
          noValOrIsNumeric: {
            func: (val) => !val || isNumeric(val),
            errorMsg: 'Port should be a Number',
            priority: 1,
          },
        },
      },
      ngrokApiKey: {
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
        name: 'API',
        value: true,
      },
      ngrok: {
        name: 'ngrok',
        value: false,
        onClick: () => {
          if (switches.ngrok.value) {
            form.ngrokApiKey.value = '';
          } else {
            form.ngrokApiKey.value = 'Paste your key if ngrok active';
          }
        },
      },
    });

    const API = ref(null);
    const ngrok = ref(null);
    onMounted(() => {
      useTooltip({
        el: API.value,
        id: 'API',
        text: 'Turn on HTTP API if active',
      });
      useTooltip({
        el: ngrok.value,
        id: 'ngrok',
        maxWidth: 300,
        text: 'You should port forward to mine faster, because people will be able to'
          + ' connect to you. You will have as much actual info as connections of your network. '
          + 'But if you can`t port forward you can use ngrok to expose your network. '
          + 'Register for free at ngrok.com and pass ngrok Key to the field above.',
      });
    });

    const highlightErrors = ref(false);
    const store = useStore();

    const onConnect = () => {
      const formIsValid = !Object.values(form)
        .map(field => !field.valid)
        .filter(Boolean).length;

      if (!formIsValid) {
        highlightErrors.value = true;
        return;
      }

      const serverOptions = {};
      Object.keys(form)
        .forEach(key => {
          serverOptions[key] = form[key].value;
        });
      Object.values(switches).forEach(item => {
        serverOptions[item.name] = item.value;
      });

      store.dispatch('createServer', serverOptions);
    };

    return {
      form,
      switches,
      API,
      ngrok,
      highlightErrors,
      onConnect,
    };
  },
};
</script>

<style scoped lang="scss">
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
</style>
