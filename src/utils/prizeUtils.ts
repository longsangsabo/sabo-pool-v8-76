import { Tournament } from '@/types/tournament';

export interface PrizeDistribution {
  [key: string]: number;
}

/**
 * Get prize amount for a specific position
 * Handles both formats: {"1": amount, "2": amount} and {"first_place": amount, "second_place": amount}
 */
export const getPrizeForPosition = (
  distribution: PrizeDistribution | null,
  position: number
): number => {
  if (!distribution) return 0;

  // Try numeric position format first (test1 format)
  const numericKey = position.toString();
  if (distribution[numericKey] !== undefined) {
    return Number(distribution[numericKey]) || 0;
  }

  // Fall back to text format
  const textKeys: { [key: number]: string } = {
    1: 'first_place',
    2: 'second_place',
    3: 'third_place',
    4: 'fourth_place',
  };

  const textKey = textKeys[position];
  if (textKey && distribution[textKey] !== undefined) {
    return Number(distribution[textKey]) || 0;
  }

  // Check for participation/default prize
  if (distribution['participation'] !== undefined) {
    return Number(distribution['participation']) || 0;
  }

  if (distribution['default'] !== undefined) {
    return Number(distribution['default']) || 0;
  }

  return 0;
};

/**
 * Calculate total prize pool from distribution
 */
export const calculateTotalPrizePool = (tournament: Tournament): number => {
  // First try direct prize_pool value
  if (tournament.prize_pool && tournament.prize_pool > 0) {
    return Number(tournament.prize_pool);
  }

  // Note: prize_distribution removed - using tournament_prize_tiers table
  return 0;
};

/**
 * Format prize distribution for display
 */
export const formatPrizeDistribution = (
  tournament: Tournament
): Array<{ position: string; amount: number }> => {
  // Note: prize_distribution removed - using tournament_prize_tiers table
  return [];
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M VND`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K VND`;
  }
  return `${amount.toLocaleString()} VND`;
};
