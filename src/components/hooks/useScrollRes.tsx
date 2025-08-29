import { useCallback, useEffect, useRef } from "react";
import { clearScrollPosition, getScrollPosition } from "~/lib/utils/scrollPosition";

export const useScrollRestoration = (key: string) => {
  useEffect(() => {
    const saved = getScrollPosition(key);
    if (saved != null) {
      // Ensure layout is ready before scrolling
      requestAnimationFrame(() => {
        window.scrollTo(0, saved);
      });
      // Scroll again shortly after mount to account for async content/image layout
      const t = setTimeout(() => {
        window.scrollTo(0, saved);
        clearScrollPosition(key);
      }, 300);
      return () => clearTimeout(t);
    } else {
      window.scrollTo(0, 0);
    }
  }, [key]);
};

export const useInfiniteScroll = (
  onLoadMore: () => void,
  isLoading: boolean,
  hasNextPage: boolean,
  threshold: number = 100,
) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isLoading) {
        onLoadMore();
      }
    },
    [onLoadMore, hasNextPage, isLoading],
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      rootMargin: `${threshold}px`,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, threshold]);

  return loadMoreRef;
};
