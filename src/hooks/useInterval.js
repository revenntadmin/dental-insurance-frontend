import { useEffect, useRef } from 'react';

export function useInterval(callback, delay_ms) {
  const saved_callback = useRef(callback);
  useEffect(() => {
    saved_callback.current = callback;
  }, [callback]);
  useEffect(() => {
    if (delay_ms == null) return undefined;
    const id = setInterval(() => saved_callback.current?.(), delay_ms);
    return () => clearInterval(id);
  }, [delay_ms]);
}
