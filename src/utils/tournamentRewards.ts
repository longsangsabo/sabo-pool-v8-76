import { TournamentRewards } from '@/types/tournament-extended';
import { RankCode } from '@/utils/eloConstants';

export interface TournamentRewardsCalculation {
  totalPrize: number;
  showPrizes: boolean;
  positions: Array<{
    position: number;
    name: string;
    eloPoints: number;
    spaPoints: number;
    cashPrize: number;
    items: string[];
    isVisible: boolean;
  }>;
  specialAwards: Array<{
    id: string;
    name: string;
    description?: string;
    cashPrize: number;
    criteria?: string;
  }>;
}

// NEW: Function to calculate rewards from database prize tiers
export const calculateRewardsFromTiers = async (
  tournament: any,
  prizeTiers?: any[]
): Promise<TournamentRewardsCalculation> => {
  console.log('🔍 calculateRewardsFromTiers input:', {
    tournament_id: tournament?.id,
    prize_pool: tournament?.prize_pool,
    prizeTiers: prizeTiers?.length,
  });

  // Get total prize from tournament or calculate
  let totalPrize = 0;
  if (tournament.prize_pool && tournament.prize_pool > 0) {
    totalPrize = tournament.prize_pool;
  } else if (tournament.entry_fee && tournament.max_participants) {
    totalPrize = tournament.entry_fee * tournament.max_participants * 0.75;
  }

  // If we have prize tiers from database, use them
  if (prizeTiers && prizeTiers.length > 0) {
    const positions = prizeTiers.map(tier => ({
      position: tier.position,
      name: tier.position_name,
      eloPoints: tier.elo_points,
      spaPoints: tier.spa_points,
      cashPrize: tier.cash_amount,
      items: tier.physical_items || [],
      isVisible: tier.is_visible,
    }));

    return {
      totalPrize,
      showPrizes: totalPrize > 0,
      positions,
      specialAwards: [],
    };
  }

  // Fallback to old calculation if no prize tiers
  return calculateRewards(tournament);
};

