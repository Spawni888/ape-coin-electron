<template>
  <div class="alerts-journal">
    <Chips
      :chips="chips"
      :existingTypes="existingTypes"
    >
      <button
        class="clear-button"
        @click="clearAlertsJournal"
      >
        Clear
      </button>
    </Chips>
    <div class="alerts">
      <transition-group name="list" @before-leave="onBeforeLeave">
        <Alert
          v-for="alertInfo in sortJournal(filteredJournal)"
          :alert-info-prop="alertInfo"
          :key="'alertJ' + alertInfo.id"
          style="margin-bottom: 5px"
        >
        </Alert>
      </transition-group>
    </div>
  </div>
</template>

<script>
// TODO: add beautiful scrollbar later maybe
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import Alert from '@/components/Alert';
import gsap from 'gsap';

import Chips from '@/components/Chips';

export default {
  name: 'AlertsJournal',
  components: { Alert, Chips },
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

    const clearAlertsJournal = () => {
      store.dispatch('clearAlertsJournal');

      chips.value.forEach(chip => {
        chip.active = false;
      });
    };

    const onBeforeLeave = (el) => {
      // it's just for nice animation
      gsap.set(el, { top: el.offsetTop });
    };

    return {
      chips,
      alertsJournal,
      existingTypes,
      filteredJournal,
      sortJournal,
      clearAlertsJournal,
      onBeforeLeave,
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

  .alerts {
    max-width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    margin-top: 10px;

    flex-grow: 1;
  }
}
</style>
