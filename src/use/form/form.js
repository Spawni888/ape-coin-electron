import { reactive } from 'vue';
import useField from '@/use/form/field';

export default function useForm(init) {
  const form = reactive(init);

  for (const [key, value] of Object.entries(init)) {
    form[key] = useField(value);
  }

  return form;
}
