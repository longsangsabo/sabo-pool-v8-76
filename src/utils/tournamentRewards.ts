
import { TournamentRewards } from '@/types/tournament-extended';
import { RankCode } from '@/utils/eloConstants';

export interface TournamentRewardsCalculation {
  totalPrize: number;
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

export const calculateRewards = (
  tournament: any,
  playerRank: RankCode = 'K'
): TournamentRewardsCalculation => {
  console.log('🔍 calculateRewards input:', { 
    tournament_id: tournament?.id,
    prize_pool: tournament?.prize_pool,
    entry_fee: tournament?.entry_fee, 
    max_participants: tournament?.max_participants,
    playerRank 
  });
  
  // ✅ CRITICAL: Prioritize user-set prize_pool - NEVER override it
  let totalPrize = 0;
  
  if (tournament.prize_pool && tournament.prize_pool > 0) {
    totalPrize = tournament.prize_pool;
    console.log('✅ [calculateRewards] Using user-set prize_pool:', totalPrize);
  } else if (tournament.entry_fee && tournament.max_participants) {
    totalPrize = tournament.entry_fee * tournament.max_participants * 0.75; // ✅ FIXED: Use 75% as fallback calculation
    console.log('✅ [calculateRewards] Calculated from entry_fee (75%):', totalPrize);
  }
  
  console.log('🎯 Final totalPrize used:', totalPrize);

  // Calculate prize distribution based on totalPrize
  const prizeDistribution = {
    1: Math.floor(totalPrize * 0.5), // 50% for 1st place
    2: Math.floor(totalPrize * 0.3), // 30% for 2nd place
    3: Math.floor(totalPrize * 0.2), // 20% for 3rd place
  };

  // Default ELO points based on position
  const eloPoints = {
    1: 100, // Champion
    2: 50,  // Runner-up
    3: 25,  // Third place
    4: 12,  // Fourth place
    8: 6,   // Top 8
    16: 3,  // Top 16
    participation: 1
  };

  // SPA points based on player rank and position
  const spaPointsMap: { [key in RankCode]: { [key: string]: number } } = {
    'K': { 1: 900, 2: 700, 3: 500, 4: 350, 8: 120, participation: 100 },
    'K+': { 1: 950, 2: 750, 3: 550, 4: 375, 8: 135, participation: 100 },
    'I': { 1: 1000, 2: 800, 3: 600, 4: 400, 8: 150, participation: 100 },
    'I+': { 1: 1050, 2: 825, 3: 625, 4: 425, 8: 165, participation: 100 },
    'H': { 1: 1100, 2: 850, 3: 650, 4: 450, 8: 200, participation: 100 },
    'H+': { 1: 1150, 2: 875, 3: 675, 4: 475, 8: 220, participation: 100 },
    'G': { 1: 1200, 2: 900, 3: 700, 4: 500, 8: 250, participation: 100 },
    'G+': { 1: 1275, 2: 950, 3: 750, 4: 525, 8: 265, participation: 100 },
    'F': { 1: 1350, 2: 1000, 3: 800, 4: 550, 8: 280, participation: 110 },
    'F+': { 1: 1425, 2: 1050, 3: 850, 4: 575, 8: 295, participation: 110 },
    'E': { 1: 1500, 2: 1100, 3: 900, 4: 650, 8: 320, participation: 120 },
    'E+': { 1: 1600, 2: 1200, 3: 1000, 4: 700, 8: 350, participation: 130 }
  };

  const playerSpaPoints = spaPointsMap[playerRank] || spaPointsMap['K'];

  const positions = [
    {
      position: 1,
      name: 'Vô địch',
      eloPoints: eloPoints[1],
      spaPoints: playerSpaPoints[1],
      cashPrize: prizeDistribution[1],
      items: ['Cúp vô địch'],
      isVisible: true
    },
    {
      position: 2,
      name: 'Á quân',
      eloPoints: eloPoints[2],
      spaPoints: playerSpaPoints[2],
      cashPrize: prizeDistribution[2],
      items: ['Huy chương bạc'],
      isVisible: true
    },
    {
      position: 3,
      name: 'Hạng ba',
      eloPoints: eloPoints[3],
      spaPoints: playerSpaPoints[3],
      cashPrize: prizeDistribution[3],
      items: ['Huy chương đồng'],
      isVisible: true
    },
    {
      position: 4,
      name: 'Hạng tư',
      eloPoints: eloPoints[4],
      spaPoints: playerSpaPoints[4],
      cashPrize: 0,
      items: [],
      isVisible: true
    },
    {
      position: 8,
      name: 'Top 8',
      eloPoints: eloPoints[8],
      spaPoints: playerSpaPoints[8],
      cashPrize: 0,
      items: [],
      isVisible: true
    },
    {
      position: 16,
      name: 'Top 16',
      eloPoints: eloPoints[16],
      spaPoints: playerSpaPoints[16],
      cashPrize: 0,
      items: [],
      isVisible: true
    },
    {
      position: 99,
      name: 'Tham gia',
      eloPoints: eloPoints.participation,
      spaPoints: playerSpaPoints.participation,
      cashPrize: 0,
      items: [],
      isVisible: true
    }
  ];

  const result = {
    totalPrize,
    positions,
    specialAwards: []
  };

  console.log('calculateRewards result:', result);
  return result;
};
