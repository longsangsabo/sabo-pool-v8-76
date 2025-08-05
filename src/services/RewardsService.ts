import {
  TournamentRewards,
  RewardPosition,
  SpecialAward,
} from '@/types/tournament-extended';
import { RankCode } from '@/utils/eloConstants';

export class RewardsService {
  /**
   * Calculate tournament rewards based on position, rank, and tournament settings
   */
  static calculateTournamentRewards(
    position: string,
    rank: RankCode,
    maxParticipants: number = 16,
    prizePool: number = 0
  ): TournamentRewards {
    const positions = this.generateStandardPositions(
      maxParticipants,
      rank,
      prizePool
    );
    const specialAwards = this.generateSpecialAwards(prizePool);

    return {
      totalPrize: prizePool,
      showPrizes: prizePool > 0,
      positions,
      specialAwards,
    };
  }

  /**
   * Generate standard tournament positions with rewards
   */
  private static generateStandardPositions(
    maxParticipants: number,
    rank: RankCode,
    prizePool: number
  ): RewardPosition[] {
    const positions: RewardPosition[] = [];

    // Calculate prize distribution if there's a prize pool
    const prizeDistribution = this.calculatePrizeDistribution(prizePool);

    // Champion
    positions.push({
      position: 1,
      name: 'Vô địch',
      eloPoints: this.getEloPoints('champion', rank),
      spaPoints: this.getSpaPoints('champion', rank),
      cashPrize: prizeDistribution.champion,
      items: ['Cúp vô địch', 'Huy chương vàng'],
      isVisible: true,
    });

    // Runner-up
    positions.push({
      position: 2,
      name: 'Á quân',
      eloPoints: this.getEloPoints('runner_up', rank),
      spaPoints: this.getSpaPoints('runner_up', rank),
      cashPrize: prizeDistribution.runnerUp,
      items: ['Huy chương bạc'],
      isVisible: true,
    });

    // Third place
    positions.push({
      position: 3,
      name: 'Hạng ba',
      eloPoints: this.getEloPoints('third_place', rank),
      spaPoints: this.getSpaPoints('third_place', rank),
      cashPrize: prizeDistribution.thirdPlace,
      items: ['Huy chương đồng'],
      isVisible: true,
    });

    // Top 4 (for larger tournaments)
    if (maxParticipants >= 8) {
      positions.push({
        position: 4,
        name: 'Hạng tư',
        eloPoints: this.getEloPoints('top_4', rank),
        spaPoints: this.getSpaPoints('top_4', rank),
        cashPrize: prizeDistribution.fourthPlace,
        items: [],
        isVisible: true,
      });
    }

    // Top 8 (for larger tournaments)
    if (maxParticipants >= 16) {
      positions.push({
        position: 8,
        name: 'Top 8',
        eloPoints: this.getEloPoints('top_8', rank),
        spaPoints: this.getSpaPoints('top_8', rank),
        cashPrize: 0,
        items: [],
        isVisible: true,
      });
    }

    // Participation reward
    positions.push({
      position: maxParticipants,
      name: 'Tham gia',
      eloPoints: this.getEloPoints('participation', rank),
      spaPoints: this.getSpaPoints('participation', rank),
      cashPrize: 0,
      items: [],
      isVisible: true,
    });

    return positions;
  }

  /**
   * Generate special awards for tournaments
   */
  private static generateSpecialAwards(prizePool: number): SpecialAward[] {
    const specialAwards: SpecialAward[] = [];

    if (prizePool > 0) {
      specialAwards.push({
        id: 'fair_play',
        name: 'Giải Fair Play',
        description: 'Dành cho người chơi có tinh thần thể thao tốt nhất',
        cashPrize: 0, // ✅ FIXED: Default to 0 instead of 5% of prize pool
        criteria: 'Bình chọn của Ban tổ chức',
      });
    }

    return specialAwards;
  }

