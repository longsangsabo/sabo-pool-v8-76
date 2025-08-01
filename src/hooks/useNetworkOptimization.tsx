import { useState, useEffect } from 'react';

export interface ConnectionInfo {
  rtt: number;
  downlink: number;
  effectiveType: string;
  quality: string;
}

export const useNetworkOptimization = () => {
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [connectionQuality, setConnectionQuality] = useState<ConnectionInfo>({
    rtt: 50,
    downlink: 10,
    effectiveType: '4g',
    quality: 'good',
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setConnectionQuality({
          rtt: connection.rtt || 50,
          downlink: connection.downlink || 10,
          effectiveType: connection.effectiveType || '4g',
          quality: connection.effectiveType === '4g' ? 'good' : 'fair',
        });
      } else {
        // Fallback for browsers without connection API
        setConnectionQuality({
          rtt: 50,
          downlink: 10,
          effectiveType: '4g',
          quality: 'good',
        });
      }
    };

    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateConnectionInfo();
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener(
        'change',
        updateConnectionInfo
      );
    }

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener(
          'change',
          updateConnectionInfo
        );
      }
    };
  }, []);

  return {
    connectionType,
    connectionQuality,
    isOnline,
  };
};

export const useConnectionQuality = () => {
  const { connectionQuality } = useNetworkOptimization();
  return connectionQuality;
};

export const usePerformanceMonitoring = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
  });

  useEffect(() => {
    const measurePerformance = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = window.performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        setPerformanceMetrics({
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          renderTime:
            navigation.domContentLoadedEventEnd -
            navigation.domContentLoadedEventStart,
          memoryUsage: (window.performance as any).memory?.usedJSHeapSize || 0,
        });
      }
    };

    measurePerformance();
  }, []);

  return performanceMetrics;
};
