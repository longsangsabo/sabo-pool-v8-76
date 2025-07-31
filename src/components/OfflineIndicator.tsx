import { Wifi, WifiOff } from 'lucide-react';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

const OfflineIndicator = () => {
  const { isOnline, queueSize } = useOfflineQueue();

  if (isOnline && queueSize === 0) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-3 py-2 rounded-lg text-sm font-medium ${
        isOnline
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}
    >
      <div className='flex items-center gap-2'>
        {isOnline ? (
          <Wifi className='h-4 w-4' />
        ) : (
          <WifiOff className='h-4 w-4' />
        )}
        <span>
          {isOnline
            ? queueSize > 0
              ? `Đang đồng bộ (${queueSize})`
              : 'Đã kết nối'
            : 'Không có internet'}
        </span>
      </div>
    </div>
  );
};

export default OfflineIndicator;
