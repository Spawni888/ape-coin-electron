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
    >
      <Alert
        v-for="alertInfo in sortJournal(filteredJournal)"
        :alert-info-prop="alertInfo"
        :key="'alertJ' + alertInfo.id"
      >
      </Alert>
    </InfinityScroll>
  </div>
</template>

<script>
// TODO: add beautiful scrollbar later maybe
import { computed, ref } from 'vue';
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
    const sortJournal = (journal) => journal.sort((a, b) => b.timestamp - a.timestamp);

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

    const filteredJournal = computed(() => {
      const chosenTypes = chips.value
        .filter(chip => chip.active)
        .map(chip => chip.name);

      // eslint-disable-next-line arrow-body-style
      return alertsJournal.value.filter(alertInfo => {
        return chosenTypes.includes(alertInfo.type) && existingTypes.value.includes(alertInfo.type);
      });
    });

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

    return {
      chips,
      alertsJournal,
      existingTypes,
      filteredJournal,
      sortJournal,
      listKey,
      updateList,
      clearAlertsJournal,
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
