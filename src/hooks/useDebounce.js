import { useEffect, useState } from 'react';

export function useDebounce(value, delay_ms = 300) {
  const [debounced, set_debounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => set_debounced(value), delay_ms);
    return () => clearTimeout(t);
  }, [value, delay_ms]);
  return debounced;
}
