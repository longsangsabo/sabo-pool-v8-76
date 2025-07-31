import { useEffect, useCallback, useRef } from 'react';
import { useOffline } from '@/contexts/OfflineContext';
import { useNetworkStatus } from './useNetworkStatus';

interface BackgroundSyncOptions {
  interval?: number; // Sync interval in milliseconds
  retryAttempts?: number;
  retryDelay?: number;
  enableBatteryOptimization?: boolean;
}

export const useBackgroundSync = (options: BackgroundSyncOptions = {}) => {
  const {
    interval = 30000, // 30 seconds default
    retryAttempts = 3,
    retryDelay = 5000,
    enableBatteryOptimization = true
  } = options;

  const { syncCoordinator, queueManager, isOfflineReady } = useOffline();
  const { networkQuality } = useNetworkStatus();
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef(0);

  // Check battery status for optimization
  const checkBatteryStatus = useCallback(async (): Promise<boolean> => {
    if (!enableBatteryOptimization) return true;
    
    try {
      const battery = await (navigator as any).getBattery?.();
      if (battery) {
        // Reduce sync frequency on low battery or when not charging
        return battery.level > 0.2 || battery.charging;
      }
    } catch (error) {
      console.warn('Battery API not available:', error);
    }
    return true;
  }, [enableBatteryOptimization]);

  // Determine sync interval based on network and battery conditions
  const getAdaptiveInterval = useCallback(async (): Promise<number> => {
    const batteryOk = await checkBatteryStatus();
    
    if (!batteryOk) {
      return interval * 3; // Reduce frequency on low battery
    }

    switch (networkQuality.speed) {
      case 'slow':
        return interval * 2;
      case 'moderate':
        return interval * 1.5;
      case 'fast':
      default:
        return interval;
    }
  }, [interval, networkQuality.speed, checkBatteryStatus]);

  // Execute background sync
  const executeSync = useCallback(async () => {
    if (!networkQuality.isOnline || !isOfflineReady) return;

    const stats = queueManager.getStats();
    if (stats.total === 0) return; // Nothing to sync

    try {
      await syncCoordinator.syncData('profiles', [], 'update');
      attemptCountRef.current = 0; // Reset retry count on success
    } catch (error) {
      console.warn('Background sync failed:', error);
      
      attemptCountRef.current++;
      if (attemptCountRef.current < retryAttempts) {
        // Exponential backoff retry
        const delay = retryDelay * Math.pow(2, attemptCountRef.current - 1);
        retryTimeoutRef.current = setTimeout(() => {
          executeSync();
        }, delay);
      }
    }
  }, [networkQuality.isOnline, isOfflineReady, queueManager, syncCoordinator, retryAttempts, retryDelay]);

  // Start background sync
  const startBackgroundSync = useCallback(async () => {
    if (syncIntervalRef.current) return; // Already running

    const adaptiveInterval = await getAdaptiveInterval();
    
    syncIntervalRef.current = setInterval(async () => {
      await executeSync();
      
      // Adjust interval dynamically
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        const newInterval = await getAdaptiveInterval();
        syncIntervalRef.current = setInterval(executeSync, newInterval);
      }
    }, adaptiveInterval);
  }, [getAdaptiveInterval, executeSync]);

  // Stop background sync
  const stopBackgroundSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    attemptCountRef.current = 0;
  }, []);

  // Handle visibility change (pause when app is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopBackgroundSync();
      } else if (networkQuality.isOnline && isOfflineReady) {
        startBackgroundSync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [networkQuality.isOnline, isOfflineReady, startBackgroundSync, stopBackgroundSync]);

  // Start/stop sync based on conditions
  useEffect(() => {
    if (networkQuality.isOnline && isOfflineReady) {
      startBackgroundSync();
    } else {
      stopBackgroundSync();
    }

    return () => stopBackgroundSync();
  }, [networkQuality.isOnline, isOfflineReady, startBackgroundSync, stopBackgroundSync]);

  // Force immediate sync
  const forceSync = useCallback(async () => {
    stopBackgroundSync();
    await executeSync();
    if (networkQuality.isOnline && isOfflineReady) {
      startBackgroundSync();
    }
  }, [executeSync, networkQuality.isOnline, isOfflineReady, startBackgroundSync, stopBackgroundSync]);

  return {
    isRunning: !!syncIntervalRef.current,
    forceSync,
    startBackgroundSync,
    stopBackgroundSync,
    retryCount: attemptCountRef.current
  };
};