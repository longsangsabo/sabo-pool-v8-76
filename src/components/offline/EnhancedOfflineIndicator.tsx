
import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOffline } from '@/contexts/OfflineContext';

interface EnhancedOfflineIndicatorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showDetails?: boolean;
}

export const EnhancedOfflineIndicator: React.FC<EnhancedOfflineIndicatorProps> = ({
  position = 'top-right',
  showDetails = false
}) => {
  const { isOnline } = useNetworkStatus();
  
  // Safely handle offline context - it might not be available
  let queueManager = null;
  try {
    const offlineContext = useOffline();
    queueManager = offlineContext?.queueManager;
  } catch (error) {
    // OfflineProvider not available, use fallback
    console.log('OfflineProvider not available, using basic network indicator');
  }
  
  const stats = queueManager?.getStats() || { total: 0, pending: 0 };

  if (isOnline && stats.total === 0) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 px-3 py-2 rounded-lg text-sm font-medium ${
      isOnline
        ? 'bg-green-100 text-green-800 border border-green-200'
        : 'bg-red-100 text-red-800 border border-red-200'
    }`}>
      <div className="flex items-center gap-2">
        {isOnline ? (
          stats.pending > 0 ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wifi className="h-4 w-4" />
          )
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        <span>
          {isOnline
            ? stats.pending > 0
              ? `Đang đồng bộ (${stats.pending})`
              : 'Đã kết nối'
            : 'Không có internet'}
        </span>
        {showDetails && stats.total > 0 && (
          <span className="ml-2 text-xs opacity-75">
            {stats.total} mục trong hàng đợi
          </span>
        )}
      </div>
    </div>
  );
};
