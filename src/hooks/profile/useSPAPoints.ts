// Hook for SPA Points management
// File: /src/hooks/profile/useSPAPoints.ts

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { profileAPI, type SPAPointsTransaction } from '@/services/api/profileAPI';

export const useSPAPointsHistory = (
  userId?: string,
  transactionType?: string,
  limit = 20
) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['spa-points-history', targetUserId, transactionType, limit],
    queryFn: async ({ pageParam = 0 }) => {
      if (!targetUserId) {
        throw new Error('No user ID provided');
      }

      const transactions = await profileAPI.getSPAPointsHistory(
        targetUserId,
        limit,
        pageParam * limit,
        transactionType
      );

      return {
        transactions,
        nextPage: transactions.length === limit ? pageParam + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!targetUserId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Flatten all pages into a single array
  const transactions = data?.pages.flatMap(page => page.transactions) || [];

  return {
    transactions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  };
};

// Simple hook for recent SPA points transactions
export const useRecentSPAPointsTransactions = (userId?: string, limit = 10) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const {
    data: transactions,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['recent-spa-points', targetUserId, limit],
    queryFn: async (): Promise<SPAPointsTransaction[]> => {
      if (!targetUserId) {
        return [];
      }

      return await profileAPI.getSPAPointsHistory(targetUserId, limit);
    },
    enabled: !!targetUserId,
    staleTime: 30 * 1000, // 30 seconds for SPA points (might change frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    transactions: transactions || [],
    isLoading,
    error,
    refetch
  };
};

// Hook for SPA points summary and analytics
export const useSPAPointsSummary = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  const { transactions, isLoading } = useRecentSPAPointsTransactions(targetUserId, 50);

  // Calculate summary statistics
  const summary = {
    total_earned: transactions
      .filter(t => t.points_change > 0)
      .reduce((sum, t) => sum + t.points_change, 0),
    total_spent: Math.abs(transactions
      .filter(t => t.points_change < 0)
      .reduce((sum, t) => sum + t.points_change, 0)),
    net_points: transactions.reduce((sum, t) => sum + t.points_change, 0),
    current_balance: transactions.length > 0 ? transactions[0].current_balance : 0,
    transactions_count: transactions.length,
    
    // Breakdown by transaction type
    breakdown: {
      match_wins: transactions
        .filter(t => t.transaction_type === 'match_win')
        .reduce((sum, t) => sum + t.points_change, 0),
      achievement_rewards: transactions
        .filter(t => t.transaction_type === 'achievement_unlock')
        .reduce((sum, t) => sum + t.points_change, 0),
      tournament_rewards: transactions
        .filter(t => t.transaction_type === 'tournament_reward')
        .reduce((sum, t) => sum + t.points_change, 0),
      daily_bonuses: transactions
        .filter(t => t.transaction_type === 'daily_bonus')
        .reduce((sum, t) => sum + t.points_change, 0),
      purchases: Math.abs(transactions
        .filter(t => t.transaction_type === 'purchase')
        .reduce((sum, t) => sum + t.points_change, 0)),
    },

    // Recent activity (last 7 days)
    recent_activity: {
      last_7_days: transactions
        .filter(t => {
          const transactionDate = new Date(t.created_at);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return transactionDate >= sevenDaysAgo;
        }),
      last_30_days: transactions
        .filter(t => {
          const transactionDate = new Date(t.created_at);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return transactionDate >= thirtyDaysAgo;
        })
    }
  };

  return {
    summary,
    isLoading,
    transactions
  };
};
