
import { Tournament } from '@/types/tournament';

export interface PrizeDistribution {
  [key: string]: number;
}

/**
 * Get prize amount for a specific position
 * Handles both formats: {"1": amount, "2": amount} and {"first_place": amount, "second_place": amount}
 */
export const getPrizeForPosition = (distribution: PrizeDistribution | null, position: number): number => {
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
    4: 'fourth_place'
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

  // Fall back to calculating from distribution
  if (!tournament.prize_distribution) return 0;

  const distribution = tournament.prize_distribution as PrizeDistribution;
  let total = 0;

  // Handle numeric format (test1)
  if (distribution['1'] !== undefined) {
    for (let i = 1; i <= 10; i++) {
      const prize = distribution[i.toString()];
      if (prize !== undefined && prize > 0) {
        total += Number(prize);
      }
    }
    // Add default prize if exists
    if (distribution['default']) {
      const remainingPlayers = Math.max(0, (tournament.max_participants || 16) - 10);
      total += Number(distribution['default']) * remainingPlayers;
    }
  } else {
    // Handle text format
    Object.values(distribution).forEach(value => {
      if (typeof value === 'number' && value > 0) {
        total += value;
      }
    });
  }

  return total;
};

/**
 * Format prize distribution for display
 */
export const formatPrizeDistribution = (tournament: Tournament): Array<{position: string, amount: number}> => {
  if (!tournament.prize_distribution) return [];

  const distribution = tournament.prize_distribution as PrizeDistribution;
  const prizes: Array<{position: string, amount: number}> = [];

  // Handle numeric format (test1)
  if (distribution['1'] !== undefined) {
    for (let i = 1; i <= 10; i++) {
      const prize = distribution[i.toString()];
      if (prize !== undefined && prize > 0) {
        const positionText = i === 1 ? 'Vô địch' : 
                           i === 2 ? 'Á quân' : 
                           i === 3 ? 'Hạng 3' : 
                           `Hạng ${i}`;
        prizes.push({
          position: positionText,
          amount: Number(prize)
        });
      }
    }
    
    // Add default/participation prize
    if (distribution['default'] && Number(distribution['default']) > 0) {
      prizes.push({
        position: 'Tham gia',
        amount: Number(distribution['default'])
      });
    }
  } else {
    // Handle text format
    const textMapping: { [key: string]: string } = {
      'first_place': 'Vô địch',
      'second_place': 'Á quân', 
      'third_place': 'Hạng 3',
      'fourth_place': 'Hạng 4',
      'participation': 'Tham gia'
    };

    Object.entries(distribution).forEach(([key, value]) => {
      if (typeof value === 'number' && value > 0 && textMapping[key]) {
        prizes.push({
          position: textMapping[key],
          amount: value
        });
      }
    });
  }

  return prizes.sort((a, b) => b.amount - a.amount);
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
