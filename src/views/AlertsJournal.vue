<template>
  <div class="alerts-journal">
    <div class="chips-container">
      <div
        v-for="chip in chips"
        class="chip"
        :key="'chip' + chip.name"
        :class="{'inactive': chip.hidden}"
        @click="chip.hidden = !chip.hidden"
      >{{ chip.name }}</div>
    </div>
    <div class="alerts">
      <transition-group name="fade" mode="out-in">
        <Alert
          v-for="alertInfo in sortJournal(filteredJournal)"
          class="alert"
          :alert-info-prop="alertInfo"
          :key="'alertJ' + alertInfo.id"
        >
        </Alert>
      </transition-group>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import Alert from '@/components/Alert';

export default {
  name: 'AlertsJournal',
  components: { Alert },
  setup() {
    const store = useStore();
    const alertsJournal = computed(() => store.getters.alertsJournal);
    const sortJournal = (journal) => journal.sort((a, b) => b.timestamp - a.timestamp);

    const chips = ref([
      {
        name: 'error',
        hidden: false,
      },
      {
        name: 'info',
        hidden: false,
      },
      {
        name: 'warning',
        hidden: false,
      },
      {
        name: 'success',
        hidden: false,
      },
    ]);

    const filteredJournal = computed(() => {
      const chosenTypes = chips.value.filter(chip => !chip.hidden)
        .map(chip => chip.name);

      return alertsJournal.value.filter(alertInfo => chosenTypes.includes(alertInfo.type));
    });

    return {
      chips,
      alertsJournal,
      filteredJournal,
      sortJournal,
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
  display: flex;
  flex-direction: column;
  .chips-container {
    padding: 25px 20px 15px;

    display: flex;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
    background-color: $onBgColor;
    .chip {
      margin: 0 5px 10px;
      cursor: pointer;
      padding: 4px 12px;

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
    .chip.inactive {
      box-shadow: none;
      background-color: lighten($surfaceColor, 40%);
    }
  }
  .alerts {
    overflow-y: auto;
    margin-top: 10px;

    flex-grow: 1;
    .alert {
      position: relative;
      margin-top: 5px;
    }

  }
}
</style>
