
import { useState, useCallback } from 'react';

interface QueueItem {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  retryCount: number;
}

interface QueueStats {
  total: number;
  pending: number;
  failed: number;
  processing: number;
  byPriority: {
    critical: number;
    normal: number;
    low: number;
  };
}

interface EnhancedOfflineQueue {
  addToQueue: (type: string, data: any) => void;
  getStats: () => QueueStats;
  processQueue: () => Promise<void>;
  clearQueue: () => void;
  queue: QueueItem[];
  queueSize: number;
  isOnline: boolean;
  progress: { total: number; processed: number; };
  failed: string[];
  processing: string[];
  retryOperation: (id: string) => void;
}

export const useEnhancedOfflineQueue = (): EnhancedOfflineQueue => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [processing, setProcessing] = useState<string[]>([]);
  const [failed, setFailed] = useState<string[]>([]);

  const addToQueue = useCallback((type: string, data: any) => {
    const item: QueueItem = {
      id: Date.now().toString(),
      type,
      data,
      timestamp: new Date(),
      retryCount: 0
    };
    
    setQueue(prev => [...prev, item]);
  }, []);

  const getStats = useCallback((): QueueStats => {
    return {
      total: queue.length,
      pending: queue.filter(item => item.retryCount < 3).length,
      failed: queue.filter(item => item.retryCount >= 3).length,
      processing: processing.length,
      byPriority: {
        critical: 0,
        normal: queue.length,
        low: 0
      }
    };
  }, [queue, processing]);

  const processQueue = useCallback(async () => {
    if (queue.length === 0) return;

    const pendingItems = queue.filter(item => item.retryCount < 3);
    
    for (const item of pendingItems) {
      try {
        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Remove processed item
        setQueue(prev => prev.filter(q => q.id !== item.id));
      } catch (error) {
        // Increment retry count
        setQueue(prev => prev.map(q => 
          q.id === item.id 
            ? { ...q, retryCount: q.retryCount + 1 }
            : q
        ));
      }
    }
  }, [queue]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setProcessing([]);
    setFailed([]);
  }, []);

  const retryOperation = useCallback((id: string) => {
    setFailed(prev => prev.filter(f => f !== id));
    // Add logic to retry the operation
  }, []);

  return {
    addToQueue,
    getStats,
    processQueue,
    clearQueue,
    queue,
    queueSize: queue.length,
    isOnline: navigator.onLine,
    progress: { total: queue.length, processed: 0 },
    failed,
    processing,
    retryOperation
  };
};
