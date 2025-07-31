import { useEffect } from 'react';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { useOffline } from '@/contexts/OfflineContext';

export const BackgroundSyncManager = () => {
  const { isOfflineReady } = useOffline();
  const backgroundSync = useBackgroundSync();

  useEffect(() => {
    if (isOfflineReady) {
      backgroundSync.startBackgroundSync();
    }

    return () => {
      backgroundSync.stopBackgroundSync();
    };
  }, [isOfflineReady, backgroundSync]);

  // This component doesn't render anything, it just manages background sync
  return null;
};