export const calculateRewards = (
  tournament: any,
  playerRank: RankCode = 'K'
): TournamentRewardsCalculation => {
  console.log('🔍 calculateRewards (fallback) input:', {
    tournament_id: tournament?.id,
    prize_pool: tournament?.prize_pool,
    entry_fee: tournament?.entry_fee,
    max_participants: tournament?.max_participants,
    playerRank,
  });

  // ✅ CRITICAL: Prioritize user-set prize_pool - NEVER override it
  let totalPrize = 0;

  if (tournament.prize_pool && tournament.prize_pool > 0) {
    totalPrize = tournament.prize_pool;
    console.log('✅ [calculateRewards] Using user-set prize_pool:', totalPrize);
  } else if (tournament.entry_fee && tournament.max_participants) {
    totalPrize = tournament.entry_fee * tournament.max_participants * 0.75; // ✅ FIXED: Use 75% as fallback calculation
    console.log(
      '✅ [calculateRewards] Calculated from entry_fee (75%):',
      totalPrize
    );
  }

  console.log('🎯 Final totalPrize used:', totalPrize);

  // Default ELO points based on position
  const eloPoints = {
    1: 100, // Champion
    2: 50, // Runner-up
    3: 25, // Third place
    4: 12, // Fourth place
    8: 6, // Top 8
    16: 3, // Top 16
    participation: 1,
  };

  // SPA points based on player rank and position
  const spaPointsMap: { [key in RankCode]: { [key: string]: number } } = {
    K: { 1: 900, 2: 700, 3: 500, 4: 350, 8: 120, participation: 100 },
    'K+': { 1: 950, 2: 750, 3: 550, 4: 375, 8: 135, participation: 100 },
    I: { 1: 1000, 2: 800, 3: 600, 4: 400, 8: 150, participation: 100 },
    'I+': { 1: 1050, 2: 825, 3: 625, 4: 425, 8: 165, participation: 100 },
    H: { 1: 1100, 2: 850, 3: 650, 4: 450, 8: 200, participation: 100 },
    'H+': { 1: 1150, 2: 875, 3: 675, 4: 475, 8: 220, participation: 100 },
    G: { 1: 1200, 2: 900, 3: 700, 4: 500, 8: 250, participation: 100 },
    'G+': { 1: 1275, 2: 950, 3: 750, 4: 525, 8: 265, participation: 100 },
    F: { 1: 1350, 2: 1000, 3: 800, 4: 550, 8: 280, participation: 110 },
    'F+': { 1: 1425, 2: 1050, 3: 850, 4: 575, 8: 295, participation: 110 },
    E: { 1: 1500, 2: 1100, 3: 900, 4: 650, 8: 320, participation: 120 },
    'E+': { 1: 1600, 2: 1200, 3: 1000, 4: 700, 8: 350, participation: 130 },
  };

  const playerSpaPoints = spaPointsMap[playerRank] || spaPointsMap['K'];

  // Calculate cash prizes for all 16 positions based on percentage distribution
  const prizeDistribution16 = {
    1: Math.floor(totalPrize * 0.4), // 40% for 1st place
    2: Math.floor(totalPrize * 0.24), // 24% for 2nd place
    3: Math.floor(totalPrize * 0.16), // 16% for 3rd place
    4: Math.floor(totalPrize * 0.08), // 8% for 4th place
    5: Math.floor(totalPrize * 0.04), // 4% for 5th-6th place
    6: Math.floor(totalPrize * 0.04), // 4% for 5th-6th place
    7: Math.floor(totalPrize * 0.02), // 2% for 7th-8th place
    8: Math.floor(totalPrize * 0.02), // 2% for 7th-8th place
    9: Math.floor(totalPrize * 0.01125), // 1.125% for 9th-12th place
    10: Math.floor(totalPrize * 0.01125), // 1.125% for 9th-12th place
    11: Math.floor(totalPrize * 0.01125), // 1.125% for 9th-12th place
    12: Math.floor(totalPrize * 0.01125), // 1.125% for 9th-12th place
    13: Math.floor(totalPrize * 0.005625), // 0.5625% for 13th-16th place
    14: Math.floor(totalPrize * 0.005625), // 0.5625% for 13th-16th place
    15: Math.floor(totalPrize * 0.005625), // 0.5625% for 13th-16th place
    16: Math.floor(totalPrize * 0.005625), // 0.5625% for 13th-16th place
  };

  const positions = [
    {
      position: 1,
      name: 'Vô địch',
      eloPoints: 100,
      spaPoints: playerSpaPoints[1],
      cashPrize: prizeDistribution16[1],
      items: ['Cúp vô địch'],
      isVisible: true,
    },
    {
      position: 2,
      name: 'Á quân',
      eloPoints: 75,
      spaPoints: playerSpaPoints[2],
      cashPrize: prizeDistribution16[2],
      items: ['Huy chương bạc'],
      isVisible: true,
    },
    {
      position: 3,
      name: 'Hạng 3',
      eloPoints: 50,
      spaPoints: playerSpaPoints[3],
      cashPrize: prizeDistribution16[3],
      items: ['Huy chương đồng'],
      isVisible: true,
    },
    {
      position: 4,
      name: 'Hạng 4',
      eloPoints: 40,
      spaPoints: playerSpaPoints[4],
      cashPrize: prizeDistribution16[4],
      items: [],
      isVisible: true,
    },
    {
      position: 5,
      name: 'Hạng 5-6',
      eloPoints: 30,
      spaPoints: playerSpaPoints[4],
      cashPrize: prizeDistribution16[5],
      items: [],
      isVisible: true,
    },
    {
      position: 6,
      name: 'Hạng 5-6',
      eloPoints: 30,
      spaPoints: playerSpaPoints[4],
      cashPrize: prizeDistribution16[6],
      items: [],
      isVisible: true,
    },
    {
      position: 7,
      name: 'Hạng 7-8',
      eloPoints: 25,
      spaPoints: playerSpaPoints[8],
      cashPrize: prizeDistribution16[7],
      items: [],
      isVisible: true,
    },
    {
      position: 8,
      name: 'Hạng 7-8',
      eloPoints: 25,
      spaPoints: playerSpaPoints[8],
      cashPrize: prizeDistribution16[8],
      items: [],
      isVisible: true,
    },
    {
      position: 9,
      name: 'Hạng 9-12',
      eloPoints: 20,
      spaPoints: playerSpaPoints[8],
      cashPrize: prizeDistribution16[9],
      items: [],
      isVisible: true,
    },
    {
      position: 10,
      name: 'Hạng 9-12',
      eloPoints: 20,
      spaPoints: playerSpaPoints[8],
      cashPrize: prizeDistribution16[10],
      items: [],
      isVisible: true,
    },
    {
      position: 11,
      name: 'Hạng 9-12',
      eloPoints: 20,
      spaPoints: playerSpaPoints[8],
      cashPrize: prizeDistribution16[11],
      items: [],
      isVisible: true,
    },
    {
      position: 12,
      name: 'Hạng 9-12',
      eloPoints: 20,
      spaPoints: playerSpaPoints[8],
      cashPrize: prizeDistribution16[12],
      items: [],
      isVisible: true,
    },
    {
      position: 13,
      name: 'Hạng 13-16',
      eloPoints: 15,
      spaPoints: playerSpaPoints[16],
      cashPrize: prizeDistribution16[13],
      items: [],
      isVisible: true,
    },
    {
      position: 14,
      name: 'Hạng 13-16',
      eloPoints: 15,
      spaPoints: playerSpaPoints[16],
      cashPrize: prizeDistribution16[14],
      items: [],
      isVisible: true,
    },
    {
      position: 15,
      name: 'Hạng 13-16',
      eloPoints: 15,
      spaPoints: playerSpaPoints[16],
      cashPrize: prizeDistribution16[15],
      items: [],
      isVisible: true,
    },
    {
      position: 16,
      name: 'Hạng 13-16',
      eloPoints: 15,
      spaPoints: playerSpaPoints[16],
      cashPrize: prizeDistribution16[16],
      items: [],
      isVisible: true,
    },
    {
      position: 99,
      name: 'Tham gia',
      eloPoints: eloPoints.participation,
      spaPoints: playerSpaPoints.participation,
      cashPrize: 0,
      items: [],
      isVisible: true,
    },
  ];

  const result = {
    totalPrize,
    showPrizes: totalPrize > 0,
    positions,
    specialAwards: [],
  };

  console.log('calculateRewards result:', result);
  return result;
};
