import { useCallback, useEffect, useRef, useState } from 'react';

export function useLocalDraft(key, initial) {
  const [value, set_value] = useState(() => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  const timer = useRef(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch {
        // ignore
      }
    }, 250);
    return () => timer.current && clearTimeout(timer.current);
  }, [key, value]);

  const clear = useCallback(() => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, [key]);

  return [value, set_value, clear];
}
