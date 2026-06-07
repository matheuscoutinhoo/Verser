import { useLayoutEffect, useRef } from 'react';

export interface UseFlipAnimationOptions {
  /** Animation duration in ms. Default: 240. */
  duration?: number;
  /** Easing function. Default: 'cubic-bezier(0.4, 0, 0.2, 1)'. */
  easing?: string;
  /** Skip the animation when the user prefers reduced motion. Default: true. */
  respectReducedMotion?: boolean;
}

/**
 * FLIP-style animation hook for list reordering.
 *
 * FLIP = First, Last, Invert, Play. We record each tracked element's
 * `getBoundingClientRect()` BEFORE React commits (`useRef` updated at
 * render-time), then in `useLayoutEffect` compute the delta between
 * the old and new positions and apply an instant counter-translation
 * + animate it back to zero. The result: the user sees rows smoothly
 * slide between positions without us having to touch the DOM tree.
 *
 * Usage:
 *   const { register } = useFlipAnimation([items.map(i => i.id)]);
 *   …
 *   <li ref={(el) => register(item.id, el)} />
 *
 * The `deps` argument is the trigger — pass anything that captures the
 * "current order" (typically the ids array). When it changes, we
 * compare positions and animate.
 */
export function useFlipAnimation(deps: ReadonlyArray<unknown>, options: UseFlipAnimationOptions = {}) {
  const { duration = 240, easing = 'cubic-bezier(0.4, 0, 0.2, 1)', respectReducedMotion = true } =
    options;

  // Current keyed element refs.
  const nodes = useRef(new Map<string, HTMLElement>());
  // Last-known bounding rects per key, captured at the start of each render.
  const prevRects = useRef(new Map<string, DOMRect>());

  // Snapshot rects right before the browser paints the new layout.
  // This runs synchronously after React commits but before the screen
  // updates, so we can read the *new* positions inside useLayoutEffect.
  // We still need the *previous* positions — those were saved at the
  // end of the last render cycle (see further down).
  useLayoutEffect(() => {
    if (respectReducedMotion && typeof window !== 'undefined') {
      const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      if (mq?.matches) {
        // Skip animation entirely; just refresh the prev-rect cache.
        for (const [key, el] of nodes.current) {
          prevRects.current.set(key, el.getBoundingClientRect());
        }
        return;
      }
    }

    // Compute deltas and animate each moved element.
    for (const [key, el] of nodes.current) {
      const prev = prevRects.current.get(key);
      const next = el.getBoundingClientRect();
      if (prev) {
        const dx = prev.left - next.left;
        const dy = prev.top - next.top;
        if (dx !== 0 || dy !== 0) {
          // Invert: instantly move the element back to where it was.
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          el.style.transition = 'transform 0s';
          // Force a reflow so the browser registers the inverted position
          // before we start the play animation.
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          el.offsetHeight;
          // Play: clear the transform with a transition — element slides
          // from the old position to its new one.
          el.style.transition = `transform ${duration}ms ${easing}`;
          el.style.transform = '';
        }
      }
      prevRects.current.set(key, next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    /** ref callback — pass to each list item that should animate. */
    register: (key: string, el: HTMLElement | null) => {
      if (el) {
        nodes.current.set(key, el);
        // Seed the prev-rect cache on first mount so subsequent layouts
        // can compute a delta.
        if (!prevRects.current.has(key)) {
          prevRects.current.set(key, el.getBoundingClientRect());
        }
      } else {
        nodes.current.delete(key);
        prevRects.current.delete(key);
      }
    },
  };
}
