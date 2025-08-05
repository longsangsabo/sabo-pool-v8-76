import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number; // Distance from bottom to trigger load (in pixels)
  hasMore?: boolean;
  loadMore: () => Promise<void> | void;
}

export const useInfiniteScroll = ({
  threshold = 300,
  hasMore = true,
  loadMore,
}: UseInfiniteScrollOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const handleScroll = useCallback(() => {
    if (!hasMore || isLoading || loadingRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    // Check if we're near the bottom
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < threshold) {
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);

      const loadPromise = loadMore();

      if (loadPromise && typeof loadPromise.then === 'function') {
        loadPromise
          .then(() => {
            setIsLoading(false);
            loadingRef.current = false;
          })
          .catch(err => {
            setError(err.message || 'Failed to load more content');
            setIsLoading(false);
            loadingRef.current = false;
          });
      } else {
        // If loadMore doesn't return a promise, assume it's synchronous
        setTimeout(() => {
          setIsLoading(false);
          loadingRef.current = false;
        }, 100);
      }
    }
  }, [hasMore, isLoading, threshold, loadMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use passive listener for better performance
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // Initial check in case content doesn't fill the screen
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasMore) return;

    const checkInitialLoad = () => {
      const { scrollHeight, clientHeight } = container;
      if (scrollHeight <= clientHeight && !isLoading) {
        handleScroll();
      }
    };

    // Small delay to ensure content is rendered
    setTimeout(checkInitialLoad, 100);
  }, [hasMore, isLoading, handleScroll]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    loadingRef.current = false;
  }, []);

  return {
    containerRef,
    isLoading,
    error,
    reset,
  };
};

export default useInfiniteScroll;
