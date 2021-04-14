import { computed } from 'vue';
import { DateTime } from 'luxon';

export default function useFormattedTimestamp(timestamp) {
  return computed(() => DateTime.fromMillis(timestamp)
    .setLocale('en-US')
    .toFormat('dd.LL.yyyy t'));
}
