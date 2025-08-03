import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  speed: 'slow' | 'moderate' | 'fast';
  quality: {
    isOnline: boolean;
    speed: 'slow' | 'moderate' | 'fast';
  };
  networkQuality: {
    isOnline: boolean;
    speed: 'slow' | 'moderate' | 'fast';
    latency: number;
    effectiveType?: string;
  };
  isChecking: boolean;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [speed, setSpeed] = useState<'slow' | 'moderate' | 'fast'>('moderate');
  const [isChecking, setIsChecking] = useState(false);
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Estimate connection speed
    const connection = (navigator as any).connection;
    if (connection) {
      const updateSpeed = () => {
        const effectiveType = connection.effectiveType;
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          setSpeed('slow');
        } else if (effectiveType === '3g') {
          setSpeed('moderate');
        } else {
          setSpeed('fast');
        }
      };

      updateSpeed();
      connection.addEventListener('change', updateSpeed);

      return () => {
        connection.removeEventListener('change', updateSpeed);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    speed,
    quality: {
      isOnline,
      speed,
    },
    networkQuality: {
      isOnline,
      speed,
      latency,
      effectiveType: (navigator as any).connection?.effectiveType,
    },
    isChecking,
  };
};
