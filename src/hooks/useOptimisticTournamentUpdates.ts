import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface OptimisticMatchUpdate {
  matchId: string;
  winnerId: string;
  score1: number;
  score2: number;
  predictedAdvancement?: {
    nextRoundMatch?: string;
    position?: 'player1' | 'player2';
  };
}

export const useOptimisticTournamentUpdates = () => {
  const [optimisticUpdates, setOptimisticUpdates] = useState<
    Map<string, OptimisticMatchUpdate>
  >(new Map());
  const [pendingAdvancements, setPendingAdvancements] = useState<Set<string>>(
    new Set()
  );

  const applyOptimisticMatchUpdate = useCallback(
    (update: OptimisticMatchUpdate) => {
      setOptimisticUpdates(prev => {
        const newMap = new Map(prev);
        newMap.set(update.matchId, update);
        return newMap;
      });

      // Show instant feedback
      toast.success('🎯 Kết quả đã ghi nhận, đang xử lý...');

      // Mark as pending advancement
      setPendingAdvancements(prev => new Set(prev).add(update.matchId));

      // Auto-clear after timeout (fallback)
      setTimeout(() => {
        setOptimisticUpdates(prev => {
          const newMap = new Map(prev);
          newMap.delete(update.matchId);
          return newMap;
        });
        setPendingAdvancements(prev => {
          const newSet = new Set(prev);
          newSet.delete(update.matchId);
          return newSet;
        });
      }, 10000);
    },
    []
  );

  const confirmOptimisticUpdate = useCallback((matchId: string) => {
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(matchId);
      return newMap;
    });
    setPendingAdvancements(prev => {
      const newSet = new Set(prev);
      newSet.delete(matchId);
      return newSet;
    });

    toast.success('✅ Đã tiến vòng thành công!');
  }, []);

  const getOptimisticMatch = useCallback(
    (matchId: string) => {
      return optimisticUpdates.get(matchId);
    },
    [optimisticUpdates]
  );

  const isPendingAdvancement = useCallback(
    (matchId: string) => {
      return pendingAdvancements.has(matchId);
    },
    [pendingAdvancements]
  );

  const clearOptimisticUpdates = useCallback(() => {
    setOptimisticUpdates(new Map());
    setPendingAdvancements(new Set());
  }, []);

  return {
    applyOptimisticMatchUpdate,
    confirmOptimisticUpdate,
    getOptimisticMatch,
    isPendingAdvancement,
    clearOptimisticUpdates,
    optimisticUpdates: Array.from(optimisticUpdates.values()),
    pendingCount: pendingAdvancements.size,
  };
};
