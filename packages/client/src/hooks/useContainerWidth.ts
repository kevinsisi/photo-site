import { useEffect, useRef, useState } from 'react';

const DEBOUNCE_MS = 150;

/**
 * Measures the width of the returned ref's element, re-measuring
 * (debounced) when it resizes. Width 0 until first measure.
 */
export function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    setWidth(el.clientWidth);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? el.clientWidth;
      clearTimeout(timer);
      timer = setTimeout(() => setWidth(Math.round(next)), DEBOUNCE_MS);
    });
    observer.observe(el);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return { ref, width };
}
