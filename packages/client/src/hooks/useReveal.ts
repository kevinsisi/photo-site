import { useCallback, useEffect, useRef } from 'react';

/**
 * Entrance-reveal hook: returns a ref callback to attach to each
 * `.reveal-item`. The first time an element scrolls into view it gets the
 * `.revealed` class and is unobserved, so the animation plays exactly once.
 * The actual animation is pure CSS, keyed off data-anim (see index.css).
 *
 * Pending (not yet revealed) elements are tracked in a Set so the effect can
 * re-observe them after React StrictMode's simulated unmount disconnects the
 * observer (ref callbacks don't re-fire on the remount in React 18).
 */
export function useReveal() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingRef = useRef(new Set<HTMLElement>());

  const getObserver = useCallback(() => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              pendingRef.current.delete(entry.target as HTMLElement);
              observerRef.current?.unobserve(entry.target);
            } else if (!entry.target.isConnected) {
              // Element left the DOM before revealing — stop tracking it
              pendingRef.current.delete(entry.target as HTMLElement);
              observerRef.current?.unobserve(entry.target);
            }
          }
        },
        // Start the reveal slightly before the item is fully in view
        { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
      );
    }
    return observerRef.current;
  }, []);

  const revealRef = useCallback(
    (el: HTMLElement | null) => {
      if (el && !el.classList.contains('revealed')) {
        pendingRef.current.add(el);
        getObserver().observe(el);
      }
    },
    [getObserver]
  );

  useEffect(() => {
    // Re-observe anything still pending (StrictMode remount, late mounts)
    const pending = pendingRef.current;
    for (const el of pending) {
      if (el.isConnected) {
        getObserver().observe(el);
      } else {
        pending.delete(el);
      }
    }
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [getObserver]);

  return revealRef;
}
