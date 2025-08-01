import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalling: boolean;
  updateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

export const useServiceWorker = () => {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isInstalling: false,
    updateAvailable: false,
    registration: null,
  });

  // Register service worker
  const registerServiceWorker = async () => {
    if (!state.isSupported) {
      console.log('Service Workers are not supported');
      return;
    }

    try {
      setState(prev => ({ ...prev, isInstalling: true }));

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none', // Always check for updates
      });

      console.log('Service Worker registered:', registration);

      setState(prev => ({
        ...prev,
        isRegistered: true,
        isInstalling: false,
        registration,
      }));

      // Check for updates
      registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');
        setState(prev => ({ ...prev, updateAvailable: true }));
      });

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', event => {
        console.log('Message from SW:', event.data);
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      setState(prev => ({ ...prev, isInstalling: false }));
    }
  };

  // Update service worker
  const updateServiceWorker = async () => {
    if (state.registration) {
      const newWorker =
        state.registration.installing || state.registration.waiting;

      if (newWorker) {
        newWorker.postMessage({ type: 'SKIP_WAITING' });

        // Wait for the new service worker to take control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      }
    }
  };

  // Send message to service worker
  const sendMessage = (message: any) => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  };

  // Cache API response
  const cacheApiResponse = (request: Request, response: Response) => {
    sendMessage({
      type: 'CACHE_API_RESPONSE',
      data: { request, response },
    });
  };

  // Clear cache
  const clearCache = () => {
    sendMessage({ type: 'CLEAR_CACHE' });
  };

  // Get cache size
  const getCacheSize = (): Promise<number> => {
    return new Promise(resolve => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = event => {
        resolve(event.data.size);
      };

      sendMessage({
        type: 'GET_CACHE_SIZE',
        port: messageChannel.port2,
      });
    });
  };

  // Auto-register on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      // Trigger background sync when online
      if (state.registration && 'sync' in state.registration) {
        (state.registration as any).sync.register('offline-sync');
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [state.registration]);

  return {
    ...state,
    registerServiceWorker,
    updateServiceWorker,
    sendMessage,
    cacheApiResponse,
    clearCache,
    getCacheSize,
  };
};