  /**
   * Calculate prize distribution based on total prize pool
   */
  private static calculatePrizeDistribution(prizePool: number): {
    champion: number;
    runnerUp: number;
    thirdPlace: number;
    fourthPlace: number;
  } {
    if (prizePool <= 0) {
      return { champion: 0, runnerUp: 0, thirdPlace: 0, fourthPlace: 0 };
    }

    return {
      champion: Math.floor(prizePool * 0.5),
      runnerUp: Math.floor(prizePool * 0.3),
      thirdPlace: Math.floor(prizePool * 0.15),
      fourthPlace: Math.floor(prizePool * 0.05),
    };
  }

  /**
   * Get ELO points for position and rank
   */
  private static getEloPoints(position: string, rank: RankCode): number {
    const eloTable: Record<string, Partial<Record<RankCode, number>>> = {
      champion: {
        K: 200,
        'K+': 210,
        I: 180,
        'I+': 190,
        H: 160,
        'H+': 170,
        G: 140,
        'G+': 150,
        F: 120,
        'F+': 130,
        E: 100,
        'E+': 110,
      },
      runner_up: {
        K: 150,
        'K+': 155,
        I: 135,
        'I+': 140,
        H: 120,
        'H+': 125,
        G: 105,
        'G+': 110,
        F: 90,
        'F+': 95,
        E: 75,
        'E+': 80,
      },
      third_place: {
        K: 100,
        'K+': 105,
        I: 90,
        'I+': 95,
        H: 80,
        'H+': 85,
        G: 70,
        'G+': 75,
        F: 60,
        'F+': 65,
        E: 50,
        'E+': 55,
      },
      top_4: {
        K: 75,
        'K+': 78,
        I: 70,
        'I+': 73,
        H: 65,
        'H+': 68,
        G: 60,
        'G+': 63,
        F: 55,
        'F+': 58,
        E: 50,
        'E+': 53,
      },
      top_8: {
        K: 50,
        'K+': 52,
        I: 45,
        'I+': 47,
        H: 40,
        'H+': 42,
        G: 35,
        'G+': 37,
        F: 30,
        'F+': 32,
        E: 25,
        'E+': 27,
      },
      participation: {
        K: 25,
        'K+': 25,
        I: 20,
        'I+': 20,
        H: 15,
        'H+': 15,
        G: 10,
        'G+': 10,
        F: 5,
        'F+': 5,
        E: 0,
        'E+': 0,
      },
    };

    return eloTable[position]?.[rank] || 0;
  }

  /**
   * Get SPA points for position and rank
   */
  private static getSpaPoints(position: string, rank: RankCode): number {
    const spaTable: Record<string, Partial<Record<RankCode, number>>> = {
      champion: {
        K: 900,
        'K+': 950,
        I: 1000,
        'I+': 1050,
        H: 1100,
        'H+': 1150,
        G: 1200,
        'G+': 1275,
        F: 1350,
        'F+': 1425,
        E: 1500,
        'E+': 1600,
      },
      runner_up: {
        K: 700,
        'K+': 750,
        I: 800,
        'I+': 825,
        H: 850,
        'H+': 875,
        G: 900,
        'G+': 950,
        F: 1000,
        'F+': 1050,
        E: 1100,
        'E+': 1200,
      },
      third_place: {
        K: 500,
        'K+': 550,
        I: 600,
        'I+': 625,
        H: 650,
        'H+': 675,
        G: 700,
        'G+': 750,
        F: 800,
        'F+': 850,
        E: 900,
        'E+': 1000,
      },
      top_4: {
        K: 350,
        'K+': 375,
        I: 400,
        'I+': 425,
        H: 450,
        'H+': 475,
        G: 500,
        'G+': 525,
        F: 550,
        'F+': 575,
        E: 650,
        'E+': 700,
      },
      top_8: {
        K: 120,
        'K+': 135,
        I: 150,
        'I+': 165,
        H: 200,
        'H+': 220,
        G: 250,
        'G+': 265,
        F: 280,
        'F+': 295,
        E: 320,
        'E+': 350,
      },
      participation: {
        K: 100,
        'K+': 100,
        I: 100,
        'I+': 100,
        H: 100,
        'H+': 100,
        G: 100,
        'G+': 100,
        F: 110,
        'F+': 110,
        E: 120,
        'E+': 130,
      },
    };

    return spaTable[position]?.[rank] || 0;
  }

