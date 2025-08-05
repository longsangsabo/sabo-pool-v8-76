// Mock Optimized Query Service - simplified for build compatibility

export interface BatchedProfile {
  user_id: string;
  full_name: string;
  display_name: string;
  phone: string;
  email: string;
  avatar_url: string;
}

export class OptimizedQueryService {
  static async getBatchedProfiles(
    userIds: string[]
  ): Promise<BatchedProfile[]> {
    console.log('Mock get batched profiles:', userIds);
    return userIds.map(id => ({
      user_id: id,
      full_name: 'Mock User',
      display_name: 'Mock',
      phone: '123-456-7890',
      email: 'mock@example.com',
      avatar_url: '/default-avatar.png',
    }));
  }

  static async getOptimizedTournamentData(tournamentId: string) {
    console.log('Mock get optimized tournament data:', tournamentId);
    return {
      success: true,
      tournament: { id: tournamentId, name: 'Mock Tournament' },
      registrations: [],
      participants: [],
    };
  }

  static async getBatchedRankVerifications(limit = 100) {
    console.log('Mock get batched rank verifications:', limit);
    return [];
  }

  static async getOptimizedLeaderboard(options?: any) {
    console.log('Mock get optimized leaderboard:', options);
    return {
      success: true,
      leaderboard: [],
      total: 0,
    };
  }
}
