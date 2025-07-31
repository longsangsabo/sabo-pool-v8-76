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
  
  // Simple fallback implementations to prevent crashes
  const syncCoordinator = {
    syncData: async () => {},
    isSyncing: false,
    lastSyncTime: null,
    getPendingConflicts: () => [],
    resolveConflict: async () => {},
    isSyncInProgress: false
  };
  
  const queueManager = {
    addToQueue: () => {},
    getStats: () => ({ total: 0, pending: 0, failed: 0, processing: 0, byPriority: { critical: 0, normal: 0, low: 0 } }),
    processQueue: async () => {},
    clearQueue: () => {},
    queue: [],
    queueSize: 0,
    isOnline: navigator.onLine,
    progress: { total: 0, processed: 0 },
    failed: [],
    processing: [],
    retryOperation: () => {}
  };
  
  const serviceWorker = {
    isSupported: false,
    isRegistered: false,
    isInstalling: false,
    updateAvailable: false,
    registration: null,
    registerServiceWorker: async () => {},
    updateServiceWorker: async () => {},
    sendMessage: () => {},
    cacheApiResponse: () => {},
    clearCache: () => {},
    getCacheSize: async () => 0
  };

  const enableOfflineMode = async () => {
    setIsOfflineReady(true);
    console.log('Offline mode enabled (simplified)');
  };

  const disableOfflineMode = () => {
    setIsOfflineReady(false);
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