  /**
   * Validate rewards structure
   */
  static validateRewards(rewards: TournamentRewards): boolean {
    if (!rewards || typeof rewards !== 'object') return false;

    // Check required fields
    if (typeof rewards.totalPrize !== 'number') return false;
    if (typeof rewards.showPrizes !== 'boolean') return false;
    if (!Array.isArray(rewards.positions)) return false;
    if (!Array.isArray(rewards.specialAwards)) return false;

    // Validate positions
    for (const position of rewards.positions) {
      if (!this.validatePosition(position)) return false;
    }

    // Validate special awards
    for (const award of rewards.specialAwards) {
      if (!this.validateSpecialAward(award)) return false;
    }

    return true;
  }

  /**
   * Validate individual position
   */
  private static validatePosition(position: RewardPosition): boolean {
    return (
      typeof position.position === 'number' &&
      typeof position.name === 'string' &&
      typeof position.eloPoints === 'number' &&
      typeof position.spaPoints === 'number' &&
      typeof position.cashPrize === 'number' &&
      Array.isArray(position.items) &&
      typeof position.isVisible === 'boolean'
    );
  }

  /**
   * Validate special award
   */
  private static validateSpecialAward(award: SpecialAward): boolean {
    return (
      typeof award.id === 'string' &&
      typeof award.name === 'string' &&
      typeof award.cashPrize === 'number' &&
      (award.description === undefined ||
        typeof award.description === 'string') &&
      (award.criteria === undefined || typeof award.criteria === 'string')
    );
  }

  /**
   * Create empty rewards structure
   */
  static createEmptyRewards(): TournamentRewards {
    return {
      totalPrize: 0,
      showPrizes: false,
      positions: [],
      specialAwards: [],
    };
  }

  /**
   * Convert any rewards-like object to proper TournamentRewards structure
   */
  static normalizeRewards(rewards: any): TournamentRewards {
    if (!rewards || typeof rewards !== 'object') {
      return this.createEmptyRewards();
    }

    const normalized: TournamentRewards = {
      totalPrize:
        typeof rewards.totalPrize === 'number' ? rewards.totalPrize : 0,
      showPrizes:
        typeof rewards.showPrizes === 'boolean' ? rewards.showPrizes : false,
      positions: [],
      specialAwards: [],
    };

    // Normalize positions
    if (Array.isArray(rewards.positions)) {
      normalized.positions = rewards.positions.map((pos: any) => ({
        position: typeof pos.position === 'number' ? pos.position : 1,
        name:
          typeof pos.name === 'string'
            ? pos.name
            : `Position ${pos.position || 1}`,
        eloPoints: typeof pos.eloPoints === 'number' ? pos.eloPoints : 0,
        spaPoints: typeof pos.spaPoints === 'number' ? pos.spaPoints : 0,
        cashPrize: typeof pos.cashPrize === 'number' ? pos.cashPrize : 0,
        items: Array.isArray(pos.items) ? pos.items : [],
        isVisible: typeof pos.isVisible === 'boolean' ? pos.isVisible : true,
      }));
    }

    // Normalize special awards
    if (Array.isArray(rewards.specialAwards)) {
      normalized.specialAwards = rewards.specialAwards.map((award: any) => ({
        id: typeof award.id === 'string' ? award.id : Date.now().toString(),
        name: typeof award.name === 'string' ? award.name : 'Special Award',
        description:
          typeof award.description === 'string' ? award.description : '',
        cashPrize: typeof award.cashPrize === 'number' ? award.cashPrize : 0,
        criteria: typeof award.criteria === 'string' ? award.criteria : '',
      }));
    }

    return normalized;
  }
}

export default RewardsService;
