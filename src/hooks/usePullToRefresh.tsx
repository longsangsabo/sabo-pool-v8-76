import { useState, useRef, useCallback } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
}: PullToRefreshOptions) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    setStartY(e.touches[0].clientY);
    setIsPulling(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling || isRefreshing) return;

      const container = containerRef.current;
      if (!container || container.scrollTop > 0) {
        setIsPulling(false);
        return;
      }

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      if (deltaY > 0) {
        e.preventDefault();
        const distance = deltaY / resistance;
        setPullDistance(Math.min(distance, threshold * 1.5));
      }
    },
    [isPulling, isRefreshing, startY, resistance, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh error:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  const getRefreshIndicatorStyle = () => {
    const opacity = Math.min(pullDistance / threshold, 1);
    const scale = Math.min(pullDistance / threshold, 1);
    const rotation = (pullDistance / threshold) * 180;

    return {
      opacity,
      transform: `scale(${scale}) rotate(${rotation}deg)`,
      transition: isPulling ? 'none' : 'all 0.3s ease-out',
    };
  };

  const getContainerStyle = () => {
    return {
      transform: `translateY(${pullDistance}px)`,
      transition: isPulling ? 'none' : 'transform 0.3s ease-out',
    };
  };

  return {
    containerRef,
    isRefreshing,
    isPulling,
    pullDistance,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    getRefreshIndicatorStyle,
    getContainerStyle,
  };
};
