<template>
  <div class="peer-to-peer">
    <div class="status">Status: {{ connected }}</div>
    {{JSON.stringify(form, undefined, 2)}}
    <form class="p2p-form">
      <CoreInput
        :placeholder="form.peers.placeholder"
        :fieldName="form.peers.fieldName"
        v-model:value="form.peers.value"
      />
      <CoreButton class="p2p-button" @click.prevent="onConnect">Connect</CoreButton>
    </form>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import CoreInput from '@/components/CoreInput';
import CoreButton from '@/components/CoreButton';
import useForm from '@/use/form/form';

const required = (val) => !!val;
const validUrl = (val) => /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi.test(val);
const hasPort = (val) => /.+:\d+$/gi.test(val);

export default {
  name: 'PeerToPeer',
  components: {
    CoreInput,
    CoreButton,
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
          required,
          validUrl,
          hasPort,
        },
      },
    });

    const onConnect = (event) => {
      console.log(event.target);
    };

    return {
      connected,
      form,
      onConnect,
    };
  },
};
</script>

<style scoped lang="scss">
.peer-to-peer {
  .p2p-form {
    margin-top: 20px;

    display: flex;
    flex-direction: column;
    align-items: center;

    .p2p-button {
      margin-top: 20px;
    }
  }
}
</style>
