import React, { useState, useEffect } from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface OfflineIndicatorProps {
  onRetry?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  onRetry,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Simulate retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      onRetry?.();
    } finally {
      setIsRetrying(false);
    }
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className='fixed top-0 left-0 right-0 z-50'>
      <div
        className={`p-3 text-center text-sm font-medium ${
          isOnline
            ? 'bg-green-100 text-green-800 border-b border-green-200'
            : 'bg-red-100 text-red-800 border-b border-red-200'
        }`}
      >
        <div className='flex items-center justify-center gap-2'>
          {isOnline ? (
            <>
              <CheckCircle className='h-4 w-4' />
              <span>Đã kết nối lại internet</span>
            </>
          ) : (
            <>
              <WifiOff className='h-4 w-4' />
              <span>Không có kết nối internet</span>
              <Button
                variant='outline'
                size='sm'
                onClick={handleRetry}
                disabled={isRetrying}
                className='ml-2 h-6 px-2 text-xs'
              >
                {isRetrying ? (
                  <RefreshCw className='h-3 w-3 animate-spin' />
                ) : (
                  <RefreshCw className='h-3 w-3' />
                )}
                Thử lại
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
