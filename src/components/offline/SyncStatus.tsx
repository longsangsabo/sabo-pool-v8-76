import React from 'react';
import { CheckCircle, AlertCircle, Clock, RefreshCw, Wifi } from 'lucide-react';
import { useEnhancedOfflineQueue } from '@/hooks/useEnhancedOfflineQueue';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface SyncStatusProps {
  showProgress?: boolean;
  showRetryButton?: boolean;
  compact?: boolean;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
  showProgress = true,
  showRetryButton = true,
  compact = false
}) => {
  const queueManager = useEnhancedOfflineQueue();
  const { isOnline } = useNetworkStatus();

  const getSyncStatus = () => {
    if (!isOnline) {
      return {
        type: 'offline',
        icon: <Wifi className="h-4 w-4" />,
        message: 'Offline - Dữ liệu sẽ được đồng bộ khi có kết nối',
        variant: 'destructive' as const
      };
    }

    if (queueManager.processing.length > 0) {
      return {
        type: 'syncing',
        icon: <RefreshCw className="h-4 w-4 animate-spin" />,
        message: `Đang đồng bộ ${queueManager.processing.length} mục...`,
        variant: 'default' as const
      };
    }

    if (queueManager.failed.length > 0) {
      return {
        type: 'error',
        icon: <AlertCircle className="h-4 w-4" />,
        message: `${queueManager.failed.length} mục đồng bộ thất bại`,
        variant: 'destructive' as const
      };
    }

    if (queueManager.queueSize > 0) {
      return {
        type: 'pending',
        icon: <Clock className="h-4 w-4" />,
        message: `${queueManager.queueSize} mục chờ đồng bộ`,
        variant: 'default' as const
      };
    }

    return {
      type: 'synced',
      icon: <CheckCircle className="h-4 w-4" />,
      message: 'Tất cả dữ liệu đã được đồng bộ',
      variant: 'default' as const
    };
  };

  const status = getSyncStatus();

  // Don't show when everything is synced and compact mode
  if (status.type === 'synced' && compact) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Alert variant={status.variant}>
        <div className="flex items-center gap-2">
          {status.icon}
          <AlertDescription className="flex-1">
            {status.message}
          </AlertDescription>
          
          {/* Retry button for failed operations */}
          {showRetryButton && queueManager.failed.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => queueManager.failed.forEach(id => queueManager.retryOperation(id))}
            >
              Thử lại
            </Button>
          )}

          {/* Manual sync button */}
          {showRetryButton && isOnline && queueManager.queueSize > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={queueManager.processQueue}
              disabled={queueManager.processing.length > 0}
            >
              Đồng bộ ngay
            </Button>
          )}
        </div>
      </Alert>

      {/* Progress bar */}
      {showProgress && queueManager.progress.total > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Tiến độ đồng bộ</span>
            <span>{queueManager.progress.processed}/{queueManager.progress.total}</span>
          </div>
          <Progress 
            value={(queueManager.progress.processed / queueManager.progress.total) * 100}
            className="h-2"
          />
        </div>
      )}
    </div>
  );
};