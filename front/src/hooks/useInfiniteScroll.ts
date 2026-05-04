/**
 * useInfiniteScroll — fires a callback when the observed element scrolls into view.
 *
 * Used by the Pokedex grid to fetch the next page once the user reaches the
 * sentinel <div ref={observerTarget} /> at the bottom of the list.
 */

import { useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions {
  /** Whether more data is available — pass `pagination.hasMore`. */
  hasMore: boolean;
  /** Pause the observer while a fetch is in flight. */
  isLoading: boolean;
  /** Callback invoked when the sentinel scrolls into view. */
  onLoadMore: () => void;
  /** IntersectionObserver threshold; default 0.5 matches prior code. */
  threshold?: number;
}

export const useInfiniteScroll = <T extends HTMLElement = HTMLDivElement>({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 0.5,
}: UseInfiniteScrollOptions) => {
  const observerTarget = useRef<T | null>(null);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore, threshold]);

  return observerTarget;
};
