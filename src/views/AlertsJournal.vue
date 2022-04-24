<template>
  <div class="alerts-journal">
    <div class="chips-container">
      <div
        v-for="chip in chips"
        class="chip"
        :key="'chip' + chip.name"
        :class="{'inactive': chip.hidden}"
        @click="onChipClick(chip)"
      >{{ chip.name }}</div>
    </div>
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

export default {
  name: 'AlertsJournal',
  components: { Alert },
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
        hidden: !existingTypes.value.includes('error'),
      },
      {
        name: 'info',
        hidden: !existingTypes.value.includes('info'),
      },
      {
        name: 'warning',
        hidden: !existingTypes.value.includes('warning'),
      },
      {
        name: 'success',
        hidden: !existingTypes.value.includes('success'),
      },
    ]);

    const filteredJournal = computed(() => {
      const chosenTypes = chips.value
        .filter(chip => !chip.hidden)
        .map(chip => chip.name);

      // eslint-disable-next-line arrow-body-style
      return alertsJournal.value.filter(alertInfo => {
        return chosenTypes.includes(alertInfo.type) && existingTypes.value.includes(alertInfo.type);
      });
    });

    const onChipClick = (chip) => {
      if (!chip.hidden) {
        const visibleChipsNum = chips.value
          .map(_chip => !_chip.hidden)
          .filter(Boolean).length;

        if (visibleChipsNum <= 1) return;
      } else if (!existingTypes.value.includes(chip.name)) return;

      chip.hidden = !chip.hidden;
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
      onChipClick,
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

  .chips-container {
    padding: 25px 20px 15px;

    display: flex;
    z-index: 10;
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
    max-width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    margin-top: 10px;

    flex-grow: 1;
  }
}
</style>
