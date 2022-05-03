<template>
  <div class="alerts-journal">
    <Chips
      :chips="chips"
      :existingTypes="existingTypes"
      @updated="updateList"
    >
      <button
        class="clear-button"
        @click="clearAlertsJournal"
      >
        Clear
      </button>
    </Chips>
    <InfinityScroll
      :listKey="listKey"
      :allItemsLoaded="allItemsLoaded"
      @request-items="addMoreAlerts"
    >
      <Alert
        v-for="alertInfo in filterJournal(alertsJournalSlice)"
        :alert-info-prop="alertInfo"
        :key="'alertJ' + alertInfo.id"
      >
      </Alert>
    </InfinityScroll>
  </div>
</template>

<script>
import {
  computed,
  ref,
  watch,
  onMounted,
} from 'vue';
import { useStore } from 'vuex';
import Alert from '@/components/Alert';

import Chips from '@/components/Chips';
import InfinityScroll from '@/components/InfinityScroll';

export default {
  name: 'AlertsJournal',
  components: { Alert, Chips, InfinityScroll },
  setup() {
    const store = useStore();
    const alertsJournal = computed(() => store.getters.alertsJournal);
    const alertsJournalSlice = ref([...store.getters.alertsJournal.slice(0, 19)]);

    const existingTypes = computed(
      () => alertsJournal.value
        .filter((alertInfo, index, self) => self.indexOf(alertInfo) === index)
        .map(alertInfo => alertInfo.type),
    );

    const chips = ref([
      {
        name: 'error',
        active: existingTypes.value.includes('error'),
      },
      {
        name: 'info',
        active: existingTypes.value.includes('info'),
      },
      {
        name: 'warning',
        active: existingTypes.value.includes('warning'),
      },
      {
        name: 'success',
        active: existingTypes.value.includes('success'),
      },
    ]);

    const filterJournal = (_alertsJournalSlice) => {
      const chosenTypes = chips.value
        .filter(chip => chip.active)
        .map(chip => chip.name);

      // eslint-disable-next-line arrow-body-style
      return _alertsJournalSlice.filter(alertInfo => {
        return chosenTypes.includes(alertInfo.type) && existingTypes.value.includes(alertInfo.type);
      });
    };

    const listKey = ref('list-key:true');
    const updateList = () => {
      const keyValue = listKey.value.split(':')[1] === 'true';
      listKey.value = `list-key:${!keyValue}`;
    };

    const clearAlertsJournal = () => {
      store.dispatch('clearAlertsJournal');

      chips.value.forEach(chip => {
        chip.active = false;
      });
      updateList();
    };

    const allItemsLoaded = ref(false);
    const addMoreAlerts = () => {
      const curSliceLength = alertsJournalSlice.value.length;

      alertsJournalSlice.value.push(
        ...alertsJournal.value.slice(curSliceLength, curSliceLength + 20),
      );

      if (alertsJournalSlice.value.length === alertsJournal.value.length) {
        allItemsLoaded.value = true;
      }
    };

    onMounted(() => {
      watch(alertsJournal.value, (value) => {
        // initial load
        if (!alertsJournalSlice.value.length && value.length) {
          alertsJournalSlice.value.push(...value?.slice(0, 20));
          return;
        }
        alertsJournalSlice.value.unshift(value[0]);
      });
    });

    return {
      chips,
      alertsJournalSlice,
      existingTypes,
      filterJournal,
      listKey,
      updateList,
      clearAlertsJournal,
      allItemsLoaded,
      addMoreAlerts,
    };
  },
};
</script>

<style scoped lang="scss">
$errorBg: #ffbab2;
$errorColor: #611A15;
$errorIconCol: #F45448;
$warningBg: #ffe8aa;
$warningColor: #7D3C00;
$warningIconCol: #FFA117;
$infoBg: #E8F4FD;
$infoColor: #0D3C61;
$infoIconCol: #359FF4;
$successBg: #b3ffb3;
$successColor: #1E4640;
$successIconCol: #5CB65F;

.alerts-journal {
  background-color: $bgColor;
  z-index: 9;
  width: 100%;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;

  .clear-button {
    margin: 0 5px 10px;
    cursor: pointer;
    padding: 6px 18px;

    background: $surfaceColor;
    user-select: none;
    color: $onSurfaceColor;
    font-weight: 400;
    border-radius: 10px;
    border: none;
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.6);
    transition: .4s ease-in-out;

    &:hover {
      background: lighten($surfaceColor, 10%);
    }
  }
}
</style>
