import { reactive } from 'vue';
import useField from '@/use/form/field';

export default function useForm(init) {
  const form = reactive(init);

  for (const [key, value] of Object.entries(init)) {
    // eslint-disable-next-line no-return-assign
    form[key] = useField(value);
  }

  return form;
}
