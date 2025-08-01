// Mock Rank Service - simplified for build compatibility

export interface DatabaseRankDefinition {
  rank_code: string;
  rank_name: string;
  rank_description: string;
  promotion_requirements: any;
  elo_requirement: number;
  spa_requirement: number;
}

export interface TournamentReward {
  position: number;
  spaPoints: number;
  description: string;
}

export interface SpaReward {
  type: string;
  points: number;
  description: string;
}

export const rankService = {
  async getAllRanks() {
    return [];
  },

  async getRankByCode(code: string) {
    return null;
  },

  async getRankInfo(rankCode: string) {
    return null;
  },

  async getRankCodes() {
    return [];
  },

  async getRanksByGroup(group: string) {
    return [];
  },

  async getTournamentRewards() {
    return [];
  },

  async getRankByElo(elo: number) {
    return null;
  },

  async getNextRank(currentRank: string) {
    return null;
  },

  async getPreviousRank(currentRank: string) {
    return null;
  },

  async clearCache() {
    return true;
  },

  async calculateTournamentRewards(): Promise<TournamentReward[]> {
    return [];
  },

  async getSpaRewards(): Promise<SpaReward[]> {
    return [];
  },
};

export class RankService {
  static async getRankDefinitions(): Promise<DatabaseRankDefinition[]> {
    console.log('Mock get rank definitions');
    return [
      {
        rank_code: 'K',
        rank_name: 'Beginner',
        rank_description: 'Starting rank',
        promotion_requirements: {},
        elo_requirement: 1000,
        spa_requirement: 0,
      },
    ];
  }

  static async updateRankDefinition(
    rankCode: string,
    data: Partial<DatabaseRankDefinition>
  ) {
    console.log('Mock update rank definition:', rankCode, data);
    return { success: true };
  }

  static async createRankDefinition(data: DatabaseRankDefinition) {
    console.log('Mock create rank definition:', data);
    return { success: true, data };
  }

  static async deleteRankDefinition(rankCode: string) {
    console.log('Mock delete rank definition:', rankCode);
    return { success: true };
  }

  static async getTournamentRewardStructures() {
    console.log('Mock get tournament reward structures');
    return [];
  }

  static async calculateRankPromotion(userId: string) {
    console.log('Mock calculate rank promotion:', userId);
    return { promoted: false, newRank: null };
  }
}
