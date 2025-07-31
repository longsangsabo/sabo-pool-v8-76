import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSyncCoordinator } from '@/hooks/useSyncCoordinator';
import { useEnhancedOfflineQueue } from '@/hooks/useEnhancedOfflineQueue';
import { useServiceWorker } from '@/hooks/useServiceWorker';

interface OfflineContextType {
  isOfflineReady: boolean;
  syncCoordinator: ReturnType<typeof useSyncCoordinator>;
  queueManager: ReturnType<typeof useEnhancedOfflineQueue>;
  serviceWorker: ReturnType<typeof useServiceWorker>;
  enableOfflineMode: () => void;
  disableOfflineMode: () => void;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

interface OfflineProviderProps {
  children: React.ReactNode;
  autoEnable?: boolean;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ 
  children, 
  autoEnable = true 
}) => {
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const syncCoordinator = useSyncCoordinator();
  const queueManager = useEnhancedOfflineQueue();
  const serviceWorker = useServiceWorker();

  // Initialize offline capabilities
  useEffect(() => {
    if (autoEnable && serviceWorker.isSupported) {
      enableOfflineMode();
    }
  }, [autoEnable, serviceWorker.isSupported]);

  // Monitor service worker registration
  useEffect(() => {
    if (serviceWorker.isRegistered) {
      setIsOfflineReady(true);
      console.log('Offline mode is ready');
    }
  }, [serviceWorker.isRegistered]);

  const enableOfflineMode = async () => {
    try {
      if (!serviceWorker.isRegistered) {
        await serviceWorker.registerServiceWorker();
      }
      setIsOfflineReady(true);
      console.log('Offline mode enabled');
    } catch (error) {
      console.error('Failed to enable offline mode:', error);
    }
  };

  const disableOfflineMode = () => {
    setIsOfflineReady(false);
    // Note: We don't unregister the service worker as it might be needed later
    console.log('Offline mode disabled');
  };

  const value: OfflineContextType = {
    isOfflineReady,
    syncCoordinator,
    queueManager,
    serviceWorker,
    enableOfflineMode,
    disableOfflineMode,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

// Higher-order component for offline-enabled components
export const withOffline = <P extends object>(
  Component: React.ComponentType<P & { offline: OfflineContextType }>
) => {
  const WrappedComponent = React.forwardRef<any, Omit<P, 'offline'>>((props, ref) => {
    const offline = useOffline();
    return <Component {...props as any} ref={ref} offline={offline} />;
  });
  
  WrappedComponent.displayName = `withOffline(${Component.displayName || Component.name})`;
  return WrappedComponent;
};