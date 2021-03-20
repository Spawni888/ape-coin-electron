import {
  ref,
  reactive,
  watch,
} from 'vue';

export default function useField(field) {
  const valid = ref(true);
  const value = ref(field.value);
  const errors = reactive({});
  const errorMsg = ref('');

  const reassign = val => {
    valid.value = true;

    Object.keys(field.validators ?? {})
      .sort((nameA, nameB) => field.validators[nameB].priority - field.validators[nameA].priority)
      .forEach(name => {
        const isValid = field.validators[name].func(val);
        errors[name] = !isValid;

        if (!isValid) {
          valid.value = false;
          errorMsg.value = field.validators[name].errorMsg;
        }
      });
  };

  reassign(field.value);
  watch(value, reassign);

  return {
    ...field,
    value,
    valid,
    errors,
    errorMsg,
  };
}
