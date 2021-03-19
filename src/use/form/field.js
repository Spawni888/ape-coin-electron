import {
  ref,
  reactive,
  watch,
} from 'vue';

export default function useField(field) {
  const valid = ref(true);
  const value = ref(field.value);
  const errors = reactive({});

  const reassign = val => {
    valid.value = true;

    Object.keys(field.validators ?? {})
      .forEach(name => {
        const isValid = field.validators[name](val);
        errors[name] = !isValid;

        if (!isValid) {
          valid.value = false;
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
  };
}
