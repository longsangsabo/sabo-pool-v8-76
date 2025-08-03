import { useQuery, useQueryClient } from '@tanstack/react-query';
import { rankService } from '@/services/rankService';
import type {
  DatabaseRankDefinition,
  TournamentReward,
  SpaReward,
} from '@/services/rankService';

/**
 * Hook to get all rank definitions
 */
export const useRanks = () => {
  return useQuery({
    queryKey: ['ranks'],
    queryFn: () => rankService.getAllRanks(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get a specific rank by code
 */
export const useRank = (rankCode: string) => {
  return useQuery({
    queryKey: ['rank', rankCode],
    queryFn: () => rankService.getRankByCode(rankCode),
    enabled: !!rankCode,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to get rank info in legacy format
 */
export const useRankInfo = (rankCode: string) => {
  return useQuery({
    queryKey: ['rank-info', rankCode],
    queryFn: () => rankService.getRankInfo(rankCode),
    enabled: !!rankCode,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to get all rank codes in order
 */
export const useRankCodes = () => {
  return useQuery({
    queryKey: ['rank-codes'],
    queryFn: () => rankService.getRankCodes(),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to get ranks grouped by skill level
 */
export const useRanksByGroup = () => {
  return useQuery({
    queryKey: ['ranks-by-group'],
    queryFn: () => rankService.getRanksByGroup('all'),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to get tournament rewards for a rank
 */
export const useTournamentRewards = (
  rankCode: string,
  tournamentType: string = 'regular'
) => {
  return useQuery({
    queryKey: ['tournament-rewards', rankCode, tournamentType],
    queryFn: () => rankService.getTournamentRewards(),
    enabled: !!rankCode,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to get SPA rewards for a milestone type
 */
export const useSpaRewards = (milestoneType: string) => {
  return useQuery({
    queryKey: ['spa-rewards', milestoneType],
    queryFn: () => rankService.getSpaRewards(),
    enabled: !!milestoneType,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to get rank by ELO rating
 */
export const useRankByElo = (elo: number) => {
  return useQuery({
    queryKey: ['rank-by-elo', elo],
    queryFn: () => rankService.getRankByElo(elo),
    enabled: elo > 0,
    staleTime: 1 * 60 * 1000, // 1 minute for more dynamic data
  });
};

/**
 * Hook to get next/previous ranks
 */
export const useRankProgression = (currentRank: string) => {
  return useQuery({
    queryKey: ['rank-progression', currentRank],
    queryFn: async () => {
      const [nextRank, previousRank] = await Promise.all([
        rankService.getNextRank(currentRank),
        rankService.getPreviousRank(currentRank),
      ]);
      return { nextRank, previousRank };
    },
    enabled: !!currentRank,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to invalidate rank cache
 */
export const useInvalidateRanks = () => {
  const queryClient = useQueryClient();

  return () => {
    rankService.clearCache();
    queryClient.invalidateQueries({ queryKey: ['ranks'] });
    queryClient.invalidateQueries({ queryKey: ['rank'] });
    queryClient.invalidateQueries({ queryKey: ['rank-info'] });
    queryClient.invalidateQueries({ queryKey: ['rank-codes'] });
    queryClient.invalidateQueries({ queryKey: ['ranks-by-group'] });
    queryClient.invalidateQueries({ queryKey: ['tournament-rewards'] });
    queryClient.invalidateQueries({ queryKey: ['spa-rewards'] });
    queryClient.invalidateQueries({ queryKey: ['rank-by-elo'] });
    queryClient.invalidateQueries({ queryKey: ['rank-progression'] });
  };
};
