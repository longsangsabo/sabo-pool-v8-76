/**
 * Utility functions for consistent rank handling across the application
 */

export interface RankData {
  verified_rank?: string | null;
  current_rank?: string | null;
  rank?: string | null;
}

/**
 * Get normalized rank from various rank sources with fallback
 */
export const getNormalizedRank = (data: RankData): string => {
  // Priority order: verified_rank > current_rank > rank > default
  return data?.verified_rank || data?.current_rank || data?.rank || 'K';
};

/**
 * Check if rank is valid/set (not default K)
 */
export function hasValidRank(data: RankData): boolean {
  const rank = getNormalizedRank(data);
  return rank !== 'K' && rank !== null && rank !== undefined;
}

/**
 * Get rank display with verification status
 */
export function getRankDisplay(data: RankData & { club_verified?: boolean }): {
  rank: string;
  isVerified: boolean;
  displayText: string;
} {
  const rank = getNormalizedRank(data);
  const isVerified = data.club_verified === true && hasValidRank(data);

  return {
    rank,
    isVerified,
    displayText: isVerified ? `${rank} ✓` : rank,
  };
}

/**
 * Rank order for comparison (higher number = higher rank)
 */
export function getRankOrder(rank: string): number {
  const rankMap: Record<string, number> = {
    K: 1,
    'K+': 2,
    I: 3,
    'I+': 4,
    H: 5,
    'H+': 6,
    G: 7,
    'G+': 8,
    F: 9,
    'F+': 10,
    E: 11,
    'E+': 12,
    D: 13,
    'D+': 14,
    C: 15,
    'C+': 16,
    B: 17,
    'B+': 18,
    A: 19,
    'A+': 20,
  };

  return rankMap[rank] || 0;
}

/**
 * Compare two ranks (returns positive if rank1 > rank2)
 */
export function compareRanks(rank1: string, rank2: string): number {
  return getRankOrder(rank1) - getRankOrder(rank2);
}

/**
 * Safe rank extraction from profile data
 */
export const extractRankFromProfile = (profile: any): string => {
  if (!profile) return 'K';

  return getNormalizedRank({
    verified_rank: profile.verified_rank,
    current_rank: profile.current_rank,
    rank: profile.rank,
  });
};

/**
 * Log rank data for debugging
 */
export const debugRankData = (context: string, data: any): void => {
  console.log(`[RankDebug] ${context}:`, {
    verified_rank: data?.verified_rank,
    current_rank: data?.current_rank,
    rank: data?.rank,
    normalized: getNormalizedRank(data || {}),
    club_verified: data?.club_verified,
  });
};
