import {
  ref,
  reactive,
  watch,
} from 'vue';

export default function useField(field) {
  const valid = ref(true);
  const value = ref(field.value);
  const errors = reactive({});
  const errorMsg = ref('Error');

  const reassign = val => {
    valid.value = true;

    Object.keys(field.validators ?? {})
      .sort((nameA, nameB) => field.validators[nameB].priority - field.validators[nameA].priority)
      .forEach(name => {
        const isValid = typeof field.validators[name] === 'function'
          ? field.validators[name](val)
          : field.validators[name].func(val);

        errors[name] = !isValid;

        if (!isValid) {
          valid.value = false;
          if (field.validators[name].errorMsg) {
            errorMsg.value = field.validators[name].errorMsg;
          }
        }
      });
  };
  const result = field.validators
    ? {
      ...field,
      value,
      valid,
      errors,
      errorMsg,
    }
    : {
      ...field,
      valid: true,
      value,
    };

  reassign(field.value);

  watch(value, reassign);

  if (field.watchTarget) {
    watch(field.watchTarget, () => {
      reassign(value.value);
    });
  }

  return result;
}
